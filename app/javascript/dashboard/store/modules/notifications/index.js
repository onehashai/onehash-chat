import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';

const state = {
  meta: {
    count: 0,
    currentPage: 1,
    unreadCount: 0,
  },
  records: {},
  uiFlags: {
    isFetching: false,
    isFetchingItem: false,
    isUpdating: false,
    isUpdatingUnreadCount: false,
  },
  notificationFilters: {},
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
