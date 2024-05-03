# app/controllers/action_mailbox/ingresses/mandrill/inbound_emails_controller.rb
class ActionMailbox::Ingresses::Mandrill::InboundEmailsController < ActionMailbox::BaseController
  def create
    Rails.logger.info 'Received request in InboundEmailsController.create'

    # Log Mandrill events
    mandrill_events = params[:mandrill_events]
    Rails.logger.info "Mandrill Events finally captured in the console: #{mandrill_events}"

    # Parse Mandrill events if necessary
    parsed_events = JSON.parse(mandrill_events)

    # Extract relevant information from Mandrill events
    to_address = parsed_events[0]['msg']['to'][0][0] unless parsed_events.empty?

    # Print the "to" value to the console
    Rails.logger.info "To address extracted from Mandrill Events: #{to_address}"

    # Call the super method to continue with Action Mailbox processing
    super
  end
end
