class Api::V1::Widget::Shopify::OrdersController < Api::V1::Widget::BaseController


  def identify_contact(contact)
    contact_identify_action = ContactIdentifyAction.new(
      contact: contact,
      params: permitted_params.to_h.deep_symbolize_keys,
      discard_invalid_attrs: true
    )
    @contact = contact_identify_action.perform
  end

  def permitted_params
    params.permit(:website_token, :identifier, :identifier_hash, :email, :name, :avatar_url, :phone_number, custom_attributes: {},additional_attributes: {})
  end

  def index
    params.permit(:order_id, :customer_email, :customer_phone)

    order_id, customer_email, customer_phone = params.values_at(:order_id, :email, :phone_number)

    contact = nil

    if customer_email.present? then
      contact = inbox.account.contacts.find_by(email: customer_email)
    elsif customer_phone.present? then
      contact = inbox.account.contacts.find_by(phone_number: customer_phone)
    end

    if !contact.present? then
      identify_contact(@contact)
      contact = @contact
    end

    if !contact.custom_attributes['shopify_customer_id'].present? then
      PopulateShopifyContactDataJob.perform_now(
        account_id: inbox.account.id,
        id: contact.id,
        email: customer_email,
        phone_number: customer_phone,
      );
      contact = inbox.account.contacts.find(@contact.id)
    end

    order = inbox.account.orders.find_by(name: "##{order_id}", customer_id: contact.custom_attributes['shopify_customer_id']);

    if !contact.present?
      return render json: {error: "No contact found"}, status: :unprocessable_entity
    end

    render json: {order: order }, head: :ok
  end
end
