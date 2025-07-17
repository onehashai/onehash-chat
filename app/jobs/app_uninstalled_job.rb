class AppUninstalledJob < ActiveJob::Base
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
      @hook.destroy!
      shop.destroy!

      @hook.account.contacts.each do |contact|
        if(contact.custom_attributes[:shopify_customer_id].present?) then
          contact.update(custom_attributes: contact.custom_attributes.except(:shopify_customer_id, :shopify_customer_email, :shopify_customer_phone, :shopify_verified_email))
        end
      end
    end
  end
end
