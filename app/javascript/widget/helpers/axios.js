import axios from 'axios';
import { APP_BASE_URL } from 'widget/helpers/constants';

console.log('Base url: ', window.location);
console.log('App Base url: ', APP_BASE_URL);

export const API = axios.create({
  baseURL: (APP_BASE_URL
   + (window.location.href.includes('myshopify') ? '/apps/onehash-chat' : '')).replace(/(\/apps\/onehash-chat)+/g, '/apps/onehash-chat'),
  withCredentials: false,
});

console.log('Api base url: ', API.getUri());

export const setHeader = (value, key = 'X-Auth-Token') => {
  API.defaults.headers.common[key] = value;
};

export const removeHeader = key => {
  delete API.defaults.headers.common[key];
};
