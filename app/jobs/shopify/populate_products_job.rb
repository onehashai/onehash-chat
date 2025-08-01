class Shopify::PopulateProductsJob < ApplicationJob
  queue_as :default

  PRODUCT_FETCH_QUERY = <<~GRAPHQL
    query GetProducts {
      products(first: 10) {
        nodes {
          id
          title
          status
          description
          onlineStorePreviewUrl
          media(first:1) {
              nodes {
                ... on MediaImage {
                  image {
                    url(transform: {maxWidth: 180, maxHeight: 180})
                  }
                }
              }
          }
          variants(first: 100) {
            nodes{
              id
              compareAtPrice
              price
              displayName
              image {
                url
              }
              inventoryQuantity
            }
          }
        }
      }
    }
  GRAPHQL


  def perform(params)
    get_products(params)
  end

  def get_products(params)
    shop_domain, account_id = params.values_at(:shop_domain, :account_id)

    shop = Shop.find_by(shopify_domain: shop_domain)
    account = Account.find_by(id: account_id)

    shop.with_shopify_session do
        response = ShopifyGraphql.execute(
          PRODUCT_FETCH_QUERY
        )

        data = response.data

        products = data.products.nodes
        Rails.logger.info("Got products: #{products}")

        products.each do |elem|
          product_id = (elem.id.split('/').last);

          account.shopify_products.create!(
            id: product_id,
            name: elem.title,
            media_image_url: elem.media.nodes.first&.image&.url,
            description: elem.description,
            created_at: elem.createdAt,
            updated_at: elem.updatedAt,
            status: elem.status,
            online_store_preview_url: elem.onlineStorePreviewUrl,
            variants: unwrap_table(elem.variants.nodes),
          ) unless account.shopify_products.find_by(id: product_id).present?
        end
    end
  end

  def unwrap_table(obj)
    case obj
    when OpenStruct
      unwrap_table(obj.to_h)
    when Hash
      if obj.key?("table")
        unwrap_table(obj["table"])
      else
        # Recursively unwrap all values inside the hash
        obj.transform_values { |v| unwrap_table(v) }
      end
    when Array
      obj.map { |item| unwrap_table(item) }
    else
      obj
    end
  end

end
