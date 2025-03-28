export const getters = {
  uiFlagsIn: state => portalId => {
    const uiFlags = state.portals.uiFlags.byId[portalId];
    if (uiFlags) return uiFlags;
    return {
      isFetching: false,
      isUpdating: false,
      isDeleting: false,
      domainValid: false,
      isValidating: false,
    };
  },

  isFetchingPortals: state => state.uiFlags.isFetching,
  isCreatingPortal: state => state.uiFlags.isCreating,
  isSwitchingPortal: state => state.uiFlags.isSwitching,
  portalBySlug:
    (...getterArguments) =>
    portalId => {
      const [state] = getterArguments;
      const portal = state.portals.byId[portalId];

      return portal;
    },
  allPortals: (...getterArguments) => {
    const [state, _getters] = getterArguments;
    const portals = state.portals.allIds.map(id => {
      return _getters.portalBySlug(id);
    });
    return portals;
  },
  count: state => state.portals.allIds.length || 0,
  getMeta: state => state.meta,
  isSwitching: state => state.isSwitching,
};
