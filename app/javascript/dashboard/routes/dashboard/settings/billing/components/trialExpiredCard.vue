<!-- eslint-disable vue/no-mutating-props -->
<template>
  <modal :show.sync="show" :on-close="onClose">
    <div>
      <h3>
        Your Plan expired on {{ localFormattedDate }}. Please renew your plan or
        plan or select a new plan to continue using OneHash Chat
      </h3>
    </div>
    <div class="row flex justify-center items-center">
      <woot-submit-button
        :button-text="'Take me to Billing'"
        :disabled="isPlanClicked === true"
        @click="() => routeToBilling()"
      />
    </div>
  </modal>
</template>

<script>
import alertMixin from 'shared/mixins/alertMixin';
import AccountAPI from '../../../../api/account';
import Modal from '../../../../components/Modal.vue';
import WootSubmitButton from '../../../../components/buttons/FormSubmitButton.vue';
import { mapGetters } from 'vuex';

export default {
  components: {
    WootSubmitButton,
    Modal,
  },
  mixins: [alertMixin],
  props: {
    planId: {
      type: [String, Number],
      default: 0,
    },
    planName: {
      type: [String, Number],
      default: 'Trial',
    },
    availableProductPrices: {
      type: Array,
      default: () => {},
    },
    planExpiryDate: {
      type: String,
      default: null,
    },
    onClose: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      error: '',
      products: '',
      isPlanClicked: false,
      clickedPlan: null,
      show: false,
      localPlanExpiryDate: this.planExpiryDate,
      localFormattedDate: '',
    };
  },
  computed: {
    ...mapGetters({
      globalConfig: 'globalConfig/get',
      getAccount: 'accounts/getAccount',
      uiFlags: 'accounts/getUIFlags',
    }),
    isUpdating() {
      return this.uiFlags.isUpdating;
    },
  },
  mounted() {
    if (this.planHasExpired(this.localPlanExpiryDate)) {
      this.show = true;
    }
  },
  methods: {
    hidePlanModal() {
      this.$emit('hideModal');
    },
    routeToBilling() {
      this.$router.push({
        name: 'billing_settings_index',
        params: { accountId: this.accountId },
      });
      this.isPlanClicked = true;
      this.show = false;
    },
    submitSubscription(value) {
      const payload = { product_price: value };
      this.isPlanClicked = true;
      this.clickedPlan = value;
      AccountAPI.changePlan(payload)
        .then(response => {
          window.location.href = response.data.url;
          this.isPlanClicked = false;
          this.clickedPlan = null;
        })
        .catch(error => {
          this.isPlanClicked = false;
          this.isPlanClicked = false;
          this.clickedPlan = null;
        });
    },
    async initializeAccountBillingSubscription() {
      this.$store.dispatch('accounts/getBillingSubscription').then(() => {
        try {
          const { plan_id, plan_expiry_date } = this.getAccount(this.accountId);
          this.selectedProductPrice = plan_id;
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
          this.localPlanExpiryDate = dateObject;
          const formattedDate = `${day} ${monthNames[monthIndex]} ${year}`;
          this.localFormattedDate = formattedDate;
        } catch (error) {
          // not showing error
        }
      });
    },
    planHasExpired(expirationDate) {
      const currentDate = new Date();
      const planExpirationDate = new Date(expirationDate);

      // Compare the current date with the plan's expiration date
      return currentDate > planExpirationDate;
    },
  },
};
</script>
<style lang="scss" scoped>
.alert-wrap {
  font-size: var(--font-size-small);
  margin: var(--space-medium) var(--space-large) var(--space-zero);

  .callout {
    align-items: center;
    border-radius: var(--border-radius-normal);
    display: flex;
  }
}
.icon-wrap {
  margin-left: var(--space-smaller);
  margin-right: var(--space-slab);
}

.solution--price {
  display: flex;
  align-items: center;
  justify-content: center;
}
.solution-description {
  color: #869ab8 !important;
  font-size: 17px;
  margin-bottom: 1.3em;
}

.plan-column {
  max-width: 280px;
  width: 28%;
  margin-top: 50px;
  margin-left: 20px;
  margin-right: 20px;
  box-shadow: 0 1.5rem 4rem rgba(22, 28, 45, 0.1) !important;

  &:first-child {
    margin-right: 0;
  }

  &:nth-child(2) {
    margin-right: 0;
  }
}
.badge-pill {
  background-color: rgba(31, 147, 255, 0.1);
  color: #1f93ff;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 16px;
  width: fit-content;
  margin: auto;
  border-radius: 10px;
  padding: 6px 15px;
}

.justify-content-center {
  justify-content: center;
}

.description {
  height: 30px;
}
</style>
