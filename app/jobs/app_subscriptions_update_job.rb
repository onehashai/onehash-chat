class AppSubscriptionsUpdateJob < ActiveJob::Base
  extend ShopifyAPI::Webhooks::Handler

  class << self
    def handle(topic:, shop:, body:)
      perform_later(topic: topic, shop_domain: shop, webhook: body)
    end
  end

  def perform(topic:, shop_domain:, webhook:)
    shop = Shop.find_by(shopify_domain: shop_domain)

    if shop.nil?
      logger.error("#{self.class} failed: cannot find shop with domain '#{shop_domain}'")

      raise ActiveRecord::RecordNotFound, "Shop Not Found"
    end

    @shop_domain = shop_domain
    @subscription_data = webhook["app_subscription"]

    shop.with_shopify_session do |session|
      process_subscription_updated
    end
  end

  def process_subscription_updated
    plan = @subscription_data["name"]
    Rails.logger.info("Plan name: #{plan}")
    return if plan.blank? || account.blank?

    update_account(plan)
    update_limits
  end

  def update_limits
    account.update_usage_limits
  end

  def account
    hook = Integrations::Hook.find_by(reference_id: @shop_domain, app_id: 'shopify')

    @account ||= Account.find(hook.account.id)
  end

  def update_account(plan)
    account.update(
      custom_attributes: {
        shopify_billing_shop_id: @subscription_data["admin_graphql_api_shop_id"],
        plan_name: plan,
        onboarding_step: 'true',
        shopify_billing_created_at: @subscription_data['created_at'],
        shopify_billing_updated_at: @subscription_data['updated_at'],
        shopify_billing_currency: @subscription_data['currency'],
        shopify_billing_capped_amount: @subscription_data['capped_amount'],
        shopify_billing_price: @subscription_data['price'],
        shopify_billing_name: @subscription_data['name'],
        shopify_billing_interval: @subscription_data['interval'],
        shopify_billing_plan_handle: @subscription_data['plan_handle'],
      }
    )
    account.save!
  end
end
