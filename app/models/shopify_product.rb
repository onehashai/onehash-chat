# == Schema Information
#
# Table name: shopify_products
#
#  id                       :bigint           not null, primary key
#  description              :text             not null
#  media_image_url          :text
#  name                     :string           not null
#  online_store_preview_url :text             not null
#  status                   :string           not null
#  variants                 :jsonb
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  account_id               :bigint
#
# Indexes
#
#  index_shopify_products_on_account_id  (account_id)
#  index_shopify_products_on_id          (id) UNIQUE
#  index_shopify_products_on_variants    (variants) USING gin
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class ShopifyProduct < ApplicationRecord
end
