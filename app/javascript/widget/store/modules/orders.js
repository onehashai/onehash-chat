import ShopifyOrdersAPI from '../../api/orders';

const state = {
  uiFlags: {
    isUpdating: false,
    isFetching: false,
    noOrder: false,
  },
  order: null,
};

export const getters = {
  getUiFlags: $state => $state.uiFlags,
  getOrder: $state => $state.order,
};

export const actions = {
  get: async ({ commit }, { orderId, customerEmail, customerPhone }) => {
    try {
      commit('toggleIsFetchingStatus', true);

      const response = await ShopifyOrdersAPI.get({
        orderId,
        customerEmail,
        customerPhone,
      });

      commit('toggleIsFetchingStatus', false);
      if (response.data.order) {
        commit('toggleOrderNotFound', false);
        commit('updateOrders', response.data.order);
      } else {
        commit('toggleOrderNotFound', true);
      }
    } catch {
      commit('toggleOrderNotFound', true);
    }
  },

  resetOrder: ({ commit }) => {
    commit('updateOrders', null);
  },
};

export const mutations = {
  toggleOrderNotFound($state, status) {
    $state.uiFlags.noOrder = status;
  },

  toggleIsFetchingStatus($state, status) {
    $state.uiFlags.isFetching = status;
  },

  updateOrders($state, order) {
    $state.order = order;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
