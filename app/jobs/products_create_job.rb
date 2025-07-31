class ProductsCreateJob < ActiveJob::Base
  extend ShopifyAPI::Webhooks::Handler

  class << self
    def handle(topic:, shop:, body:)
      perform_later(topic: topic, shop_domain: shop, webhook: body)
    end
  end

  def perform(topic:, shop_domain:, webhook:)
    shop = Shop.find_by(shopify_domain: shop_domain)

    @hook = Integrations::Hook.find_by!(reference_id: shop_domain)

    if shop.nil? || !@hook.present?
      logger.error("#{self.class} failed: cannot find shop with domain '#{shop_domain}'")

      raise ActiveRecord::RecordNotFound, "Shop Not Found"
    end

    shop.with_shopify_session do |session|
      # Build a map of image_id => image src for quick lookup
      image_map = {}
      if webhook["images"]
        webhook["images"].each do |img|
          image_map[img["id"]] = img["src"]
        end
      end

      product_data = {
        id: webhook["id"],
        name: webhook["title"],
        description: ActionView::Base.full_sanitizer.sanitize(webhook["body_html"]),
        online_store_preview_url: "https://#{shop_domain}/products/#{webhook["handle"]}",
        media_image_url: (
          webhook["image"] && webhook["image"]["src"] ?
            webhook["image"]["src"].sub('.webp', '_180x180.webp') :
            nil
        ),
        status: webhook["status"].upcase,
        variants: webhook["variants"].map do |variant|
          # Look up image URL by image_id from variants, fallback to nil
          variant_image_src = variant["image_id"] ? image_map[variant["image_id"]] : nil

          {
            id: variant["admin_graphql_api_id"],
            image: variant_image_src,
            price: variant["price"],
            displayName: "#{webhook["title"]} - #{variant["title"]}",
            compareAtPrice: variant["compare_at_price"],
            inventoryQuantity: variant["inventory_quantity"]
          }
        end,
        created_at: webhook["created_at"],
        updated_at: webhook["updated_at"],
        account_id: @hook.account.id
      }
      
      ShopifyProduct.upsert(product_data, unique_by: :id)

    end
  end
end
