# frozen_string_literal: true

module ShopifyApp

  SHOP_QUERY = <<~GRAPHQL
    query {
      shop {
        email
        name
      }
    }
  GRAPHQL

  APP_SUBSCRIPTION_WEBHOOK = <<~GRAPHQL
    mutation webhookSubscriptionCreate($callbackUrl: URL!) {
      webhookSubscriptionCreate(topic: APP_SUBSCRIPTIONS_UPDATE, webhookSubscription: {callbackUrl: $callbackUrl, format: JSON}) {
        webhookSubscription {
          id
          callbackUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  GRAPHQL

  # Performs login after OAuth completes
  class CallbackController < ActionController::Base
    include ShopifyApp::LoginProtection
    include ShopifyApp::EnsureBilling
    include Shopify::IntegrationHelper
    include EmailHelper

    def callback
      Rails.logger.info("Got Shopify callback");
      begin
        api_session, cookie = validated_auth_objects
      rescue => error
        if error.class.module_parent == ShopifyAPI::Errors
          callback_rescue(error)
          return respond_with_error
        else
          raise error
        end
      end

      save_session(api_session) if api_session
      update_rails_cookie(api_session, cookie)

      return respond_with_user_token_flow if start_user_token_flow?(api_session)

      Rails.logger.info("Params #{params} #{api_session}")

      account_id = verify_shopify_token(params[:state])

      shop = get_shop_data(api_session.shop, api_session.access_token)

      hook = Integrations::Hook.find_by(reference_id: api_session.shop, app_id: 'shopify')

      @new_login = false

      # Account id is not given and there's also no hook for this shop, create new account for the shop
      if (account_id == nil or !Account.find(account_id).present?) && !hook.present?
        @new_login = true
        account_id = get_account_for_shop(api_session.shop, shop)

        set_cookies(@resource.create_new_auth_token)
      end

      # We are authenticated in another account, auth one with the opened app.
      if hook.present? and account_id != hook.account.id
        account = Account.find(hook.account.id)
        user = account.users.find_by(email: shop.email)
        if !user&.present?
          user = account.users.find { |user| User.find(AccountUser.find_by(user_id: user.id, role: 1).user_id) }
        end

        set_cookies(user.create_new_auth_token)
        return redirect_to(frontend_url)
      end

      if account_id == nil
        return redirect_to(frontend_url)
      end

      account ||= Account.find(account_id)

      if hook.present?
        return redirect_to(frontend_url)
      elsif !hook.present?
        shopify_shop = Shop.find_by(shopify_domain: api_session.shop)

        subscribe_subscription_hook(shopify_shop)

        account.hooks.create!(
          app_id: 'shopify',
          access_token: api_session.access_token,
          status: 'enabled',
          reference_id: api_session.shop,
          settings: {
            scope: api_session.scope
          }
        )

        Shopify::PopulateProductsJob.perform_now(
          shop_domain: api_session.shop,
          account_id: account.id
        );
      end

      webhooks = ShopifyAPI::Webhook.all(session: api_session)

      webhooks.each { |w| Rails.logger.info "Webhook configured: #{w.topic} - #{w.address}" }

      if ShopifyApp::VERSION < "23.0"
        # deprecated in 23.0
        if ShopifyApp.configuration.custom_post_authenticate_tasks.present?
          Rails.logger.info("Performing custom tasks")
          ShopifyApp.configuration.post_authenticate_tasks.perform(api_session)
        else
          Rails.logger.info("Performing basic tasks")
          perform_post_authenticate_jobs(api_session)
        end
      else
        ShopifyApp.configuration.post_authenticate_tasks.perform(api_session)
      end

      # redirect_to_app if check_billing(api_session) we maybe don't need this for now

      redirect_to(app_redirect_url(account_id))
    end

    private

    def get_account_for_shop(shop_domain, shop)
      user = User.find_by(email: shop.email)

      if user.present? then
        @resource = user
        acc_user = AccountUser.find_by(user_id: user.id)
        return acc_user.account_id
      else
        create_account_for_user(shop_domain, shop.email)

        @reset_pass_token = @resource.send(:set_reset_password_token)
        return @account.id
      end
    end

    def get_shop_data(shop_domain, access_token)
      response = HTTParty.post(
        "https://#{shop_domain}/admin/api/2025-07/graphql.json",
        headers: {
          'Content-Type' => 'application/json',
          'X-Shopify-Access-Token' => access_token
        },
        body: {
          query: SHOP_QUERY
        }.to_json
      )

      Rails.logger.info("Shop data: #{response.parsed_response}");

      shop = OpenStruct.new(response.parsed_response["data"]["shop"])
      shop
    end

    def set_cookies(token_data)
      cookie_headers = {
        DeviseTokenAuth.headers_names[:'access-token'] => token_data['access-token'],
        DeviseTokenAuth.headers_names[:'token-type']   => 'Bearer',
        DeviseTokenAuth.headers_names[:client]         => token_data['client'],
        DeviseTokenAuth.headers_names[:expiry]         => token_data['expiry'],
        DeviseTokenAuth.headers_names[:uid]            => token_data['uid']
      }

      cookies[:cw_d_session_info] = {
        value: cookie_headers.to_json,
        expires: Time.at(token_data['expiry'].to_i),
        secure: Rails.env.production?,
        http_only: false,
        same_site: :lax
      }
    end

    def create_account_for_user(shop_name, email)
      @resource, @account = AccountBuilder.new(
        account_name: extract_domain_without_tld(email),
        user_full_name: shop_name,
        email: email,
        locale: I18n.locale,
        confirmed: true
      ).perform

      @account.update(custom_attributes: @account.custom_attributes.merge({ account_origin_shopify_store: shop_name }))
      @account.save
    end

    def reset_password_url
      URI.join(frontend_url, "/app/auth/password/edit?config=default&reset_password_token=#{@reset_pass_token}")
    end

    def admin_token_endpoint
      URI.join(keycloak_url, "/realms/#{keycloak_realm}/protocol/openid-connect/token")
    end
    
    def users_endpoint
      URI.join(keycloak_url, "/admin/realms/#{keycloak_realm}/users")
    end

    def keycloak_url
      ENV.fetch('KEYCLOAK_URL', nil)
    end

    def keycloak_realm
      ENV.fetch('KEYCLOAK_REALM', nil)
    end

    def keycloak_client_id
      ENV.fetch('KEYCLOAK_CLIENT_ID', nil)
    end

    def keycloak_client_secret
      ENV.fetch('KEYCLOAK_CLIENT_SECRET', nil)
    end

    def keycloak_callback_url
      ENV.fetch('KEYCLOAK_CALLBACK_URL', nil)
    end

    def app_redirect_url(account_id)
      if @reset_pass_token.present?
        return reset_password_url
      end

      if @new_login then
        return "#{frontend_url}/app/accounts/#{account_id}/start/setup-profile"
      end

      return "#{frontend_url}/app/accounts/#{account_id}/settings/integrations/shopify"
    end

    def subscribe_subscription_hook(shop)
      shop.with_shopify_session do
        ShopifyGraphql.execute(
          APP_SUBSCRIPTION_WEBHOOK,
          callbackUrl: app_subscription_webhook_url
        )
      end
    end

    def app_subscription_webhook_url
      frontend_url + '/shopify/webhooks/app_subscriptions_update'
    end

    def frontend_url
      ENV.fetch('FRONTEND_URL', nil)
    end

    def callback_rescue(error)
      ShopifyApp::Logger.debug("#{error.class} was rescued and redirected to login_url_with_optional_shop")
    end

    def deprecate_callback_rescue(error)
      message = <<~EOS
        An error of type #{error.class} was rescued. This is not part of `ShopifyAPI::Errors`, which could indicate a
        bug in your app, or a bug in the shopify_app gem. Future versions of the gem may re-raise this error rather
        than rescuing it.
      EOS
      ShopifyApp::Logger.deprecated(message, "22.0.0")
    end

    def save_session(api_session)
      ShopifyApp::SessionRepository.store_session(api_session)
    end

    def validated_auth_objects
      filtered_params = request.parameters.symbolize_keys.slice(:code, :shop, :timestamp, :state, :host, :hmac)

      oauth_payload = ShopifyAPI::Auth::Oauth.validate_auth_callback(
        cookies: {
          ShopifyAPI::Auth::Oauth::SessionCookie::SESSION_COOKIE_NAME =>
            cookies.encrypted[ShopifyAPI::Auth::Oauth::SessionCookie::SESSION_COOKIE_NAME],
        },
        auth_query: ShopifyAPI::Auth::Oauth::AuthQuery.new(**filtered_params),
      )
      api_session = oauth_payload.dig(:session)
      cookie = oauth_payload.dig(:cookie)

      [api_session, cookie]
    end

    def update_rails_cookie(api_session, cookie)
      if cookie.value.present?
        cookies.encrypted[cookie.name] = {
          expires: cookie.expires,
          secure: true,
          http_only: true,
          value: cookie.value,
        }
      end

      session[:shopify_user_id] = api_session.associated_user.id if api_session.online?
      ShopifyApp::Logger.debug("Saving Shopify user ID to cookie")
    end

    def redirect_to_app
      if ShopifyAPI::Context.embedded?
        return_to = session.delete(:return_to)
        redirect_to = if fully_formed_url?(return_to)
          return_to
        else
          "#{decoded_host}#{return_to}"
        end

        redirect_to = ShopifyApp.configuration.root_url if deduced_phishing_attack?
        redirect_to(redirect_to, allow_other_host: true)
      else
        redirect_to(return_address)
      end
    end

    def fully_formed_url?(return_to)
      uri = Addressable::URI.parse(return_to)
      uri.present? && uri.scheme.present? && uri.host.present?
    end

    def decoded_host
      @decoded_host ||= ShopifyAPI::Auth.embedded_app_url(params[:host])
    end

    # host param doesn't match the configured myshopify_domain
    def deduced_phishing_attack?
      sanitized_host = ShopifyApp::Utils.sanitize_shop_domain(URI(decoded_host).host)
      if sanitized_host.nil?
        ShopifyApp::Logger.info("host param from callback is not from a trusted domain")
        ShopifyApp::Logger.info("redirecting to root as this is likely a phishing attack")
      end
      sanitized_host.nil?
    end

    def respond_with_error
      flash[:error] = I18n.t("could_not_log_in")
      redirect_to(login_url_with_optional_shop)
    end

    def respond_with_user_token_flow
      redirect_to(login_url_with_optional_shop)
    end

    def start_user_token_flow?(shopify_session)
      return false unless ShopifyApp::SessionRepository.user_storage.present?
      return false if shopify_session.online?

      update_user_access_scopes?
    end

    def update_user_access_scopes?
      return true if session[:shopify_user_id].nil?

      user_access_scopes_strategy.update_access_scopes?(shopify_user_id: session[:shopify_user_id])
    end

    def user_access_scopes_strategy
      ShopifyApp.configuration.user_access_scopes_strategy
    end

    def perform_post_authenticate_jobs(session)
      # Ensure we use the shop session to install webhooks
      session_for_shop = session.online? ? shop_session : session

      install_webhooks(session_for_shop)

      perform_after_authenticate_job(session)
    end

    def install_webhooks(session)
      Rails.logger.info("Installing webhooks #{ShopifyApp.configuration.has_webhooks?}")
      return unless ShopifyApp.configuration.has_webhooks?

      Rails.logger.info("Installing webhooks #{ShopifyApp.configuration.webhooks}")

      WebhooksManager.queue(session.shop, session.access_token)
    end

    def perform_after_authenticate_job(session)
      config = ShopifyApp.configuration.after_authenticate_job

      return unless config && config[:job].present?

      job = config[:job]
      job = job.constantize if job.is_a?(String)

      if config[:inline] == true
        job.perform_now(shop_domain: session.shop)
      else
        job.perform_later(shop_domain: session.shop)
      end
    end
  end
end
