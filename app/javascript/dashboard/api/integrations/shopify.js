/* global axios */

import ApiClient from '../ApiClient';

class ShopifyAPI extends ApiClient {
  constructor() {
    super('integrations/shopify', { accountScoped: true });
  }
}

export default new ShopifyAPI();
