import { sendMessage } from 'widget/helpers/utils';
import { isAxiosError } from 'axios';
import ContactsAPI from '../../api/contacts';
import { SET_USER_ERROR } from '../../constants/errorTypes';
import { setHeader } from '../../helpers/axios';

const state = {
  currentUser: {},
  uiFlags: {
    isUpdating: false,
    otpError: null,
  },
};

const SET_CURRENT_USER = 'SET_CURRENT_USER';
const UPDATE_USER_UPDATING_UI_FLAG = 'UPDATE_USER_UPDATING_UI_FLAG';
const UPDATE_OTP_ERROR_UI_FLAG = 'UPDATE_OTP_ERROR_UI_FLAG';

const parseErrorData = error =>
  error && error.response && error.response.data ? error.response.data : error;
export const updateWidgetAuthToken = widgetAuthToken => {
  if (widgetAuthToken) {
    setHeader(widgetAuthToken);
    sendMessage({
      event: 'setAuthCookie',
      data: { widgetAuthToken },
    });
  }
};

export const getters = {
  getCurrentUser(_state) {
    return _state.currentUser;
  },
  getUiFlags(_state) {
    return _state.uiFlags;
  },
};

export const actions = {
  get: async ({ commit }) => {
    try {
      const { data } = await ContactsAPI.get();
      commit(SET_CURRENT_USER, data);
    } catch (error) {
      // Ignore error
    }
  },
  update: async ({ dispatch }, { user }) => {
    try {
      await ContactsAPI.update(user);
      dispatch('get');
    } catch (error) {
      // Ignore error
    }
  },
  setUser: async ({ dispatch }, { identifier, user: userObject }) => {
    try {
      const {
        email,
        name,
        avatar_url,
        identifier_hash: identifierHash,
        phone_number,
        company_name,
        city,
        country_code,
        description,
        custom_attributes,
        social_profiles,
      } = userObject;
      const user = {
        email,
        name,
        avatar_url,
        identifier_hash: identifierHash,
        phone_number,
        additional_attributes: {
          company_name,
          city,
          description,
          country_code,
          social_profiles,
        },
        custom_attributes,
      };
      const {
        data: { widget_auth_token: widgetAuthToken },
      } = await ContactsAPI.setUser(identifier, user);
      updateWidgetAuthToken(widgetAuthToken);
      dispatch('get');
      if (identifierHash || widgetAuthToken) {
        dispatch('conversation/clearConversations', {}, { root: true });
        dispatch('conversation/fetchOldConversations', {}, { root: true });
        dispatch('conversationAttributes/getAttributes', {}, { root: true });
      }
    } catch (error) {
      const data = parseErrorData(error);
      sendMessage({ event: 'error', errorType: SET_USER_ERROR, data });
    }
  },
  setCustomAttributes: async (_, customAttributes = {}) => {
    try {
      await ContactsAPI.setCustomAttributes(customAttributes);
    } catch (error) {
      // Ignore error
    }
  },
  deleteCustomAttribute: async (_, customAttribute) => {
    try {
      await ContactsAPI.deleteCustomAttribute(customAttribute);
    } catch (error) {
      // Ignore error
    }
  },
  verifyShopifyEmail: async ({ commit, dispatch }, params) => {
    try {
      commit(UPDATE_USER_UPDATING_UI_FLAG, true);
      await ContactsAPI.verifyShopifyEmail(params);
      await dispatch('get');
      commit(UPDATE_USER_UPDATING_UI_FLAG, false);
    } catch (error) {
      commit(UPDATE_USER_UPDATING_UI_FLAG, false);
    }
  },

  verifyShopifyOTP: async ({ commit, dispatch }, params) => {
    try {
      commit(UPDATE_USER_UPDATING_UI_FLAG, true);
      const result = await ContactsAPI.verifyShopifyOTP(params);
      await dispatch('get');
      commit(UPDATE_USER_UPDATING_UI_FLAG, false);
    } catch (error) {
      commit(UPDATE_USER_UPDATING_UI_FLAG, false);
      if (isAxiosError(error)) {
        const otpError = error.response.data.error;
        if (otpError != null) {
          commit(UPDATE_OTP_ERROR_UI_FLAG, otpError);
        }
      }
    }
  },
};

export const mutations = {
  [SET_CURRENT_USER]($state, user) {
    const { currentUser } = $state;
    $state.currentUser = { ...currentUser, ...user };
  },
  [UPDATE_USER_UPDATING_UI_FLAG]($state, value) {
    $state.uiFlags.isUpdating = value;
  },
  [UPDATE_OTP_ERROR_UI_FLAG]($state, value) {
    $state.uiFlags.otpError = value;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
