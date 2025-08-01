<script setup>
import Button from 'shared/components/Button.vue';
import { computed } from 'vue';
import { format } from 'date-fns';
import { useI18n } from 'vue-i18n';
import { emitter } from 'shared/helpers/mitt';
import { BUS_EVENTS } from '../../../../shared/constants/busEvents';

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  shop: {
    type: String,
    required: true,
  },
});

const cancel_reasons = {
  CUSTOMER: 'The customer wanted to cancel the order.',
  DECLINED: 'Payment was declined.',
  FRAUD: 'The order was fraudulent.',
  INVENTORY: 'There was insufficient inventory.',
  OTHER: 'The order was canceled for an unlisted reason.',
  STAFF: 'Staff made an error.',
};

const getCancelReasonString = reason => {
  return cancel_reasons[reason.toUpperCase()];
};

const financial_statuses = {
  authorized: 'AUTHORIZED',
  paid: 'PAID',
  partially_paid: 'PARTIALLY_PAID',
  partially_refunded: 'PARTIALLY_REFUNDED',
  pending: 'PENDING',
  refunded: 'REFUNDED',
  voided: 'VOIDED',
};

const isOrderInFinancialStatus = status => {
  return props.order.financial_status?.toUpperCase() === status;
};

const fulfillment_statuses = {
  fulfilled: 'FULFILLED',
};

const isOrderInFulfillmentStatus = status => {
  return props.order.fulfillment_status?.toUpperCase() === status;
};

const emitCancelOrder = () => {
  emitter.emit(BUS_EVENTS.CANCEL_ORDER, props.order);
};

const emitFulfillOrder = () => {
  emitter.emit(BUS_EVENTS.FULFILL_ORDER, props.order);
};

const emitRefundOrder = () => {
  emitter.emit(BUS_EVENTS.REFUND_ORDER, props.order);
};

const emitReturnOrder = () => {
  emitter.emit(BUS_EVENTS.RETURN_ORDER, props.order);
};

const { t } = useI18n();

const formatDate = dateString => {
  return format(new Date(dateString), 'MMM d, yyyy');
};

const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
};

const getStatusClass = status => {
  const classes = {
    paid: 'bg-n-teal-5 text-n-teal-12',
  };
  return classes[status] || 'bg-slate-50 text-slate-700';
};

const getStatusI18nKey = (type, status = '') => {
  return `CONVERSATION_SIDEBAR.SHOPIFY.${type.toUpperCase()}_STATUS.${status.toUpperCase()}`;
};

const fulfillmentStatus = computed(() => {
  const { fulfillment_status: status } = props.order;
  if (!status) {
    return '';
  }
  return t(getStatusI18nKey('FULFILLMENT', status));
});

const financialStatus = computed(() => {
  const { financial_status: status } = props.order;
  if (!status) {
    return '';
  }
  return t(getStatusI18nKey('FINANCIAL', status));
});

const getFulfillmentClass = status => {
  const classes = {
    fulfilled: 'text-green-600',
    partial: 'text-yellow-600',
    unfulfilled: 'text-red-600',
  };
  return classes[status] || 'text-slate-600';
};
</script>

<template>
  <div
    class="py-3 border-b border-n-weak last:border-b-0 flex flex-col gap-1.5"
  >
    <div class="flex justify-between items-center">
      <div class="font-medium flex">
        <a
          :href="`https://${shop}/admin/orders/${order.id}`"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:underline text-n-slate-12 cursor-pointer truncate"
        >
          {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.ORDER_ID', { id: order.name }) }}
          <i class="i-lucide-external-link pl-5" />
        </a>
      </div>
      <div
        :class="getStatusClass(order.financial_status)"
        class="text-xs px-2 py-1 rounded capitalize truncate"
        :title="financialStatus"
      >
        {{ financialStatus }}
      </div>
    </div>
    <div class="text-sm text-n-slate-12">
      <span class="text-n-slate-11 border-r border-n-weak pr-2">
        {{ formatDate(order.created_at) }}
      </span>
      <span class="text-n-slate-11 pl-2">
        {{ formatCurrency(order.total_price, order.currency) }}
      </span>
    </div>
    <div v-if="fulfillmentStatus">
      <span
        :class="getFulfillmentClass(order.fulfillment_status)"
        class="capitalize font-medium"
        :title="fulfillmentStatus"
      >
        {{ fulfillmentStatus }}
      </span>
    </div>

    <div class="selection-controls items-center">
      <button
        v-if="
          !isOrderInFulfillmentStatus(fulfillment_statuses.fulfilled) &&
          !isOrderInFinancialStatus(financial_statuses.refunded)
        "
        @click="emitFulfillOrder"
      >
        {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.FULFILL.BUTTON_TEXT') }}
      </button>
      <button
        v-if="
          !isOrderInFulfillmentStatus(fulfillment_statuses.fulfilled) &&
          !order.cancelled_at
        "
        @click="emitCancelOrder"
      >
        {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.CANCEL.BUTTON_TEXT') }}
      </button>
      <button
        v-if="!isOrderInFinancialStatus(financial_statuses.refunded)"
        @click="emitRefundOrder"
      >
        {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.BUTTON_TEXT') }}
      </button>

      <button
        v-if="!isOrderInFinancialStatus(financial_statuses.refunded)"
        @click="emitReturnOrder"
      >
        {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.RETURN.BUTTON_TEXT') }}
      </button>
    </div>

    <div
      v-if="order.cancelled_at"
      class="bg-blue-500 rounded text-sm"
      :title="getCancelReasonString(order.cancel_reason)"
    >
      Cancelled: {{ getCancelReasonString(order.cancel_reason) }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.selection-controls {
  @apply flex flex-row gap-4;

  button {
    @apply px-3 py-1 text-sm border rounded
                 bg-slate-700 dark:bg-slate-700
                 border-slate-600 dark:border-slate-600
                 text-white dark:text-white
                 hover:bg-slate-600 hover:dark:bg-slate-600;
  }
}
</style>
