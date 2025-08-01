class Api::V1::Accounts::Integrations::ShopifyController < Api::V1::Accounts::BaseController
  include Shopify::IntegrationHelper
  include ShopifyApp::LoginProtection
  include ShopifyApp::RedirectForEmbedded

  before_action :fetch_hook, except: [:auth]
  before_action :setup_shopify_context, only: [:orders, :destroy]
  before_action :validate_contact, only: [:orders]

  def auth
    shop_domain = params[:shop]

    return render json: {error: I18n.t('shopify.shop_domain_is_required')}, status: :unprocessable_entity if shop_domain.blank?

    return render json: {error: I18n.t('shopify.multi_store_not_supported')}, status: :unprocessable_entity  if Current.account.hooks.find_by(app_id: 'shopify').present? && Current.account.hooks.find_by(app_id: 'shopify').reference_id != shop_domain

    state = generate_shopify_token(Current.account.id)

    auth_url = "https://#{shop_domain}/admin/oauth/authorize?"
    auth_url += URI.encode_www_form(
      client_id: client_id,
      scope: REQUIRED_SCOPES.join(','),
      redirect_uri: redirect_uri,
      state: state
    )

    cookie = ShopifyAPI::Auth::Oauth::SessionCookie.new(value: state, expires: Time.now + 60)

    cookies.encrypted[cookie.name] = {
      expires: cookie.expires,
      secure: true,
      http_only: true,
      value: cookie.value,
    }

    Rails.logger.info("Redirecting to #{auth_url}")
    render json: { redirect_url: auth_url }
  end

  def orders
    if !contact.custom_attributes['shopify_customer_id'].present?
      PopulateShopifyContactDataJob.perform_now(account_id: Current.account.id, id: contact.id, email: contact.email, phone_number: contact.phone_number)

      @contact = Current.account.contacts.find(contact.id)
    end

    if !contact.custom_attributes['shopify_customer_id'].present?
      render json: {orders: []} 
      return
    end

    # orders = fetch_orders(contact.custom_attributes['shopify_customer_id'])
    orders = Order.where(customer_id: contact.custom_attributes['shopify_customer_id'])

    render json: { orders: orders, shop: @hook.reference_id}
  rescue ShopifyAPI::Errors::HttpResponseError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def destroy
    shopify_client.delete(
      path: 'api_permissions/current.json',
    )
    head :ok
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def redirect_uri
    "#{ENV.fetch('FRONTEND_URL', '')}/shopify/auth/shopify/callback"
  end

  def contact
    @contact ||= Current.account.contacts.find_by(id: params[:contact_id])
  end

  def fetch_hook
    @hook = Integrations::Hook.find_by!(account: Current.account, app_id: 'shopify')
  end

  def fetch_orders(customer_id)
    orders = shopify_client.get(
      path: 'orders.json',
      query: {
        customer_id: customer_id,
        status: 'any',
        fields: 'id,email,created_at,total_price,currency,fulfillment_status,financial_status'
      }
    ).body['orders'] || []

    orders.map do |order|
      order.merge('admin_url' => "https://#{@hook.reference_id}/admin/orders/#{order['id']}")
    end
  end


  def setup_shopify_context
    @shopify_service =  Shopify::ClientService.new(Current.account)
  end

  def shopify_session
    @shopify_service.shopify_sesion
  end

  def shopify_client
    @shopify_service.shopify_client
  end

  def validate_contact
    return unless contact.blank? || (contact.email.blank? && contact.phone_number.blank?)

    render json: { error: 'Contact information missing' },
           status: :unprocessable_entity
  end
end
