class AddColumnsToChatbots < ActiveRecord::Migration[7.0]
  def change
    add_column :chatbots, :website_token, :string
    add_column :chatbots, :inbox_id, :integer
    add_column :chatbots, :inbox_name, :string
    add_column :chatbots, :bot_status, :boolean
  end
end
