class Api::V1::Accounts::Integrations::ViasocketController < Api::V1::Accounts::BaseController
  before_action :check_admin_authorization?

  def embed_token
    access_key = ENV.fetch('VIASOCKET_ACCESS_KEY', nil)
    payload = get_payload
    token = JWT.encode payload, access_key, 'HS256'
    render json: { success: true, token: token }
  end

  private

  def get_payload
    {
        org_id: ENV.fetch('VIASOCKET_ORG_ID', nil),
        project_id: ENV.fetch('VIASOCKET_PROJECT_ID', nil),
        user_id: Current.account.id
    }
  end
end
