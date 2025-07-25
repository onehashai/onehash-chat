/* global axios */
import ApiClient from '../ApiClient';

class ShopifyProductsAPI extends ApiClient {
  constructor() {
    super('shopify/products', { accountScoped: true, apiVersion: 'v2' });
  }

  getDiscounts = () => {
    return axios.get(`${this.url}/get_discounts`);
  };
}

export default new ShopifyProductsAPI();
