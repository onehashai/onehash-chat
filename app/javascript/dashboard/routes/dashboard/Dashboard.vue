<template>
  <div
    class="app-wrapper h-full flex-grow-0 min-h-0 w-full max-w-full ml-auto mr-auto flex flex-wrap dark:text-slate-300"
  >
    <transition name="fade">
      <template v-if="expired && showModal">
        <modal>
          <h2 style="text-align:center, display: block">
            Your Plan has expired. Please renew your plan or plan or select a
            new plan to continue using OneHash Chat
          </h2>
          <div style="margin-top: 3rem">
            <woot-submit-button
              :button-text="'Take me to Billing'"
              :disabled="isPlanClicked === true"
              @click="routeToBilling"
            />
          </div>
        </modal>
      </template>
    </transition>
    <sidebar
      :route="currentRoute"
      :show-secondary-sidebar="isSidebarOpen"
      @open-notification-panel="openNotificationPanel"
      @toggle-account-modal="toggleAccountModal"
      @open-key-shortcut-modal="toggleKeyShortcutModal"
      @close-key-shortcut-modal="closeKeyShortcutModal"
      @show-add-label-popup="showAddLabelPopup"
    />
    <section class="flex h-full min-h-0 overflow-hidden flex-1 px-0">
      <router-view />
      <command-bar />
      <account-selector
        :show-account-modal="showAccountModal"
        @close-account-modal="toggleAccountModal"
        @show-create-account-modal="openCreateAccountModal"
      />
      <add-account-modal
        :show="showCreateAccountModal"
        @close-account-create-modal="closeCreateAccountModal"
      />
      <woot-key-shortcut-modal
        :show.sync="showShortcutModal"
        @close="closeKeyShortcutModal"
        @clickaway="closeKeyShortcutModal"
      />
      <notification-panel
        v-if="isNotificationPanel"
        @close="closeNotificationPanel"
      />
      <woot-modal :show.sync="showAddLabelModal" :on-close="hideAddLabelPopup">
        <add-label-modal @close="hideAddLabelPopup" />
      </woot-modal>
    </section>
  </div>
</template>

<script>
import Sidebar from '../../components/layout/Sidebar.vue';
import CommandBar from './commands/commandbar.vue';
import { BUS_EVENTS } from 'shared/constants/busEvents';
import WootKeyShortcutModal from 'dashboard/components/widgets/modal/WootKeyShortcutModal.vue';
import AddAccountModal from 'dashboard/components/layout/sidebarComponents/AddAccountModal.vue';
import AccountSelector from 'dashboard/components/layout/sidebarComponents/AccountSelector.vue';
import AddLabelModal from 'dashboard/routes/dashboard/settings/labels/AddLabel.vue';
import NotificationPanel from 'dashboard/routes/dashboard/notifications/components/NotificationPanel.vue';
import uiSettingsMixin from 'dashboard/mixins/uiSettings';
import wootConstants from 'dashboard/constants/globals';
import { mapGetters } from 'vuex';
import WootSubmitButton from '../../components/buttons/FormSubmitButton.vue';
import alertMixin from 'shared/mixins/alertMixin';
import configMixin from 'shared/mixins/configMixin';
import AccountMixin from '../../mixins/account';
import Modal from './settings/billing/components/modal.vue';

