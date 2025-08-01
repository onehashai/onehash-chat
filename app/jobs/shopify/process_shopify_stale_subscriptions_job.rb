class Shopify::ProcessShopifyStaleSubscriptionsJob < ApplicationJob
  queue_as :housekeeping

  def perform(*args)
    Account.all.each do |account|
      # Skip accounts that have a subscription plan that stripe_subscription_id

      next if account.custom_attributes['stripe_subscription_id'].present?

      shopify_plan = account.custom_attributes['shopify_billing_name']

      if shopify_plan.nil? || shopify_plan.empty?
        Rails.logger.info("Skipping account #{account.id} as it has no Shopify plan.")
        next
      end

      Rails.logger.info("Processing stale subscriptions for account #{account.id} with plan #{shopify_plan}")

      # Check if the subscription is stale
      if stale_subscription?(account)
        Rails.logger.info("Stale subscription found for account #{account.id}. Updating limits.")
        update_account_billing(account)
        update_limits(account)
      else
        Rails.logger.info("No stale subscription for account #{account.id}.")
      end
    end
  end

  private
  def stale_subscription?(account)
    # Define your logic to determine if a subscription is stale
    # For example, check if the last updated date is older than a certain threshold
    last_updated = account.custom_attributes['shopify_billing_updated_at']
    return false if last_updated.nil?

    # Threshhold date for plus plane is 30 days and pro is 365 days


    threshold_date = account.custom_attributes['plan_name'] == 'Plus' ? 30.days.ago : 365.days.ago
    last_updated = Time.parse(last_updated) if last_updated.is_a?(String)

    Rails.logger.info("Last updated for account #{account.id}: #{last_updated}, Threshold date: #{threshold_date}")

    return false if last_updated.nil?
    return true if last_updated.is_a?(Time) && last_updated < threshold_date
  end

  def update_account_billing(account)
    # Logic to update the account's billing information

    account.custom_attributes = account.custom_attributes.except(
      'shopify_billing_name',
      'shopify_billing_price',
      'shopify_billing_shop_id',
      'shopify_billing_currency',
      'shopify_billing_created_at',
      'shopify_billing_updated_at',
      'shopify_billing_capped_amount',
      "shopify_billing_interval",
      "shopify_billing_plan_handle"
    )

    account.custom_attributes['plan_name'] = 'Starter'
    account.save!

    Rails.logger.info("Account #{account.id} billing updated successfully.")
  end

  def update_limits(account)
    # Logic to update the account's usage limits
    account.update_usage_limits
    Rails.logger.info("Account #{account.id} usage limits updated successfully.")
  end
end
