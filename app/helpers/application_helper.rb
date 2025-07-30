module ApplicationHelper
  include ViteRails::TagHelpers

  def available_locales_with_name
    LANGUAGES_CONFIG.map { |_key, val| val.slice(:name, :iso_639_1_code) }
  end

  def feature_help_urls
    features = YAML.safe_load(Rails.root.join('config/features.yml').read).freeze
    features.each_with_object({}) do |feature, hash|
      hash[feature['name']] = feature['help_url'] if feature['help_url']
    end
  end

  def custom_vite_client_tag(base_path: '/apps/onehash-chat')
    result = vite_client_tag
    # result = result.gsub(/src="\/vite-dev\//, "src=\"#{base_path}/vite-dev/")
    # Rails.logger.info("Custom Vite Client: #{result}")
    result
  end

  def custom_vite_javascript_tag(entry_name, base_path: '/apps/onehash-chat')
    result = vite_javascript_tag(entry_name)
    
    # Get the current request context
    current_host = request.host_with_port
    protocol = request.ssl? ? 'https' : 'http'
    
    # Force absolute URLs
    full_base_url = "#{protocol}://#{current_host}#{base_path}"

    result = result.gsub(/src="\/vite\//, "src=\"#{full_base_url}/vite/")
            .gsub(/href="\/vite\//, "href=\"#{full_base_url}/vite/")

    
    result = result.gsub(/src="\/vite-dev\//, "src=\"#{full_base_url}/vite-dev/")
            .gsub(/href="\/vite-dev\//, "href=\"#{full_base_url}/vite-dev/")
    
    Rails.logger.info("Result: #{result}")
    
    # CRITICAL: Return as safe HTML
    result.html_safe
  end
end
