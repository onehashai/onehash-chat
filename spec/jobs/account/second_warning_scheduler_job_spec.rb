# spec/jobs/account/second_warning_scheduler_job_spec.rb
require 'rails_helper'

RSpec.describe Account::SecondWarningSchedulerJob, type: :job do
  include ActiveJob::TestHelper

  it 'sends a second warning email' do
    expect {
      perform_enqueued_jobs { described_class.perform_now }
    }.to change { ActionMailer::Base.deliveries.size }.by(1)

    Rails.logger.debug { '-----------------Sent----------------' }

    mail = ActionMailer::Base.deliveries.last
    # Add your expectations for the email recipients based on your job logic
    # Example: expect(mail.to).to contain_exactly(account.users.first.email)
  end
end
