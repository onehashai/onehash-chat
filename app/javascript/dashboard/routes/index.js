import { createRouter, createWebHistory } from 'vue-router';

import { frontendURL } from '../helper/URLHelper';
import dashboard from './dashboard/dashboard.routes';
import store from 'dashboard/store';
import { validateLoggedInRoutes } from '../helper/routeHelpers';
import AnalyticsHelper from '../helper/AnalyticsHelper';
import { buildPermissionsFromRouter } from '../helper/permissionsHelper';

const routes = [...dashboard.routes];

export const router = createRouter({ history: createWebHistory(), routes });
export const routesWithPermissions = buildPermissionsFromRouter(routes);

export const validateAuthenticateRoutePermission = async (to, next) => {
  const { isLoggedIn, getCurrentUser: user } = store.getters;

  if (!isLoggedIn && to.path !== '/app/login') {
    window.location.assign('/app/login');
  }

  if (
    (to?.query && 'shop' in to.query) ||
    (to.path && to.path.includes('shopify'))
  ) {
    return next();
  }

  let getAccount = store.getters['accounts/getAccount'];
  let currentAccount = getAccount(user.account_id);

  if (
    !currentAccount ||
    Object.keys(currentAccount).length === 0 ||
    currentAccount.custom_attributes?.onboarding_step !== 'true'
  ) {
    await store.dispatch('accounts/getAccountById', user.account_id);
    getAccount = store.getters['accounts/getAccount'];
    currentAccount = getAccount(user.account_id);
  }

  if (to.fullPath === '/app?to=cal_integration') {
    return next(
      frontendURL(
        `accounts/${user.account_id}/settings/integrations/onehash_apps`
      )
    );
  }

  if (!to.name) {
    return next(frontendURL(`accounts/${user.account_id}/dashboard`));
  }

  const nextRoute = validateLoggedInRoutes(
    to,
    store.getters.getCurrentUser,
    currentAccount
  );

  return nextRoute ? next(frontendURL(nextRoute)) : next();
};

export const initalizeRouter = () => {
  const userAuthentication = store.dispatch('setUser');

  router.beforeEach((to, _from, next) => {
    AnalyticsHelper.page(to.name || '', {
      path: to.path,
      name: to.name,
    });

    userAuthentication.then(() => {
      return validateAuthenticateRoutePermission(to, next, store);
    });
  });
};

export default router;
