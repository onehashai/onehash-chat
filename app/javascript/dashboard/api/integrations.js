/* global axios */
import { setAuthCredentials } from 'dashboard/store/utils/api';

import ApiClient from './ApiClient';

class IntegrationsAPI extends ApiClient {
  constructor() {
    super('integrations/apps', {
      accountScoped: true,
    });
  }

  connectSlack(code) {
    return axios.post(`${this.baseUrl()}/integrations/slack`, { code });
  }

  updateSlack({ referenceId }) {
    return axios.patch(`${this.baseUrl()}/integrations/slack`, {
      reference_id: referenceId,
    });
  }

  listAllSlackChannels() {
    return axios.get(`${this.baseUrl()}/integrations/slack/list_all_channels`);
  }

  delete(integrationId) {
    return axios.delete(`${this.baseUrl()}/integrations/${integrationId}`);
  }

  createHook(hookData) {
    return axios.post(`${this.baseUrl()}/integrations/hooks`, hookData);
  }

  deleteHook(hookId) {
    return axios.delete(`${this.baseUrl()}/integrations/hooks/${hookId}`);
  }

  // REVIEW:CV4.0.2 cv4.0.2 removes this, might never be used
  fetchCaptainURL() {
    return axios.get(`${this.baseUrl()}/integrations/captain/sso_url`);
  }

  addOneHashIntegration(integrationId, slug) {
    return axios.get(
      `${this.baseUrl()}/integrations/${integrationId}?cal_user_slug=${slug}`
    );
  }

  async connectShopify(query) {
    if (typeof axios === 'undefined') {
      const axiosModule = await import('axios');
      const axios = axiosModule.default;
      try {
        const { id, token } = await this.fetchChatwootIdFromCookie(axios);
        if (id) {
          return axios.post(
            `${this.apiVersion}/accounts/${id}/integrations/shopify/auth`,
            query,
            {
              headers: {
                api_access_token: token,
              },
            }
          );
        }
      } catch (e) {
        return await axios.post(`${this.apiVersion}/integrations/shopify/auth`, query);
      }
    } else {
      return axios.post(`${this.baseUrl()}/integrations/shopify/auth`, query);
    }
  }

  async fetchChatwootIdFromCookie(axios) {
    const getCookie = name => {
      const match = document.cookie.match(
        new RegExp('(^| )' + name + '=([^;]+)')
      );
      return match ? decodeURIComponent(match[2]) : null;
    };

    const cwSession = getCookie('cw_d_session_info');
    if (!cwSession) {
      console.error('cw_d_session_info cookie not found');
      return;
    }

    let sessionData;
    try {
      sessionData = JSON.parse(cwSession);
    } catch (e) {
      console.error('Failed to decode cw_d_session_info:', e.message);
      return;
    }

    const { 'access-token': accessToken, client, uid } = sessionData;

    if (!accessToken || !client || !uid) {
      console.error('Missing required auth values in session data');
      return;
    }

    try {
      const res = await axios.get(
        `https://${this.apiVersion}/profile`,
        {
          headers: {
            'access-token': accessToken,
            client: client,
            uid: uid,
            'token-type': 'Bearer',
          },
        }
      );

      return { id: res.data.account_id, token: res.data.access_token };
    } catch (err) {
      console.error('API request failed:', err.response?.data || err.message);
    }
  }
}

export default new IntegrationsAPI();
