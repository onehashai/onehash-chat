class CreateShopifyProducts < ActiveRecord::Migration[7.0]
  def change
    create_table :shopify_products do |t|
      t.string :name, null: false
      t.text :description, null: false
      t.text :online_store_preview_url, null: false
      t.text :media_image_url
      t.string :status, null: false
      t.jsonb :variants, default: []
      t.timestamps
      t.references :account, foreign_key: true, index: true, null: true
    end

    add_index :shopify_products, :id, unique: true
    add_index :shopify_products, :variants, using: :gin             # GIN index for JSONB variants
  end
end