class Api::V2::Accounts::Shopify::ProductsController < Api::V1::Accounts::BaseController
  before_action :setup_shopify_context, only: [:index]

  SHOP_CURRENCY = <<~GRAPHQL
      {
        shop {
          currencyCode
        }
      }
  GRAPHQL

  def index
    shop_domain = @shopify_service.shop.shopify_domain
    Shopify::PopulateProductsJob.perform_now(
      shop_domain: shop_domain,
      account_id: Current.account.id
    );

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
    render json: {error: 'shopify.data_not_found'}
  end

  def setup_shopify_context
    @shopify_service = Shopify::ClientService.new(Current.account.id)
  end

end
