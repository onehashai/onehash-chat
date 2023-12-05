class Account::SecondWarningSchedulerJob < ApplicationJob
  queue_as :scheduled_jobs

  def perform
    config_name = 'INITIAL_WARNING_AFTER_DAYS'
    no_days = GlobalConfig.get(config_name)[config_name] || 28
    no_days = no_days.to_i
    intermediary_config_name = 'INTERMEDIARY_WARNING'
    intermediary_days = GlobalConfig.get(intermediary_config_name)[intermediary_config_name] || 2
    intermediary_days = intermediary_days.to_i
    total_no_days = intermediary_days + no_days

    Account.where(deletion_email_reminder: 1, email_sent_at: intermediary_days.ago).each do |account|
      subscription = account.account_billing_subscriptions.where(cancelled_at: nil)&.last

      next unless subscription.present? && subscription.billing_product_price.billing_product&.product_name == 'Trial'

      users = account.users.where('last_sign_in_at > ? ', total_no_days.days.ago)

      if users.present?
        account.update(deletion_email_reminder: nil) if account.users.where('last_sign_in_at > ? ', no_days.days.ago).present?
      else
        user = account.account_users.where(inviter_id: nil).order(created_at: :asc).first&.user
        next if user.blank?

        # Update deletion_email_reminder to 2
        account.update(deletion_email_reminder: 2, email_sent_at: Time.now)
        AdministratorNotifications::AccountMailer.second_warning(account).deliver_now if user.created_at < no_days.days.ago
      end
    end
  end
end
