/* global axios */
import ApiClient from '../ApiClient';

class ShopifyProductsAPI extends ApiClient {
  constructor() {
    super('shopify/products', { accountScoped: true, apiVersion: 'v2' });
  }
}

export default new ShopifyProductsAPI();