class AddColumnsToConversations < ActiveRecord::Migration[7.0]
  def change
    add_column :conversations, :bot_icon_status, :boolean
    add_column :conversations, :is_bot_connected, :boolean
  end
end
