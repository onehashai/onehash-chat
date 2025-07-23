class EnableShopifyIntegration < ActiveRecord::Migration[7.0]
  def change
    current_config = InstallationConfig.where(name: 'ACCOUNT_LEVEL_FEATURE_DEFAULTS').last
    current_config.value.each { |v| v['enabled'] = true if %w[shopify_integration].include?(v['name']) }
    current_config.save!

    ConfigLoader.new.process

    Account.find_in_batches do |account_batch|
      account_batch.each do |account|
        account.enable_features('shopify_integration')
        account.save!
      end
    end
  end
end
