import { frontendURL } from 'dashboard/helper/URLHelper.js';

import CampaignsPageRouteView from './pages/CampaignsPageRouteView.vue';
import LiveChatCampaignsPage from './pages/LiveChatCampaignsPage.vue';
import SMSCampaignsPage from './pages/SMSCampaignsPage.vue';
import WhatsappCampaignsPage from './pages/WhatsappCampaignsPage.vue';
import EmailCampaignsPage from './pages/EmailCampaignsPage.vue';

const campaignsRoutes = {
  routes: [
    {
      path: frontendURL('accounts/:accountId/campaigns'),
      component: CampaignsPageRouteView,
      children: [
        {
          path: '',
          redirect: to => {
            return { name: 'campaigns_ongoing_index', params: to.params };
          },
        },
        {
          path: 'ongoing',
          name: 'campaigns_ongoing_index',
          meta: {
            permissions: ['administrator'],
          },
          redirect: to => {
            return { name: 'campaigns_livechat_index', params: to.params };
          },
        },
        {
          path: 'one_off',
          name: 'campaigns_one_off_index',
          meta: {
            permissions: ['administrator'],
          },
          redirect: to => {
            return { name: 'campaigns_sms_index', params: to.params };
          },
        },
        {
          path: 'live_chat',
          name: 'campaigns_livechat_index',
          meta: {
            permissions: ['administrator'],
          },
          component: LiveChatCampaignsPage,
        },
        {
          path: 'sms',
          name: 'campaigns_sms_index',
          meta: {
            permissions: ['administrator'],
          },
          component: SMSCampaignsPage,
        },
        {
          path: 'whatsapp',
          name: 'campaigns_whatsapp_index',
          meta: {
            permissions: ['administrator'],
          },
          component: WhatsappCampaignsPage,
        },
        {
          path: 'email',
          name: 'campaigns_email_index',
          meta: {
            permissions: ['administrator'],
          },
          component: EmailCampaignsPage,
        }
      ],
    },
  ],
};

export default campaignsRoutes;
