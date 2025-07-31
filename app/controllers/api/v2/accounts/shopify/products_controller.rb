class Api::V2::Accounts::Shopify::ProductsController < Api::V1::Accounts::BaseController
  before_action :setup_shopify_context, only: [:index, :get_discounts]

  SHOP_CURRENCY = <<~GRAPHQL
      {
        shop {
          currencyCode
        }
      }
  GRAPHQL

  DISCOUNT_QUERY = <<~GRAPHQL
    {
      discountNodes(query: "status:ACTIVE", first: 10) {
        nodes {
          id
          discount {
            ... on DiscountCodeBxgy {
              title
              status
              summary
              combinesWith {
                productDiscounts
              }
            }
            ... on DiscountCodeBasic {
              title
              status
              summary
              combinesWith {
                productDiscounts
              }
            }
            ... on DiscountCodeFreeShipping {
              title
              status
              summary
              combinesWith {
                productDiscounts
              }
            }
          }
        }
      }
    }
  GRAPHQL

  def index
    shop_domain = @shopify_service.shop.shopify_domain

    shop = Shop.find_by(shopify_domain: shop_domain)

    shop.with_shopify_session do
      response = ShopifyGraphql.execute(
        SHOP_CURRENCY
      )

      data = response.data

      currency = data.shop.currencyCode

      return render json: {
        products: Current.account.shopify_products.map do |product|
          product_attributes = product.as_json   # or product.attributes if ActiveRecord
          product_attributes.merge('currency' => currency)
        end
      }
    end
    render json: {error: 'shopify.data_not_found'}, status: :not_found
  end

  def get_discounts
    shop_domain = @shopify_service.shop.shopify_domain

    shop = Shop.find_by(shopify_domain: shop_domain)

    shop.with_shopify_session do
      response = ShopifyGraphql.execute(
        DISCOUNT_QUERY
      )

      data = response.data
      discounts = data.discountNodes.nodes

      return render json: {
        discounts: unwrap_table(discounts)
      }
    end
    render json: {error: 'shopify.data_not_found'}, status: :not_found
  end

  # def unwrap_table(obj)
  #   if obj.is_a?(Hash) && obj.key?("table")
  #     unwrap_table(obj["table"])
  #   elsif obj.is_a?(Array)
  #     obj.map { |item| unwrap_table(item) }
  #   elsif obj.is_a?(OpenStruct)
  #     unwrap_table(obj.to_h)
  #   else
  #     obj
  #   end
  # end

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

  def setup_shopify_context
    @shopify_service = Shopify::ClientService.new(Current.account.id)
  end

end