export default {
  components: {
    Sidebar,
    CommandBar,
    WootKeyShortcutModal,
    AddAccountModal,
    AccountSelector,
    AddLabelModal,
    NotificationPanel,
    WootSubmitButton,
    Modal,
  },
  mixins: [AccountMixin, alertMixin, configMixin, uiSettingsMixin],
  data() {
    return {
      showAccountModal: false,
      showCreateAccountModal: false,
      showAddLabelModal: false,
      showShortcutModal: false,
      isNotificationPanel: false,
      displayLayoutType: '',
      planName: '',
      platformName: '',
      agentCount: 0,
      selectedProductPrice: '',
      availableProductPrices: [],
      showStatus: true,
      planExpiryDate: '',
      isValidCouponCode: false,
      inputValue: '',
      localExpiryDate: null,
      isPlanClicked: false,
      showModal: false,
      expired: false,
    };
  },
  computed: {
    currentRoute() {
      return ' ';
    },
    isSidebarOpen() {
      const { show_secondary_sidebar: showSecondarySidebar } = this.uiSettings;
      return showSecondarySidebar;
    },
    previouslyUsedDisplayType() {
      const {
        previously_used_conversation_display_type: conversationDisplayType,
      } = this.uiSettings;
      return conversationDisplayType;
    },
    previouslyUsedSidebarView() {
      const { previously_used_sidebar_view: showSecondarySidebar } =
        this.uiSettings;
      return showSecondarySidebar;
    },
    ...mapGetters({
      globalConfig: 'globalConfig/get',
      getAccount: 'accounts/getAccount',
      uiFlags: 'accounts/getUIFlags',
    }),
  },
  watch: {
    displayLayoutType() {
      const { LAYOUT_TYPES } = wootConstants;
      this.updateUISettings({
        conversation_display_type:
          this.displayLayoutType === LAYOUT_TYPES.EXPANDED
            ? LAYOUT_TYPES.EXPANDED
            : this.previouslyUsedDisplayType,
        show_secondary_sidebar:
          this.displayLayoutType === LAYOUT_TYPES.EXPANDED
            ? false
            : this.previouslyUsedSidebarView,
      });
    },
  },
  mounted() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    bus.$on(BUS_EVENTS.TOGGLE_SIDEMENU, this.toggleSidebar);
    this.initializeAccountBillingSubscription();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    bus.$off(BUS_EVENTS.TOGGLE_SIDEMENU, this.toggleSidebar);
  },

  methods: {
    handleResize() {
      const { SMALL_SCREEN_BREAKPOINT, LAYOUT_TYPES } = wootConstants;
      let throttled = false;
      const delay = 150;

      if (throttled) {
        return;
      }
      throttled = true;

      setTimeout(() => {
        throttled = false;
        if (window.innerWidth <= SMALL_SCREEN_BREAKPOINT) {
          this.displayLayoutType = LAYOUT_TYPES.EXPANDED;
        } else {
          this.displayLayoutType = LAYOUT_TYPES.CONDENSED;
        }
      }, delay);
    },
    toggleSidebar() {
      this.updateUISettings({
        show_secondary_sidebar: !this.isSidebarOpen,
        previously_used_sidebar_view: !this.isSidebarOpen,
      });
    },
    openCreateAccountModal() {
      this.showAccountModal = false;
      this.showCreateAccountModal = true;
    },
    closeCreateAccountModal() {
      this.showCreateAccountModal = false;
    },
    toggleAccountModal() {
      this.showAccountModal = !this.showAccountModal;
    },
    toggleKeyShortcutModal() {
      this.showShortcutModal = true;
    },
    closeKeyShortcutModal() {
      this.showShortcutModal = false;
    },
    showAddLabelPopup() {
      this.showAddLabelModal = true;
    },
    hideAddLabelPopup() {
      this.showAddLabelModal = false;
    },
    openNotificationPanel() {
      this.isNotificationPanel = true;
    },
    closeNotificationPanel() {
      this.isNotificationPanel = false;
    },
    hidePlanModal() {
      this.$emit('hideModal');
    },
    routeToBilling() {
      this.showModal = false;
      setTimeout(() => {
        this.isPlanClicked = true;
      }, 100);

      // Proceed to route change
      this.$router
        .push({
          name: 'billing_settings_index',
          params: { accountId: this.accountId },
        })
        .catch(error => {
          // Handle redirection error if needed
          console.error('Error while routing:', error);
        });
    },
    async initializeAccountBillingSubscription() {
      this.$store.dispatch('accounts/getBillingSubscription').then(() => {
        try {
          const {
            available_product_prices,
            plan_name,
            platform_name,
            plan_id,
            allowed_no_agents,
            plan_expiry_date,
          } = this.getAccount(this.accountId);
          this.planName = plan_name;
          this.$store.commit('setPlanName', plan_name);
          this.platformName = platform_name;
          this.selectedProductPrice = plan_id;
          this.agentCount = allowed_no_agents;
          this.availableProductPrices = available_product_prices;
          const dateObject = new Date(plan_expiry_date);
          const day = String(dateObject.getDate()).padStart(2, '0');
          const monthIndex = dateObject.getMonth();
          const year = dateObject.getFullYear();
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          const formattedDate = `${day} ${monthNames[monthIndex]} ${year}`;
          this.planExpiryDate = formattedDate;
          this.localExpiryDate = dateObject;
          const currentDate = new Date();
          const planExpirationDate = this.localExpiryDate;
          if (currentDate > planExpirationDate) {
            this.expired = true;
            this.showModal = true;
          }
        } catch (error) {
          // not showing error
        }
      });
    },
  },
};
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  position: absolute;
  z-index: 9999;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
