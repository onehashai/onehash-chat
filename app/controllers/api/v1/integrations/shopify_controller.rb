class Api::V1::Integrations::ShopifyController < ApplicationController
  include Shopify::IntegrationHelper


  def redirect_uri
    "#{ENV.fetch('FRONTEND_URL', '')}/shopify/auth/shopify/callback"
  end

  def auth
    shop_domain = params[:shop]

    return render json: { error: 'Shop domain is required' }, status: :unprocessable_entity if shop_domain.blank?

    state = generate_shopify_token(nil)

    auth_url = "https://#{shop_domain}/admin/oauth/authorize?"
    auth_url += URI.encode_www_form(
      client_id: client_id,
      scope: REQUIRED_SCOPES.join(','),
      redirect_uri: redirect_uri,
      state: state
    )

    cookie = ShopifyAPI::Auth::Oauth::SessionCookie.new(value:state, expires: Time.now + 60)

    cookies.encrypted[cookie.name] = {
      expires: cookie.expires,
      secure: true,
      http_only: true,
      value: cookie.value,
    }

    Rails.logger.info("Redirecting to #{auth_url}")
    render json: { redirect_url: auth_url }
  end
end