import { API } from 'widget/helpers/axios';

const buildUrl = (endPoint, params) => {
  const search = window.location.search;
  // Create a URLSearchParams object from the current search string
  const query = new URLSearchParams(search);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      query.set(k, v);
    });
  }

  const path = `/api/v1/${endPoint}?${query.toString()}`;
  return path;
};

export default {
  get({ orderId, customerEmail, customerPhone }) {
    return API.get(
      buildUrl(
        'widget/shopify/orders',
        Object.fromEntries(
          Object.entries({
            order_id: orderId,
            customer_email: customerEmail,
            customer_phone: customerPhone,
          }).filter(([_, v]) => v != null)
        )
      )
    );
  },
};
