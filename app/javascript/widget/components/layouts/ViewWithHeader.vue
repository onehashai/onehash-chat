<script>
import Banner from '../Banner.vue';
import WidgetTabs from '../../views/WidgetTabs.vue';
import Branding from 'shared/components/Branding.vue';
import ChatHeader from '../ChatHeader.vue';
import ChatHeaderExpanded from '../ChatHeaderExpanded.vue';
import configMixin from '../../mixins/configMixin';
import { mapGetters } from 'vuex';
import { IFrameHelper } from 'widget/helpers/utils';

export default {
  components: {
    Banner,
    Branding,
    ChatHeader,
    ChatHeaderExpanded,
    WidgetTabs,
  },
  mixins: [configMixin],
  data() {
    return {
      showPopoutButton: false,
      scrollPosition: 0,
      ticking: true,
      disableBranding: window.chatwootWebChannel.disableBranding || false,
    };
  },
  computed: {
    ...mapGetters({
      appConfig: 'appConfig/getAppConfig',
      availableAgents: 'agent/availableAgents',
    }),
    portal() {
      return window.chatwootWebChannel.portal;
    },
    isHeaderCollapsed() {
      if (!this.hasIntroText) {
        return true;
      }
      return !this.isOnHomeView;
    },
    hasIntroText() {
      return (
        this.channelConfig.welcomeTitle || this.channelConfig.welcomeTagline
      );
    },
    showBackButton() {
      return [
        // NOTE: Hiding the back button for now
        // 'article-viewer',
        // 'messages',
        // 'prechat-form',
        // 'shopify-orders-block',
      ].includes(this.$route.name);
    },
    routeTab() {
      const routes = [
        'messages',
        'article-viewer',
        'prechat-form',
        'shopify-orders-block',
        'home',
      ];
      const idx = routes.findIndex(e => e === this.$route.name);
      if (idx === -1) {
        return null;
      }
      return idx;
    },
    isOnArticleViewer() {
      return ['article-viewer'].includes(this.$route.name);
    },

    isOnOrdersViewer() {
      return ['shopify-orders-block'].includes(this.$route.name);
    },
    isOnHomeView() {
      return ['home'].includes(this.$route.name);
    },
    opacityClass() {
      if (this.isHeaderCollapsed) {
        return {};
      }
      if (this.scrollPosition > 30) {
        return { 'opacity-30': true };
      }
      if (this.scrollPosition > 25) {
        return { 'opacity-40': true };
      }
      if (this.scrollPosition > 20) {
        return { 'opacity-60': true };
      }
      if (this.scrollPosition > 15) {
        return { 'opacity-80': true };
      }
      if (this.scrollPosition > 10) {
        return { 'opacity-90': true };
      }
      return {};
    },
  },
  mounted() {
    this.$el.addEventListener('scroll', this.updateScrollPosition);
  },
  unmounted() {
    this.$el.removeEventListener('scroll', this.updateScrollPosition);
  },
  methods: {
    closeWindow() {
      IFrameHelper.sendMessage({ event: 'closeWindow' });
    },
    updateScrollPosition(event) {
      this.scrollPosition = event.target.scrollTop;
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.ticking = false;
        });

        this.ticking = true;
      }
    },
  },
};
</script>

<template>
  <div
    class="w-full h-full bg-n-slate-2 dark:bg-n-solid-1"
    @keydown.esc="closeWindow"
  >
    <div class="relative flex flex-col h-full">
      <div
        :class="{
          expanded: !isHeaderCollapsed,
          collapsed: isHeaderCollapsed,
          'shadow-[0_10px_15px_-16px_rgba(50,50,93,0.08),0_4px_6px_-8px_rgba(50,50,93,0.04)]':
            isHeaderCollapsed,
          ...opacityClass,
        }"
      >
        <ChatHeaderExpanded
          v-if="!isHeaderCollapsed"
          :intro-heading="channelConfig.welcomeTitle"
          :intro-body="channelConfig.welcomeTagline"
          :avatar-url="channelConfig.avatarUrl"
          :show-popout-button="appConfig.showPopoutButton"
        />
        <ChatHeader
          v-if="isHeaderCollapsed"
          :title="channelConfig.websiteName"
          :avatar-url="channelConfig.avatarUrl"
          :show-popout-button="appConfig.showPopoutButton"
          :available-agents="availableAgents"
          :show-back-button="showBackButton"
        />
      </div>
      <Banner />

      <router-view class="h-full" />
      <div class="flex-1" />

      <Branding :disable-branding="disableBranding" class="pb-[70px]" />

      <WidgetTabs v-if="routeTab !== null" :active-tab-index="routeTab" />
    </div>
  </div>
</template>
