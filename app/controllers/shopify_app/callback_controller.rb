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

      new_login = false
      if account_id == nil
        new_login = true
        account_id = get_account_for_shop(api_session.shop, api_session.access_token)

        token_data = @resource.create_new_auth_token

        # Build EXACT header-format map of auth token values (matching what's returned in response.headers)
        cookie_headers = {
          DeviseTokenAuth.headers_names[:'access-token'] => token_data['access-token'],
          DeviseTokenAuth.headers_names[:'token-type']   => 'Bearer',
          DeviseTokenAuth.headers_names[:client]         => token_data['client'],
          DeviseTokenAuth.headers_names[:expiry]         => token_data['expiry'],
          DeviseTokenAuth.headers_names[:uid]            => token_data['uid']
        }

        # Set cookie with exact value the JS frontend expects to read from
        cookies[:cw_d_session_info] = {
          value: cookie_headers.to_json,
          expires: Time.at(token_data['expiry'].to_i),
          secure: Rails.env.production?,
          http_only: false,        # Frontend needs to read it with JS
          same_site: :lax          # Change to :none if needed for cross-site embedded
        }
      end

      account ||= Account.find(account_id)

      account.hooks.create!(
        app_id: 'shopify',
        access_token: api_session.access_token,
        status: 'enabled',
        reference_id: api_session.shop,
        settings: {
          scope: api_session.scope
        }
      )

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

      # redirect_to_app if check_billing(api_session) we maybe this for now

      redirect_to(app_redirect_url(account_id, new_login))
    end

    private

    def get_account_for_shop(shop, access_token)
      admin_token_info = HTTParty.post(admin_token_endpoint, {
                                        headers: {
                                          'Content-Type': 'application/x-www-form-urlencoded',
                                        },
                                        body: {
                                          "grant_type":"client_credentials",
                                          'client_id':"#{keycloak_client_id}",
                                          'client_secret':"#{keycloak_client_secret}",
                                        }
                                      })

      @admin_token = admin_token_info.parsed_response["access_token"]

      Rails.logger.info("Admin token info: #{@admin_token}");

      response = HTTParty.post(
        "https://#{shop}/admin/api/2025-07/graphql.json",
        headers: {
          'Content-Type' => 'application/json',
          'X-Shopify-Access-Token' => access_token
        },
        body: {
          query: SHOP_QUERY
        }.to_json
      )

      # Print parsed response

      Rails.logger.info("Shop data: #{response.parsed_response}");

      shop = OpenStruct.new(response.parsed_response["data"]["shop"])

      get_user_info(shop.email)

      Rails.logger.info("User data: #{@user_info}");
      if @user_info.present? then
        user = User.find_by(email: @user_info['email'])
        return user.account.id
      else
        password = generate_secure_password

        response = HTTParty.post(users_endpoint, {
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': "Bearer #{@admin_token}",
                                        },
                                        body: {
                                          "email":shop.email,
                                          "enabled":true,
                                          "username":shop.name,
                                          "credentials": [
                                            {
                                              "type": "password",
                                              "value": password,
                                              "temporary": true
                                            }
                                          ]
                                        }.to_json
                                      })


        Rails.logger.info("Creation result: #{response.parsed_response}")

        if response.code == 201
          get_user_info(shop.email)
          create_account_for_user(password)
          return @account.id
        else
          Rails.logger.error("No account available for the shop")
          return nil
        end
      end

      return admin_token_info
    end

    def get_user_info(email)
      result = HTTParty.get(users_endpoint, {
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': "Bearer #{@admin_token}",
                                      },
                                      query: {
                                        "email": email
                                      }
                                    })
      
      if(result.code == 200) then
        @user_info = result.parsed_response.first
      else
        @user_info = nil
      end
    end

    def generate_secure_password(length = 9)
      raise ArgumentError, "Password length must be at least 4" if length < 4

      uppercase = ('A'..'Z').to_a.sample
      lowercase = ('a'..'z').to_a.sample
      digit     = ('0'..'9').to_a.sample
      symbol    = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '+', '='].sample

      # Combine all character sets for the rest of the characters
      all_chars = [('A'..'Z'), ('a'..'z'), ('0'..'9'), ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '+', '=']].flat_map(&:to_a)

      # Fill remaining characters
      remaining_chars = Array.new(length - 4) { all_chars.sample }

      # Combine and shuffle to ensure random order
      password = ([uppercase, lowercase, digit, symbol] + remaining_chars).shuffle.join

      password
    end




    def create_account_for_user(password)
      @resource, @account = AccountBuilder.new(
        account_name: extract_domain_without_tld(@user_info['email']),
        user_full_name: @user_info['email'],
        email: @user_info['email'],
        user_password: password,
        locale: I18n.locale,
        confirmed: @user_info['email_verified']
      ).perform

      AdministratorNotifications::AccountNotificationMailer.with(account: @account).account_password(@account, password).deliver_now if @account
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

    def app_redirect_url(account_id, new_login)
      if new_login then
        return "#{ENV.fetch('FRONTEND_URL', nil)}/app/accounts/#{account_id}/start/setup-profile"
      end

      return "#{ENV.fetch('FRONTEND_URL', nil)}/app/accounts/#{account_id}/settings/integrations/shopify"
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
