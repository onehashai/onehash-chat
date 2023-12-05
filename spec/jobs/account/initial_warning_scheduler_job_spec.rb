require 'rails_helper'

RSpec.describe Account::InitialWarningSchedulerJob, type: :job do
  include ActiveJob::TestHelper

  let!(:account) { create(:account) }  # You need to adjust this based on your data setup

  it 'runs the initial warning job' do
    expect {
      perform_enqueued_jobs { described_class.perform_now }
    }.to change { ActionMailer::Base.deliveries.size }.by(1)

    Rails.logger.debug { "-----------------Initial Warning Job Run----------------" }
  end
end
