class CustomersRedactJob < ActiveJob::Base
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
      customer_id = webhook['customer']['id']

      contact = Contact.where("custom_attributes ->> 'shopify_customer_id' = ?", customer_id).first

      Order.destroy_all(customer_id: customer_id)

      contact.update(custom_attributes: contact.custom_attributes.except(:shopify_customer_id, :shopify_customer_email, :shopify_customer_phone, :shopify_verified_email))
    end
  end
end
