<script>
import { mapGetters, mapActions } from 'vuex';
import { setHeader } from 'widget/helpers/axios';
import addHours from 'date-fns/addHours';
import { IFrameHelper, RNHelper } from 'widget/helpers/utils';
import configMixin from './mixins/configMixin';
import availabilityMixin from 'widget/mixins/availability';
import { getLocale } from './helpers/urlParamsHelper';
import { getLanguageDirection } from 'dashboard/components/widgets/conversation/advancedFilterItems/languages';
import { isEmptyObject } from 'widget/helpers/utils';
import Spinner from 'shared/components/Spinner.vue';
import routerMixin from './mixins/routerMixin';
import {
  getExtraSpaceToScroll,
  loadedEventConfig,
} from './helpers/IframeEventHelper';
import {
  ON_AGENT_MESSAGE_RECEIVED,
  ON_CAMPAIGN_MESSAGE_CLICK,
  ON_UNREAD_MESSAGE_CLICK,
} from './constants/widgetBusEvents';
import { useDarkMode } from 'widget/composables/useDarkMode';
import { SDK_SET_BUBBLE_VISIBILITY } from '../shared/constants/sharedFrameEvents';
import { emitter } from 'shared/helpers/mitt';
import { EVENTS } from './helpers/callHelper';

export default {
  name: 'App',
  components: {
    Spinner,
  },
  mixins: [availabilityMixin, configMixin, routerMixin],
  setup() {
    const { prefersDarkMode } = useDarkMode();
    return { prefersDarkMode };
  },
  data() {
    return {
      isMobile: false,
      campaignsSnoozedTill: undefined,
    };
  },
  computed: {
    ...mapGetters({
      activeCampaign: 'campaign/getActiveCampaign',
      conversationSize: 'conversation/getConversationSize',
      hideMessageBubble: 'appConfig/getHideMessageBubble',
      isFetchingList: 'conversation/getIsFetchingList',
      isRightAligned: 'appConfig/isRightAligned',
      isWidgetOpen: 'appConfig/getIsWidgetOpen',
      messageCount: 'conversation/getMessageCount',
      unreadMessageCount: 'conversation/getUnreadMessageCount',
      isWidgetStyleFlat: 'appConfig/isWidgetStyleFlat',
      showUnreadMessagesDialog: 'appConfig/getShowUnreadMessagesDialog',
      hasActiveCall: 'calls/hasActiveCall',
    }),
    isIFrame() {
      return IFrameHelper.isIFrame();
    },
    isRNWebView() {
      return RNHelper.isRNWebView();
    },
    isRTL() {
      return this.$root.$i18n.locale
        ? getLanguageDirection(this.$root.$i18n.locale)
        : false;
    },
  },
  watch: {
    activeCampaign() {
      this.setCampaignView();
    },
    isRTL: {
      immediate: true,
      handler(value) {
        document.documentElement.dir = value ? 'rtl' : 'ltr';
      },
    },
  },
  mounted() {
    const { websiteToken, locale, widgetColor, logoColors } =
      window.chatwootWebChannel;
    this.setLocale(locale);
    this.setWidgetColor(widgetColor);
    this.setLogoColors(logoColors);
    setHeader(window.authToken);
    if (this.isIFrame) {
      this.registerListeners();
      this.sendLoadedEvent();
    } else {
      this.fetchOldConversations();
      this.fetchAvailableAgents(websiteToken);
      this.setLocale(getLocale(window.location.search));
    }
    if (this.isRNWebView) {
      this.registerListeners();
      this.sendRNWebViewLoadedEvent();
    }
    this.$store.dispatch('conversationAttributes/getAttributes');
    this.registerUnreadEvents();
    this.registerCampaignEvents();
    this.registerCallEvents();
  },
  methods: {
    ...mapActions('appConfig', [
      'setAppConfig',
      'setReferrerHost',
      'setWidgetColor',
      'setLogoColors',
      'setBubbleVisibility',
      'setColorScheme',
    ]),
    ...mapActions('conversation', ['fetchOldConversations']),
    ...mapActions('campaign', [
      'initCampaigns',
      'executeCampaign',
      'resetCampaign',
    ]),
    ...mapActions('agent', ['fetchAvailableAgents']),
    // eslint-disable-next-line vue/no-unused-properties
    ...mapActions('calls', ['setShowCallDialog', 'receiveCall']),
    scrollConversationToBottom() {
      const container = this.$el.querySelector('.conversation-wrap');
      container.scrollTop = container.scrollHeight;
    },
    setBubbleLabel() {
      IFrameHelper.sendMessage({
        event: 'setBubbleLabel',
        label: this.$t('BUBBLE.LABEL'),
      });
    },
    setIframeHeight(isFixedHeight) {
      this.$nextTick(() => {
        const extraHeight = getExtraSpaceToScroll();
        IFrameHelper.sendMessage({
          event: 'updateIframeHeight',
          isFixedHeight,
          extraHeight,
        });
      });
    },
    setLocale(localeWithVariation) {
      if (!localeWithVariation) return;
      const { enabledLanguages } = window.chatwootWebChannel;
      const localeWithoutVariation = localeWithVariation.split('_')[0];
      const hasLocaleWithoutVariation = enabledLanguages.some(
        lang => lang.iso_639_1_code === localeWithoutVariation
      );
      const hasLocaleWithVariation = enabledLanguages.some(
        lang => lang.iso_639_1_code === localeWithVariation
      );

      if (hasLocaleWithVariation) {
        this.$root.$i18n.locale = localeWithVariation;
      } else if (hasLocaleWithoutVariation) {
        this.$root.$i18n.locale = localeWithoutVariation;
      }
    },
    registerUnreadEvents() {
      emitter.on(ON_AGENT_MESSAGE_RECEIVED, () => {
        const { name: routeName } = this.$route;
        if ((this.isWidgetOpen || !this.isIFrame) && routeName === 'messages') {
          this.$store.dispatch('conversation/setUserLastSeen');
        }
        this.setUnreadView();
      });
      emitter.on(ON_UNREAD_MESSAGE_CLICK, () => {
        this.replaceRoute('messages').then(() => this.unsetUnreadView());
      });
    },
    registerCampaignEvents() {
      emitter.on(ON_CAMPAIGN_MESSAGE_CLICK, () => {
        if (this.shouldShowPreChatForm) {
          this.replaceRoute('prechat-form');
        } else {
          this.replaceRoute('messages');
          emitter.emit('execute-campaign', {
            campaignId: this.activeCampaign.id,
          });
        }
        this.unsetUnreadView();
      });
      emitter.on('execute-campaign', campaignDetails => {
        const { customAttributes, campaignId } = campaignDetails;
        const { websiteToken } = window.chatwootWebChannel;
        this.executeCampaign({ campaignId, websiteToken, customAttributes });
        this.replaceRoute('messages');
      });
      emitter.on('snooze-campaigns', () => {
        const expireBy = addHours(new Date(), 1);
        this.campaignsSnoozedTill = Number(expireBy);
      });
    },
    registerCallEvents() {
      emitter.on(EVENTS.INCOMING_CALL, () => {
        this.replaceRoute('incoming-call').then(() => {
          IFrameHelper.sendMessage({ event: 'openBubble' });
          this.handleUnseenCallNotificationDot();
        });
      });

      emitter.on('call-accepted', () => {
        this.handleSeenCallNotificationDot();
      });

      emitter.on('call-rejected', () => {
        this.handleSeenCallNotificationDot();
      });

      emitter.on('call-ended', () => {
        this.handleSeenCallNotificationDot();
      });
    },
    setCallView(isInWidget = false) {
      if (isInWidget) {
        this.$store.dispatch('calls/setShowCallDialog', false);
        this.replaceRoute('messages');
      } else if (this.isIFrame && this.hasActiveCall && !this.isWidgetOpen) {
        this.$store.dispatch('calls/setShowCallDialog', true);
        this.replaceRoute('incoming-call').then(() => {
          this.setIframeHeight(true);
          IFrameHelper.sendMessage({ event: 'setCallMode' });
        });
      }
    },
    unsetCallView() {
      if (this.isIFrame) {
        IFrameHelper.sendMessage({ event: 'resetCallMode' });
        this.setIframeHeight(false);
      }
    },
    setCampaignView() {
      const { messageCount, activeCampaign } = this;
      const shouldSnoozeCampaign =
        this.campaignsSnoozedTill && this.campaignsSnoozedTill > Date.now();
      const isCampaignReadyToExecute =
        !isEmptyObject(activeCampaign) &&
        !messageCount &&
        !shouldSnoozeCampaign;
      if (this.isIFrame && isCampaignReadyToExecute) {
        this.replaceRoute('campaigns').then(() => {
          this.setIframeHeight(true);
          IFrameHelper.sendMessage({ event: 'setUnreadMode' });
        });
      }
    },
    setUnreadView() {
      const { unreadMessageCount } = this;
      if (!this.showUnreadMessagesDialog) {
        this.handleUnreadNotificationDot();
      } else if (
        this.isIFrame &&
        unreadMessageCount > 0 &&
        !this.isWidgetOpen
      ) {
        this.replaceRoute('unread-messages').then(() => {
          this.setIframeHeight(true);
          IFrameHelper.sendMessage({ event: 'setUnreadMode' });
        });
        this.handleUnreadNotificationDot();
      }
    },
    unsetUnreadView() {
      if (this.isIFrame) {
        IFrameHelper.sendMessage({ event: 'resetUnreadMode' });
        this.setIframeHeight(false);
        this.handleUnreadNotificationDot();
      }
    },

    handleSeenCallNotificationDot() {
      if (this.isIFrame) {
        IFrameHelper.sendMessage({
          event: 'handleCallNotificationDot',
          value: false,
        });
      }
    },

    handleUnseenCallNotificationDot() {
      if (this.isIFrame) {
        IFrameHelper.sendMessage({
          event: 'handleCallNotificationDot',
          value: true,
        });
      }
    },
    handleUnreadNotificationDot() {
      const { unreadMessageCount } = this;
      if (this.isIFrame) {
        IFrameHelper.sendMessage({
          event: 'handleNotificationDot',
          unreadMessageCount,
        });
      }
    },
    createWidgetEvents(message) {
      const { eventName } = message;
      const isWidgetTriggerEvent = eventName === 'webwidget.triggered';
      if (
        isWidgetTriggerEvent &&
        ['unread-messages', 'campaigns'].includes(this.$route.name)
      ) {
        return;
      }
      this.$store.dispatch('events/create', { name: eventName });
    },
    registerListeners() {
      const { websiteToken } = window.chatwootWebChannel;
      window.addEventListener('message', e => {
        if (!IFrameHelper.isAValidEvent(e)) {
          return;
        }
        const message = IFrameHelper.getMessage(e);
        if (message.event === 'config-set') {
          this.setLocale(message.locale);
          this.setBubbleLabel();
          this.fetchOldConversations().then(() => this.setUnreadView());
          this.fetchAvailableAgents(websiteToken);
          this.setAppConfig(message);
          this.$store.dispatch('contacts/get');
          this.setCampaignReadData(message.campaignsSnoozedTill);
        } else if (message.event === 'widget-visible') {
          this.scrollConversationToBottom();
        } else if (message.event === 'change-url') {
          const { referrerURL, referrerHost } = message;
          this.initCampaigns({
            currentURL: referrerURL,
            websiteToken,
            isInBusinessHours: this.isInBusinessHours,
          });
          window.referrerURL = referrerURL;
          this.setReferrerHost(referrerHost);
        } else if (message.event === 'toggle-close-button') {
          this.isMobile = message.isMobile;
        } else if (message.event === 'push-event') {
          this.createWidgetEvents(message);
        } else if (message.event === 'set-label') {
          this.$store.dispatch('conversationLabels/create', message.label);
        } else if (message.event === 'remove-label') {
          this.$store.dispatch('conversationLabels/destroy', message.label);
        } else if (message.event === 'set-user') {
          this.$store.dispatch('contacts/setUser', message);
        } else if (message.event === 'set-custom-attributes') {
          this.$store.dispatch(
            'contacts/setCustomAttributes',
            message.customAttributes
          );
        } else if (message.event === 'delete-custom-attribute') {
          this.$store.dispatch(
            'contacts/deleteCustomAttribute',
            message.customAttribute
          );
        } else if (message.event === 'set-conversation-custom-attributes') {
          this.$store.dispatch(
            'conversation/setCustomAttributes',
            message.customAttributes
          );
        } else if (message.event === 'delete-conversation-custom-attribute') {
          this.$store.dispatch(
            'conversation/deleteCustomAttribute',
            message.customAttribute
          );
        } else if (message.event === 'set-locale') {
          this.setLocale(message.locale);
          this.setBubbleLabel();
        } else if (message.event === 'set-color-scheme') {
          this.setColorScheme(message.darkMode);
        } else if (message.event === 'toggle-open') {
          this.$store.dispatch('appConfig/toggleWidgetOpen', message.isOpen);

          const shouldShowMessageView =
            ['home'].includes(this.$route.name) &&
            message.isOpen &&
            this.messageCount;
          const shouldShowHomeView =
            !message.isOpen &&
            ['unread-messages', 'campaigns'].includes(this.$route.name);

          if (shouldShowMessageView) {
            this.replaceRoute('messages');
          }
          if (shouldShowHomeView) {
            this.$store.dispatch('conversation/setUserLastSeen');
            this.unsetUnreadView();
            this.replaceRoute('home');
          }
          if (!message.isOpen) {
            this.resetCampaign();
          }
        } else if (message.event === SDK_SET_BUBBLE_VISIBILITY) {
          this.setBubbleVisibility(message.hideMessageBubble);
        }
      });
    },
    sendLoadedEvent() {
      IFrameHelper.sendMessage(loadedEventConfig());
    },
    sendRNWebViewLoadedEvent() {
      RNHelper.sendMessage(loadedEventConfig());
    },
    setCampaignReadData(snoozedTill) {
      if (snoozedTill) {
        this.campaignsSnoozedTill = Number(snoozedTill);
      }
    },
  },
};
</script>

<template>
  <div
    v-if="!conversationSize && isFetchingList"
    class="flex items-center justify-center flex-1 h-full bg-n-background"
    :class="{ dark: prefersDarkMode }"
  >
    <Spinner size="" />
  </div>
  <div
    v-else
    class="flex flex-col justify-end h-full"
    :class="{
      'is-mobile': isMobile,
      'is-widget-right': isRightAligned,
      'is-bubble-hidden': hideMessageBubble,
      'is-flat-design': isWidgetStyleFlat,
      dark: prefersDarkMode,
    }"
  >
    <router-view />
  </div>
</template>

<style lang="scss">
@import 'widget/assets/scss/woot.scss';
</style>
