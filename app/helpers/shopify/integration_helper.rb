module Shopify::IntegrationHelper
  REQUIRED_SCOPES = %w[read_discounts 
  read_files read_inventory read_locations read_products read_orders write_orders read_customers read_fulfillments read_returns write_returns write_merchant_managed_fulfillment_orders write_third_party_fulfillment_orders read_merchant_managed_fulfillment_orders read_third_party_fulfillment_orders].freeze

  # read_orders	Read order details and line items (to determine refundable items and quantities)
  # read_inventory	Read inventory items and inventory levels (to get stock and location data)
  # read_locations	Read shop locations (to fetch valid restock locations, if not cached)
  # read_products	Read product and variant information (to get variant and inventory item IDs)
  # write_orders	Create refunds and restock items (needed for refundCreate and restocking mutations)
  # write_merchant_managed_fulfillment_orders: Lets an app manage fulfillment orders for locations the merchant manages directly (e.g., the merchant’s own warehouse or store). This is typically used by order management apps, not fulfillment services.
  # write_third_party_fulfillment_orders: Lets an app access and manage fulfillment orders that are assigned to locations managed by other third-party fulfillment services. This is also typically used by order management apps that need to coordinate across multiple fulfillment providers.

  # Generates a signed JWT token for Shopify integration
  #
  # @param account_id [Integer] The account ID to encode in the token
  # @return [String, nil] The encoded JWT token or nil if client secret is missing
  def generate_shopify_token(account_id)
    return if client_secret.blank?

    JWT.encode(token_payload(account_id), client_secret, 'HS256')
  rescue StandardError => e
    Rails.logger.error("Failed to generate Shopify token: #{e.message}")
    nil
  end

  def token_payload(account_id)
    {
      sub: account_id,
      iat: Time.current.to_i
    }
  end

  # Verifies and decodes a Shopify JWT token
  #
  # @param token [String] The JWT token to verify
  # @return [Integer, nil] The account ID from the token or nil if invalid
  def verify_shopify_token(token)
    return if token.blank? || client_secret.blank?

    decode_token(token, client_secret)
  end

  private

  def client_id
    @client_id ||= ENV.fetch('SHOPIFY_API_KEY', nil)
  end

  def client_secret
    @client_secret ||= ENV.fetch('SHOPIFY_API_SECRET', nil)
  end

  def decode_token(token, secret)
    JWT.decode(
      token,
      secret,
      true,
      {
        algorithm: 'HS256',
        verify_expiration: true
      }
    ).first['sub']
  rescue StandardError => e
    Rails.logger.error("Unexpected error verifying Shopify token: #{e.message}")
    nil
  end
end
