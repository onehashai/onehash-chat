import {
  setAuthCredentials,
  throwErrorMessage,
  clearLocalStorageOnLogout,
} from 'dashboard/store/utils/api';
import wootAPI from './apiClient';
import { getLoginRedirectURL } from '../helpers/AuthHelper';
import Cookies from 'js-cookie';

export const login = async ({
  ssoAccountId,
  ssoConversationId,
  ...credentials
}) => {
  try {
    const response = await wootAPI.post('auth/sign_in', credentials);
    setAuthCredentials(response);
    clearLocalStorageOnLogout();
    window.location = getLoginRedirectURL({
      ssoAccountId,
      ssoConversationId,
      user: response.data.data,
    });
  } catch (error) {
    throwErrorMessage(error);
  }
};

export const register = async creds => {
  try {
    const response = await wootAPI.post('api/v1/accounts.json', {
      account_name: creds.accountName.trim(),
      user_full_name: creds.fullName.trim(),
      email: creds.email,
      password: creds.password,
      h_captcha_client_response: creds.hCaptchaClientResponse,
    });
    setAuthCredentials(response);
    return response.data;
  } catch (error) {
    throwErrorMessage(error);
  }
  return null;
};

export const verifyPasswordToken = async ({ confirmationToken }) => {
  try {
    const response = await wootAPI.post('auth/confirmation', {
      confirmation_token: confirmationToken,
    });
    setAuthCredentials(response);
  } catch (error) {
    throwErrorMessage(error);
  }
};

export const setNewPassword = async ({
  resetPasswordToken,
  password,
  confirmPassword,
}) => {
  try {
    const response = await wootAPI.put('auth/password', {
      reset_password_token: resetPasswordToken,
      password_confirmation: confirmPassword,
      password,
    });
    setAuthCredentials(response);
  } catch (error) {
    throwErrorMessage(error);
  }
};

export const resetPassword = async ({ email }) =>
  wootAPI.post('auth/password', { email });

// export const logoutFromKeycloakSession = () => {
// const keycloak_token = Cookies.get('keycloak_token');
// if (keycloak_token) {
//   const response = wootAPI.post('api/v1/keycloak/logout', {
//     token: keycloak_token,
//   });
//   return response;
// }
// return 'Keycloak Token missing from cookies';
// };

// export const checkKeycloakSession = async () => {
//   const keycloak_token = Cookies.get('keycloak_token');
//   if (keycloak_token) {
//     const response = await wootAPI.post(
//       'api/v1/keycloak/check_keycloak_session',
//       {
//         token: keycloak_token,
//       }
//     );
//     return response;
//   }
//   return 'Keycloak Token missing from cookies';
// };

export const keycloakRedirectUrl = async () => {
  const response = await wootAPI.post('api/v1/keycloak/create_redirect_url');
  return response;
};
