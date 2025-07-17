document.addEventListener('DOMContentLoaded', () => {
  let data = document.getElementById('shopify-app-init').dataset;
  let AppBridge = window['app-bridge'];
  let createApp = AppBridge.default;
  window.app = createApp({
    apiKey: data.apiKey,
    host: data.host,
  });

  let actions = AppBridge.actions;
  let TitleBar = actions.TitleBar;

  // eslint-disable-next-line no-undef
  TitleBar.create(app, {
    title: data.page,
  });
});
