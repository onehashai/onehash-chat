# == Schema Information
#
# Table name: integrations_hooks
#
#  id              :bigint           not null, primary key
#  access_token    :string
#  hook_type       :integer          default("account")
#  settings        :jsonb
#  status          :integer          default("enabled")
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :integer
#  account_user_id :integer
#  app_id          :string
#  inbox_id        :integer
#  reference_id    :string
#
# Foreign Keys
#
#  fk_rails_...  (account_user_id => account_users.id)
#
class Integrations::Hook < ApplicationRecord
  include Reauthorizable

  attr_readonly :app_id, :account_id, :inbox_id, :account_user_id, :hook_type
  before_validation :ensure_hook_type

  validates :account_id, presence: true
  validates :app_id, presence: true
  validates :inbox_id, presence: true, if: -> { hook_type == 'inbox' }
  validate :validate_settings_json_schema
  validates :app_id, uniqueness: { 
    scope: [:account_id], 
    unless: -> { (app.present? && app.params[:allow_multiple_hooks].present?) || hook_type == 'account_user' }
  }  
  validates :account_user_id, presence: true, if: -> { hook_type == 'account_user' }

  # TODO: This seems to be only used for slack at the moment
  # We can add a validator when storing the integration settings and toggle this in future
  enum status: { disabled: 0, enabled: 1 }

  belongs_to :account
  belongs_to :inbox, optional: true
  belongs_to :account_user, optional: true

  has_secure_token :access_token

  enum hook_type: { account: 0, inbox: 1, account_user: 2 }
  after_create :enqueue_process_integration_create_job
  after_destroy :enqueue_process_integration_delete_job

  def app
    @app ||= Integrations::App.find(id: app_id)
  end

  def slack?
    app_id == 'slack'
  end

  def dialogflow?
    app_id == 'dialogflow'
  end

  def disable
    update(status: 'disabled')
  end

  def process_event(event)
    case app_id
    when 'openai'
      Integrations::Openai::ProcessorService.new(hook: self, event: event).perform if app_id == 'openai'
    else
      { error: 'No processor found' }
    end
  end

  private

  def ensure_hook_type
    self.hook_type = app.params[:hook_type] if app.present?
  end

  def validate_settings_json_schema
    return if app.blank? || app.params[:settings_json_schema].blank?

    errors.add(:settings, ': Invalid settings data') unless JSONSchemer.schema(app.params[:settings_json_schema]).valid?(settings)
  end

  def enqueue_process_integration_create_job
    Rails.logger.info 'Enqueuing integration job '
    return unless app_id == 'onehash_cal'

    ProcessOneHashCalIntegrationJob.perform_later(id)
  end

  def enqueue_process_integration_delete_job
    return unless app_id == 'onehash_cal'

    Rails.logger.info 'Enqueuing disintegration job'

    # from_oauth_controller = Thread.current[:from_oauth_controller] || false
    ProcessOneHashCalDisintegrateJob.perform_later(id, account_user_id, settings['cal_user_id'], account_id)
  end
end
