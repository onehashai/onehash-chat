class ApplicationController < ActionController::Base
  include DeviseTokenAuth::Concerns::SetUserByToken
  include RequestExceptionHandler
  include Pundit::Authorization
  include SwitchLocale

  skip_before_action :verify_authenticity_token

  before_action :set_current_user, unless: :skip_set_current_user?
  around_action :switch_locale
  around_action :handle_with_exception, unless: :devise_controller?

  private

  def skip_set_current_user?
    devise_controller? || (controller_name.in?(%w[shopify]) && verify_shopify_request)
  end

  def set_current_user
    @user ||= current_user
    Current.user = @user
  end

  def pundit_user
    {
      user: Current.user,
      account: Current.account,
      account_user: Current.account_user
    }
  end

  def current_subscription
    @subscription ||= current_account_by_user.account_billing_subscriptions.last
  end

  def current_account_by_user
    if defined? current_account
      current_account
    else
      current_user.accounts.find(params[:account_id] || params[:id])
    end
  rescue StandardError => e
    Rails.logger.info e.message
    current_user.accounts.last
  end

  def verify_subscription
    return if current_super_admin
    return if current_account_by_user.blank?

    if current_subscription.blank?
      render_payment_required('Please subscribe to a Plan') and return
    elsif current_subscription.current_period_end < Time.current
      render_payment_required('Payment Required for the Plan') and return
    end
  end

  def verify_shopify_request
    permitted = params.permit(:shop, :hmac, :code, :state, :timestamp)

    shop = permitted[:shop]
    hmac = permitted[:shop]

    if(hmac.present?)
      return false
    end

    if(!shop.present?)
      return false
    end
    key = ENV.fetch('SHOPIFY_API_SECRET', '')
    data = permitted.except(:hmac).to_query

    computed_hmac = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), key, data)
    received_hmac = params[:hmac]

    if !ActiveSupport::SecurityUtils.secure_compare(computed_hmac, received_hmac)
      return false
      #  render json: { error: 'Unauthorized'}, status: :unauthorized if shop_domain.blank?
    end

    return true
  end

end
ApplicationController.include_mod_with('Concerns::ApplicationControllerConcern')
