class Api::V1::Accounts::Captain::DocumentsController < Api::V1::Accounts::BaseController
  before_action :current_account
  before_action -> { check_authorization(Captain::Assistant) }

  before_action :set_current_page, only: [:index]
  before_action :set_documents, except: [:create]
  before_action :set_document, only: [:show, :destroy]
  before_action :set_assistant, only: [:create]

  RESULTS_PER_PAGE = 25

  def index
    Rails.logger.info "Fetching documents for account: #{Current.account.id}, Assistant ID: #{permitted_params[:assistant_id]}"

    base_query = @documents
    if permitted_params[:assistant_id].present?
      Rails.logger.info "Filtering by Assistant ID: #{permitted_params[:assistant_id]}"
      base_query = base_query.where(assistant_id: permitted_params[:assistant_id])
    end

    @documents_count = base_query.count
    Rails.logger.info "Total documents found: #{@documents_count}"

    @documents = base_query.page(@current_page).per(RESULTS_PER_PAGE)
  end

  def show
    Rails.logger.info "Showing document with ID: #{@document.id} for Account: #{Current.account.id}"
  end

  def create
    Rails.logger.info "Attempting to create document with params: #{document_params.inspect}"

    if @assistant.nil?
      Rails.logger.error "Document creation failed: Missing Assistant with ID: #{document_params[:assistant_id]}"
      return render_could_not_create_error('Missing Assistant')
    end

    @document = @assistant.documents.build(document_params)

    if @document.save
      Rails.logger.info "Document successfully created: #{@document.id}, Name: #{@document.name}"
    else
      Rails.logger.error "Document creation failed: #{@document.errors.full_messages.join(", ")}"
    end
  end

  def destroy
    Rails.logger.info "Deleting document with ID: #{@document.id} for Account: #{Current.account.id}"
    Rails.logger.info "Document: #{@document}"
    @document.destroy
    head :no_content
  end

  private

  def set_documents
    Rails.logger.info "Fetching all documents for Account: #{Current.account.id}"
    @documents = Current.account.captain_documents.includes(:assistant).ordered
  end

  def set_document
    Rails.logger.info "Looking for document with ID: #{permitted_params[:id]}"
    @document = @documents.find(permitted_params[:id])
    Rails.logger.info "Found document: #{@document.id}, Name: #{@document.name}"
  end

  def set_assistant
    Rails.logger.info "Fetching Assistant with ID: #{document_params[:assistant_id]}"
    @assistant = Current.account.captain_assistants.find_by(id: document_params[:assistant_id])

    unless @assistant
      Rails.logger.warn "No assistant found with ID: #{document_params[:assistant_id]}"
    end
  end

  def set_current_page
    @current_page = permitted_params[:page] || 1
  end

  def permitted_params
    params.permit(:assistant_id, :page, :id, :account_id)
  end

  def document_params
    params.require(:document).permit(:name, :external_link, :assistant_id)
  end
end
