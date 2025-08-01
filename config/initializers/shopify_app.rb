ShopifyApp.configure do |config|
  config.application_name = "OneHash Chat"
  config.old_secret = ""
  config.root_url = '/shopify'
  config.login_callback_url = '/shopify/auth/shopify/callback'

  # FIXME: These scopes aren't even used, beware
  config.scope = "read_customers,read_orders,write_orders,read_fulfillments" # Consult this page for more scope options: https://shopify.dev/docs/api/usage/access-scopes
  config.embedded_app = false
  # REVIEW: this is for the new auth which is separate from the oauth flow we are currently using
  config.new_embedded_auth_strategy = false

  config.after_authenticate_job = false
  config.api_version = "2025-04"
  config.shop_session_repository = 'Shop'
  config.log_level = :debug
  config.reauth_on_access_scope_changes = true

  config.webhooks = [
    { topic: "products/create", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/products_create" },
    { topic: "products/update", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/products_update" },
    { topic: "products/delete", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/products_delete" },
    { topic: "orders/updated", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/orders_updated" },
    { topic: "orders/create", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/orders_create" },
    { topic: "shop/redact", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/shop_redact" },
    { topic: "customers/redact", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/customers_redact" },
    { topic: "customers/data_request", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/customers_data_request" },
    { topic: "app/uninstalled", address: "#{ENV.fetch('SHOPIFY_WEBHOOK_HOST', '')}/shopify/webhooks/app_uninstalled" }
  ]

  config.api_key = ENV.fetch('SHOPIFY_API_KEY', '').presence
  config.secret = ENV.fetch('SHOPIFY_API_SECRET', '').presence

  # You may want to charge merchants for using your app. Setting the billing configuration will cause the Authenticated
  # controller concern to check that the session is for a merchant that has an active one-time payment or subscription.
  # If no payment is found, it starts off the process and sends the merchant to a confirmation URL so that they can
  # approve the purchase.
  #
  # Learn more about billing in our documentation: https://shopify.dev/apps/billing
  # config.billing = ShopifyApp::BillingConfiguration.new(
  #   charge_name: "My app billing charge",
  #   amount: 5,
  #   interval: ShopifyApp::BillingConfiguration::INTERVAL_EVERY_30_DAYS,
  #   currency_code: "USD", # Only supports USD for now
  #   trial_days: 0,
  #   test: !ENV['SHOPIFY_TEST_CHARGES'].nil? ? ["true", "1"].include?(ENV['SHOPIFY_TEST_CHARGES']) : !Rails.env.production?
  # )

  if defined? Rails::Server
    raise('Missing SHOPIFY_API_KEY. See https://github.com/Shopify/shopify_app#requirements') unless config.api_key
    raise('Missing SHOPIFY_API_SECRET. See https://github.com/Shopify/shopify_app#requirements') unless config.secret
  end
end

Rails.application.config.after_initialize do
  if ShopifyApp.configuration.api_key.present? && ShopifyApp.configuration.secret.present?
    ShopifyAPI::Context.setup(
      api_key: ShopifyApp.configuration.api_key,
      api_secret_key: ShopifyApp.configuration.secret,
      api_version: ShopifyApp.configuration.api_version,
      host: ENV['HOST'],
      # scope: ShopifyApp.configuration.scope,
      scope: "read_customers,read_orders,read_fulfillments,write_orders,read_all_orders",
      is_private: !ENV.fetch('SHOPIFY_APP_PRIVATE_SHOP', '').empty?,
      is_embedded: ShopifyApp.configuration.embedded_app,
      log_level: :debug,
      logger: Rails.logger,
      private_shop: ENV.fetch('SHOPIFY_APP_PRIVATE_SHOP', nil),
      user_agent_prefix: "ShopifyApp/#{ShopifyApp::VERSION}"
    )

    ShopifyApp::WebhooksManager.add_registrations
  end
end
