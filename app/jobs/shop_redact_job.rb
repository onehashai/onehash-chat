class ShopRedactJob < ActiveJob::Base
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

    shop.with_shopify_session do |session|
      @hook = Integrations::Hook.find_by!(reference_id: shop_domain)
      account_id = @hook.account.id

      ShopifyProduct.destroy_by(account_id: account_id)
      Order.destroy_by(account_id: account_id)

      @hook.destroy!
      shop.destroy!
    end
  end
end
