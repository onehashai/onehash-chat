<script>
import { mapGetters } from 'vuex';
import ShopifyOrderCancellation from './ShopifyOrderCancellation.vue';
import ConversationHeader from './ConversationHeader.vue';
import DashboardAppFrame from '../DashboardApp/Frame.vue';
import EmptyState from './EmptyState/EmptyState.vue';
import MessagesView from './MessagesView.vue';
import ConversationSidebar from './ConversationSidebar.vue';
import { emitter } from 'shared/helpers/mitt';
import { BUS_EVENTS } from 'shared/constants/busEvents';
import CallDialog from 'dashboard/routes/dashboard/conversation/contact/CallDialog.vue';
import ShopifyOrderRefund from './ShopifyOrderRefund.vue';
import ShopifyOrderReturn from './ShopifyOrderReturn.vue';
import ShopifyOrderFulfill from './ShopifyOrderFulfill.vue';

export default {
  components: {
    CallDialog,
    ShopifyOrderCancellation,
    ShopifyOrderRefund,
    ShopifyOrderReturn,
    ShopifyOrderFulfill,
    ConversationSidebar,
    ConversationHeader,
    DashboardAppFrame,
    EmptyState,
    MessagesView,
  },

  props: {
    inboxId: {
      type: [Number, String],
      default: '',
      required: false,
    },
    isInboxView: {
      type: Boolean,
      default: false,
    },
    isContactPanelOpen: {
      type: Boolean,
      default: true,
    },
    isOnExpandedLayout: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['contactPanelToggle'],
  data() {
    return {
      activeIndex: 0,
      showCallModal: false,
      refundOrder: null,
      returnOrder: null,
      fulfillOrder: null,
      cancelOrder: null,
    };
  },
  computed: {
    ...mapGetters({
      currentChat: 'getSelectedChat',
      dashboardApps: 'dashboardApps/getRecords',
      currentUser: 'getCurrentUser',
      activeCall: 'getCallState',
    }),
    sender() {
      return {
        name: this.currentUser.name,
        thumbnail: this.currentUser.avatar_url,
      };
    },
    dashboardAppTabs() {
      return [
        {
          key: 'messages',
          index: 0,
          name: this.$t('CONVERSATION.DASHBOARD_APP_TAB_MESSAGES'),
        },
        ...this.dashboardApps.map((dashboardApp, index) => ({
          key: `dashboard-${dashboardApp.id}`,
          index: index + 1,
          name: dashboardApp.title,
        })),
      ];
    },
    showContactPanel() {
      return this.isContactPanelOpen && this.currentChat.id;
    },
  },
  watch: {
    activeCall: {
      immediate: true,
      handler(roomId) {
        if (!roomId) {
          this.showCallModal = false;
        }
      },
    },
    'currentChat.inbox_id': {
      immediate: true,
      handler(inboxId) {
        if (inboxId) {
          this.$store.dispatch('inboxAssignableAgents/fetch', [inboxId]);
        }
      },
    },
    'currentChat.id'() {
      this.fetchLabels();
      this.activeIndex = 0;
    },
  },
  mounted() {
    this.fetchLabels();
    this.$store.dispatch('dashboardApps/get');
    emitter.on(BUS_EVENTS.REFUND_ORDER, this.setRefundOrder);
    emitter.on(BUS_EVENTS.RETURN_ORDER, this.setReturnOrder);
    emitter.on(BUS_EVENTS.FULFILL_ORDER, this.setFulfillOrder);
    emitter.on(BUS_EVENTS.CANCEL_ORDER, this.setCancelOrder);
    emitter.on(BUS_EVENTS.START_CALL, this.startCall);
  },
  unmounted() {
    emitter.off(BUS_EVENTS.REFUND_ORDER, this.setRefundOrder);
    emitter.off(BUS_EVENTS.RETURN_ORDER, this.setReturnOrder);
    emitter.off(BUS_EVENTS.FULFILL_ORDER, this.setFulfillOrder);
    emitter.off(BUS_EVENTS.CANCEL_ORDER, this.setCancelOrder);
    emitter.off(BUS_EVENTS.START_CALL, this.startCall);
  },

  methods: {
    generateJitsiRoomId(length = 16) {
      const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let roomId = '';
      for (let i = 0; i < length; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return roomId;
    },
    async setRefundOrder(order) {
      this.refundOrder = order;
    },
    async setReturnOrder(order) {
      this.returnOrder = order;
    },
    async setFulfillOrder(order) {
      this.fulfillOrder = order;
    },
    async setCancelOrder(order) {
      this.cancelOrder = order;
    },
    async startCall() {
      if (this.activeCall) return;

      const roomId = this.generateJitsiRoomId();

      await this.$store.dispatch('createCall', {
        chat_id: this.currentChat.id,
        room_id: roomId,
        sender: this.sender,
      });

      this.showCallModal = true;
    },
    closeCall() {
      this.showCallModal = false;
      this.$store.dispatch('endCall', {
        chat_id: this.currentChat.id,
        room_id: this.activeCall.room_id,
      });
    },
    fetchLabels() {
      if (!this.currentChat.id) {
        return;
      }
      this.$store.dispatch('conversationLabels/get', this.currentChat.id);
    },
    onToggleContactPanel() {
      this.$emit('contactPanelToggle');
    },
    onDashboardAppTabChange(index) {
      this.activeIndex = index;
    },
  },
};
</script>

<template>
  <div
    class="conversation-details-wrap bg-n-background"
    :class="{
      'border-l rtl:border-l-0 rtl:border-r border-n-weak': !isOnExpandedLayout,
    }"
  >
    <ConversationHeader
      v-if="currentChat.id"
      :chat="currentChat"
      :is-inbox-view="isInboxView"
      :is-contact-panel-open="isContactPanelOpen"
      :show-back-button="isOnExpandedLayout && !isInboxView"
      @contact-panel-toggle="onToggleContactPanel"
    />
    <woot-tabs
      v-if="dashboardApps.length && currentChat.id"
      :index="activeIndex"
      class="-mt-px bg-white dashboard-app--tabs dark:bg-slate-900"
      @change="onDashboardAppTabChange"
    >
      <woot-tabs-item
        v-for="tab in dashboardAppTabs"
        :key="tab.key"
        :index="tab.index"
        :name="tab.name"
        :show-badge="false"
      />
    </woot-tabs>
    <div v-show="!activeIndex" class="flex h-full min-h-0 m-0">
      <MessagesView
        v-if="currentChat.id"
        :inbox-id="inboxId"
        :is-inbox-view="isInboxView"
        :is-contact-panel-open="isContactPanelOpen"
        @contact-panel-toggle="onToggleContactPanel"
      />
      <EmptyState
        v-if="!currentChat.id && !isInboxView"
        :is-on-expanded-layout="isOnExpandedLayout"
      />
      <ConversationSidebar
        v-if="showContactPanel"
        :current-chat="currentChat"
        @toggle-contact-panel="onToggleContactPanel"
      />
      <CallDialog
        v-if="showCallModal"
        :agent-id="currentUser.id"
        :display-name="currentUser.name"
        :email="currentUser.email"
        :room-id="activeCall.room_id"
        :jwt="activeCall.jwt"
        @close="closeCall"
      />
      <ShopifyOrderCancellation v-if="cancelOrder" :order="cancelOrder" />
      <ShopifyOrderRefund v-if="refundOrder" :order="refundOrder" />
      <ShopifyOrderReturn v-if="returnOrder" :order="returnOrder" />
      <ShopifyOrderFulfill v-if="fulfillOrder" :order="fulfillOrder" />
    </div>
    <DashboardAppFrame
      v-for="(dashboardApp, index) in dashboardApps"
      v-show="activeIndex - 1 === index"
      :key="currentChat.id + '-' + dashboardApp.id"
      :is-visible="activeIndex - 1 === index"
      :config="dashboardApps[index].content"
      :position="index"
      :current-chat="currentChat"
    />
  </div>
</template>

<style lang="scss" scoped>
.conversation-details-wrap {
  @apply flex flex-col min-w-0 w-full;
}

.dashboard-app--tabs {
  ::v-deep {
    .tabs-title {
      a {
        @apply pb-2 pt-1;
      }
    }
  }
}
</style>
