import { createStore } from 'vuex';

import agent from 'widget/store/modules/agent';
import appConfig from 'widget/store/modules/appConfig';
import contacts from 'widget/store/modules/contacts';
import orders from 'widget/store/modules/orders';
import conversation from 'widget/store/modules/conversation';
import conversationAttributes from 'widget/store/modules/conversationAttributes';
import conversationLabels from 'widget/store/modules/conversationLabels';
import events from 'widget/store/modules/events';
import globalConfig from 'shared/store/globalConfig';
import message from 'widget/store/modules/message';
import campaign from 'widget/store/modules/campaign';
import article from 'widget/store/modules/articles';
import calls from 'widget/store/modules/calls';

export default createStore({
  modules: {
    agent,
    appConfig,
    contacts,
    conversation,
    conversationAttributes,
    conversationLabels,
    events,
    globalConfig,
    message,
    campaign,
    article,
    calls,
    orders,
  },
});
