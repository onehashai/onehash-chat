var eventName =
  typeof Turbolinks !== 'undefined' ? 'turbolinks:load' : 'DOMContentLoaded';

if (!document.documentElement.hasAttribute('data-turbolinks-preview')) {
  document.addEventListener(eventName, function flash() {
    var flashData = JSON.parse(
      document.getElementById('shopify-app-flash').dataset.flash
    );

    var Toast = window['app-bridge'].actions.Toast;

    if (flashData.notice) {
      // eslint-disable-next-line no-undef
      Toast.create(app, {
        message: flashData.notice,
        duration: 5000,
      }).dispatch(Toast.Action.SHOW);
    }

    if (flashData.error) {
      // eslint-disable-next-line no-undef
      Toast.create(app, {
        message: flashData.error,
        duration: 5000,
        isError: true,
      }).dispatch(Toast.Action.SHOW);
    }
  });
}
