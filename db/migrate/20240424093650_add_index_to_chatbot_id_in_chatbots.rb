class AddIndexToChatbotIdInChatbots < ActiveRecord::Migration[7.0]
  def change
    add_index :chatbots, :chatbot_id, unique: true
  end
end
