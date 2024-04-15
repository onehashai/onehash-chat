class AddDefaultValuesToConversations < ActiveRecord::Migration[7.0]
  def change
    change_column_default :conversations, :bot_icon_status, from: nil, to: true
    change_column_default :conversations, :is_bot_connected, from: nil, to: false
  end
end
