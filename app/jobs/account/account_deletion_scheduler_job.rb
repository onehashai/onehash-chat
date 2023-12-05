class Account::AccountDeletionSchedulerJob < ApplicationJob
  queue_as :scheduled_jobs

  def perform
    config_name = 'INITIAL_WARNING_AFTER_DAYS'
    no_days = GlobalConfig.get(config_name)[config_name] || 28
    no_days = no_days.to_i
    intermediary_config_name = 'INTERMEDIARY_WARNING'
    intermediary_days = GlobalConfig.get(intermediary_config_name)[intermediary_config_name] || 2
    intermediary_days = intermediary_days.to_i

    deletion_days_config_name = 'ACCOUNT_DELETION_DAYS_AFTER_INTERMEDIARY_WARNING'
    deletion_days = GlobalConfig.get(deletion_days_config_name)[deletion_days_config_name] || 2
    deletion_days = deletion_days.to_i
    total_no_days = intermediary_days + no_days + deletion_days

    auto_delete_inactive_account_name = 'AUTO_DELETE_INACTIVE_ACCOUNT'
    auto_delete_inactive_account = GlobalConfig.get(auto_delete_inactive_account_name)[auto_delete_inactive_account_name] == 'true'

    Account.where('deletion_email_reminder = ? and email_sent_at < ?', Account.deletion_email_reminders[:second_reminder],
                  deletion_days.days.ago).each do |account|
      subscription = account.account_billing_subscriptions.where(cancelled_at: nil)&.last

      next unless subscription.present? && subscription.billing_product_price.billing_product&.product_name == 'Trial'

      users = account.users.where('last_sign_in_at > ? ', total_no_days.days.ago)

      if users.present?
        update_deletion_email_reminder(account, intermediary_days, no_days)
      else
        send_account_deletion_email(account, no_days, auto_delete_inactive_account)
      end
    end
  end

  private

  def update_deletion_email_reminder(account, intermediary_days, no_days)
    if account.users.where('last_sign_in_at > ? ', (intermediary_days + no_days).days.ago).present?
      account.update(deletion_email_reminder: nil)
    end
  end

  def send_account_deletion_email(account, no_days, auto_delete_inactive_account)
    user = account.account_users.where(inviter_id: nil).last&.user
    return if user.blank? || user.created_at >= no_days.days.ago

    AdministratorNotifications::AccountMailer.account_deletion(account).deliver_now
    account.users.destroy_all if auto_delete_inactive_account
    account.destroy if auto_delete_inactive_account
  end
end
