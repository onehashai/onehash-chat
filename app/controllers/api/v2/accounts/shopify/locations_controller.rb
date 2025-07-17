class Api::V2::Accounts::Shopify::LocationsController < Api::V1::Accounts::BaseController

  before_action :setup_shopify_context, only: [:index]

  def index
    Shopify::PopulateStoreLocationsJob.perform_now(
      shop_domain: @shopify_service.shop.shopify_domain,
      account_id: Current.account.id
    );
    render json: {locations: Current.account.shopify_locations}
  end

  def setup_shopify_context
    @shopify_service = Shopify::ClientService.new(Current.account.id)
  end

end
