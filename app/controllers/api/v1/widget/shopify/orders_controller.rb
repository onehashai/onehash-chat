class Api::V1::Widget::Shopify::OrdersController < Api::V1::Widget::BaseController
  def index
    params.permit(:order_id, :customer_email, :customer_phone)

    order_id, customer_email, customer_phone = params.values_at(:order_id, :customer_email, :customer_phone)

    contact = nil

    if customer_email.present? then
      contact = Contact.find_by(email: customer_email)
    elsif customer_phone.present? then
      contact = Contact.find_by(phone_number: customer_phone)
    end

    if !contact.present? then
      return render json: {error: "No contact found"}, status: :unprocessable_entity
    end

    if !contact.custom_attributes['shopify_customer_id'].present? then
      PopulateShopifyContactDataJob.perform_now(
        account_id: inbox.account.id,
        id: contact.id,
        email: customer_email,
        phone_number: customer_phone,
      );

    end

    order = inbox.account.orders.find_by(name: "##{order_id}", customer_id: contact.custom_attributes['shopify_customer_id']);

    if !contact.present?
      return render json: {error: "No contact found"}, status: :unprocessable_entity
    end

    render json: {order: order }, head: :ok
  end
end
