<script setup>
import FormSelect from 'v3/components/Form/Select.vue';
// import Input from 'v3/components/Form/Input.vue';
import Input from 'dashboard/components-next/input/Input.vue';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { debounce } from '@chatwoot/utils';
import { BUS_EVENTS } from '../../../../shared/constants/busEvents';
import { emitter } from 'shared/helpers/mitt';
import currency_codes from 'shared/constants/currency_codes';
import SimpleDivider from 'v3/components/Divider/SimpleDivider.vue';
import useVuelidate from '@vuelidate/core';
import { maxValue, minValue, required } from '@vuelidate/validators';
import QuantityField from './QuantityField.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import OrdersAPI from 'dashboard/api/shopify/orders';
import ShopifyLocationsAPI from 'dashboard/api/shopify/locations';
import { isAxiosError } from 'axios';
import { useAlert } from 'dashboard/composables';

import { useStore } from 'vuex';
import { useMapGetter } from 'dashboard/composables/store';

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const store = useStore();

const currentChat = useMapGetter('getSelectedChat');
const currentUser = useMapGetter('getCurrentUser');

const locations = ref([]);

const unfulfilledQuantityStates = ref(
  Object.fromEntries(props.order.line_items.map(e => [e.id, 0]))
);

const fulfilledQuantityStates = ref(
  Object.fromEntries(props.order.line_items.map(e => [e.id, 0]))
);

const sender = computed(() => {
  return {
    name: currentUser.value.name,
    thumbnail: currentUser.value.avatar_url,
  };
});

const reasons = [
  'Wrong item received',
  'Item was damaged or defective',
  'Item not as described',
  'Order arrived late',
  'Duplicate or accidental order',
];

const item_restock_options = {
  no_restock: 'NO_RESTOCK',
  cancel: 'CANCEL',
  return: 'RETURN',
};

const onClose = () => {
  emitter.emit(BUS_EVENTS.REFUND_ORDER, null);
};

/**
 * @typedef {Object} Money
 * @property {string} amount
 * @property {string} currencyCode
 */

/**
 * @typedef {Object} MaximumRefundableSet
 * @property {Money} presentmentMoney
 * @property {Money} shopMoney
 */

/**
 * @typedef {Object} ParentTransaction
 * @property {string} id
 */

/**
 * @typedef {Object} SuggestedTransaction
 * @property {string} gateway
 * @property {ParentTransaction} parentTransaction
 */

/**
 * @typedef {Object} SuggestedRefund
 * @property {MaximumRefundableSet} maximumRefundableSet
 * @property {SuggestedTransaction[]} suggestedTransactions
 */

/** @type {import('vue').Ref<SuggestedRefund|null>} */
const suggestedRefund = ref(null);

const stockParameters = ref(
  Object.fromEntries(
    props.order.line_items
      .map(e => [
        [
          `ful_${e.id}`,
          {
            restock: false,
            fulfilled: true,
            location: null,
          },
        ],
        [
          `unful_${e.id}`,
          {
            restock: false,
            fulfilled: false,
            location: null,
          },
        ],
      ])
      .flatMap(e => e)
  )
);

const initialFormState = {
  refundAmount: 0,
  refundNote: null,
  customRefundReason: null,
  sendNotification: true,
  unfulfilledQuantity: computed(() => unfulfilledQuantityStates.value),
  fulfilledQuantity: computed(() => fulfilledQuantityStates.value),
  stockParameters: computed(() => stockParameters.value),
};

const formState = reactive(initialFormState);

watch(
  stockParameters,
  (newVal, oldVal) => {
    Object.keys(newVal).forEach(key => {
      const newStockParam = newVal[key];

      const oldStockParam = oldVal ? oldVal[key] : null;
      if (
        newStockParam.fulfilled &&
        newStockParam.restock &&
        (!oldVal || !oldStockParam.restock)
      ) {
        formState.stockParameters[key].location = locations.value[0].id;
      }
    });
  },
  { immediate: true, deep: true }
);

const lineItemsSegmentedByFulfillType = ref({});

const rules = computed(() => {
  const unfulfilledQuantitiesRules = {};
  const fulfilledQuantitiesRules = {};

  props.order?.line_items.forEach(item => {
    if (Object.keys(lineItemsSegmentedByFulfillType.value).length === 0) {
      return;
    }

    const segment =
      lineItemsSegmentedByFulfillType.value[
        `gid://shopify/LineItem/${item.id}`
      ];

    if (
      segment.unfulfilled_and_refundable > 0 &&
      unfulfilledQuantityStates[item.id] > 0
    ) {
      unfulfilledQuantitiesRules[item.id] = {
        required,
        minValue: minValue(0),
        maxValue: maxValue(segment.unfulfilled_and_refundable),
      };
    }

    if (
      segment.fulfilled_and_refundable > 0 &&
      fulfilledQuantityStates[item.id] > 0
    ) {
      fulfilledQuantitiesRules[item.id] = {
        required,
        minValue: minValue(0),
        maxValue: maxValue(segment.fulfilled_and_refundable),
      };
    }
  });

  const notZero = value => value !== 0;

  return {
    refundAmount: {
      required,
      notZero,
      maxValue: value => {
        const max =
          suggestedRefund.value === null
            ? 0
            : Number(
                suggestedRefund.value.maximumRefundableSet.shopMoney.amount
              );
        return Number(value) <= max;
      },
    },
    refundNote: { required },
    unfulfilledQuantities: unfulfilledQuantitiesRules,
    fulfilledQuantities: fulfilledQuantitiesRules,
  };
});

const v$ = useVuelidate(rules, formState);

const calculatedRefundForLineItems = ref(
  Object.fromEntries(
    props.order.line_items
      .map(e => [
        [`ful_${e.id}`, { refund: 0, tax: 0 }],
        [`unful_${e.id}`, { refund: 0, tax: 0 }],
      ])
      .flatMap(e => e)
  )
);

const item_total_price = (item, pref) => {
  return calculatedRefundForLineItems.value[`${pref}_${item.id}`].refund;
};

let cancellationTimeout = null;

const onOrderUpdate = data => {
  if (data.order.id !== props.order.id) return;

  onClose();
  emitter.emit('newToastMessage', {
    message: 'Refund create successfully',
    action: null,
  });

  clearTimeout(cancellationTimeout);
};

const getAvailableLocations = async () => {
  try {
    const result = await ShopifyLocationsAPI.get();
    locations.value = result.data.locations;
  } catch (e) {}
};

/**
 * @typedef {Object} FulfillmentLineItem
 * @property {string} id
 * @property {number} quantity
 * @property {Object} lineItem
 * @property {string} lineItem.id
 */

/**
 * @typedef {Object} Fulfillment
 * @property {FulfillmentLineItem[]} fulfillmentLineItems
 */

/**
 * @type {import('vue').Ref<Fulfillment[]>}
 */
const fulfillments = ref([]);

/**
 * @typedef {Object} LineItem
 * @property {string} id
 * @property {number} refundableQuantity
 */

/**
 * @type {import('vue').Ref<LineItem[]>}
 */
const orderLineItems = ref([]);

const reverseFulfillmentLineItems = ref([]);

const orderInfo = ref(null);

const getOrderInfo = async () => {
  const result = await OrdersAPI.orderDetails({ orderId: props.order.id });

  orderInfo.value = result.data.order;

  reverseFulfillmentLineItems.value = result.data.order.returns.nodes.flatMap(
    returnItem =>
      returnItem.reverseFulfillmentOrders.nodes.flatMap(rfo =>
        rfo.lineItems.nodes.flatMap(e => ({
          returnStatus: returnItem.status,
          ...e.fulfillmentLineItem,
        }))
      )
  );

  suggestedRefund.value = result.data.order.suggestedRefund;

  fulfillments.value = result.data.order.fulfillments.map(
    e => e.fulfillmentLineItems.nodes
  );

  const pendingReturns = {};
  reverseFulfillmentLineItems.value.forEach(reverseFLI => {
    const lid = reverseFLI.lineItem.id;
    if (
      reverseFLI.returnStatus !== 'OPEN' &&
      reverseFLI.returnStatus !== 'REQUESTED'
    ) {
      return;
    }
    if (lid in pendingReturns) {
      pendingReturns[lid] += reverseFLI.quantity;
    } else {
      pendingReturns[lid] = reverseFLI.quantity;
    }
  });
  result.data.order.lineItems.nodes.forEach(e => {
    const refundableQuantity = e.refundableQuantity;
    const unfulfilledQuantity = e.unfulfilledQuantity;

    const pendingReturnQuantity = pendingReturns[e.id] || 0;

    const fulfilled_and_refundable = Math.max(
      refundableQuantity -
        unfulfilledQuantity /* - pendingReturnQuantity, NOTE:  This should be subtracted but currently giving wrong value */,
      0
    );

    const unfulfilled_and_refundable =
      Math.min(refundableQuantity, unfulfilledQuantity) - pendingReturnQuantity;

    lineItemsSegmentedByFulfillType.value[e.id] = {
      fulfilled_and_refundable,
      unfulfilled_and_refundable,
      ...props.order.line_items.find(
        i => e.id === `gid://shopify/LineItem/${i.id}`
      ),
    };
  });

  orderLineItems.value = result.data.order.lineItems.nodes;
};

onMounted(() => {
  emitter.on(BUS_EVENTS.ORDER_UPDATE, onOrderUpdate);
  getAvailableLocations();
  getOrderInfo();
});

onUnmounted(() => {
  emitter.off(BUS_EVENTS.ORDER_UPDATE, onOrderUpdate);
  clearTimeout(cancellationTimeout);
});

watch(
  lineItemsSegmentedByFulfillType,
  newVal => {
    Object.keys(lineItemsSegmentedByFulfillType.value).forEach(segmentKey => {
      const segment = lineItemsSegmentedByFulfillType.value[segmentKey];

      if (
        segment.unfulfilled_and_refundable > 0 ||
        segment.fulfilled_and_refundable > 0
      ) {
        stockParameters.value[`ful_${segment.id}`] = {
          fulfilled: true,
          restock: false,
          location: null,
        };

        stockParameters.value[`unful_${segment.id}`] = {
          fulfilled: false,
          restock: false,
          location: null,
        };
      }
    });
  },
  {
    immediate: true,
    deep: true,
  }
);

const calculateRefund = async () => {
  const payload = {
    orderId: props.order.id,
    currency: props.order.currency,
    refundLineItems: [
      ...Object.entries(unfulfilledQuantityStates.value)
        // .filter(([, qty]) => qty > 0)
        .map(([e, qty]) => ({
          line_item_id: e,
          quantity: qty,
          restock_type: 'cancel',
          pref: 'unful',
        })),
      ...Object.entries(fulfilledQuantityStates.value)
        // .filter(([, qty]) => qty > 0)
        .map(([e, qty]) => ({
          line_item_id: e,
          quantity: qty,
          restock_type: 'no_stock',
          pref: 'ful',
        })),
    ],
  };

  payload.refundLineItems.forEach(refundItem => {
    const lid = Number(refundItem.line_item_id);
    const li = props.order.line_items.find(e => e.id === lid);

    const tax = li.tax_lines.reduce(
      (acc, curr) => Number(curr.price_set.shop_money.amount) + acc,
      0
    );

    calculatedRefundForLineItems.value[`${refundItem.pref}_${lid}`] = {
      refund: Number(li.price_set.shop_money.amount) * refundItem.quantity,
      tax: Number((tax / Number(li.quantity)) * Number(refundItem.quantity)),
    };
  });
};
const debouncedRefund = debounce(value => {
  calculateRefund();
}, 2000);

const currentSubtotal = computed(() => {
  return Object.values(calculatedRefundForLineItems.value).reduce(
    (acc, cur) => cur.refund + acc,
    0
  );
});

watch(
  calculatedRefundForLineItems,
  newVal => {
    formState.refundAmount = Object.values(newVal).reduce(
      (acc, cur) => acc + cur.refund + cur.tax,
      0
    );
  },
  { deep: true, immediate: true }
);

const currentTax = computed(() => {
  return Object.values(calculatedRefundForLineItems.value).reduce(
    (acc, cur) => cur.tax + acc,
    0
  );
});

/**
 * @typedef {[string, string]} AvailableRefundTuple
 * A tuple containing the refund amount and the currency string.
 */

/**
 * The available refund as a tuple of [amount, currency], or null if unavailable.
 * @type {import('vue').ComputedRef<AvailableRefundTuple|null>}
 */
const availableRefund = computed(() => {
  const suggestedRefundShopAmount =
    suggestedRefund.value?.maximumRefundableSet.shopMoney.amount;
  if (suggestedRefund.value == null) {
    return null;
  }
  const suggestedRefundShopCurrency =
    suggestedRefund.value?.maximumRefundableSet.shopMoney.currencyCode;
  return [
    suggestedRefundShopAmount,
    currency_codes[suggestedRefundShopCurrency],
  ];
});

// const currentRefund = ref(null);

// Only allow numbers with up to 2 decimals
function onInput(e) {
  let val = e.target.value;

  // Remove all characters except digits and dot
  val = val.replace(/[^0-9.]/g, '');

  // Only allow one dot
  const parts = val.split('.');
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit to 2 decimal places
  if (parts[1]?.length > 2) {
    val = parts[0] + '.' + parts[1].slice(0, 2);
  }

  // Prevent leading dot (".5" -> "0.5")
  if (val.startsWith('.')) {
    val = '0' + val;
  }

  formState.refundAmount = val;
}

function onBlur() {
  // Format to 2 decimals if not empty
  if (formState.refundAmount && !Number.isNaN(formState.refundAmount)) {
    formState.refundAmount = parseFloat(formState.refundAmount).toFixed(2);
  }
}

const cancellationState = ref(null);

function getRestockStatus(rli, allLocations) {
  if (rli.restock_type === item_restock_options.cancel) {
    return 'Cancelled';
  }
  if (rli.restock_type === item_restock_options.no_restock) {
    return 'Pending';
  }
  const location = allLocations.find(loc => loc.id === rli.location_id);
  return location ? location.name : 'Unknown Location';
}

const createRefundMessage = (refundLineItems, id, totalSet) => {
  const messagePayload = {
    order_id: props.order.id,
    order_name: props.order.name,
    event_id: id,
    total_refund: `${currency_codes[totalSet.presentmentMoney.currencyCode]} ${totalSet.presentmentMoney.amount}`,
    line_items: refundLineItems.map(rli => ({
      id: rli.line_item_id,
      name: props.order.line_items.find(e => Number(rli.line_item_id) === e.id)
        .name,
      qty: rli.quantity,
      restock: getRestockStatus(rli, locations.value),
    })),
    sender: sender.value,
    chat_id: currentChat.value.id,
    status_url: props.order.order_status_url,
  };

  store.dispatch('refundOrder', messagePayload);
};

const refundOrder = async $t => {
  v$.value.$touch();

  if (v$.value.$invalid) {
    return;
  }

  try {
    cancellationState.value = 'processing';

    const refundLineItems = [
      ...Object.entries(unfulfilledQuantityStates.value)
        .filter(([, qty]) => qty > 0)
        .map(([e, qty]) => ({
          line_item_id: e,
          quantity: qty,
          location_id: !stockParameters.value[`unful_${e}`].restock
            ? null
            : stockParameters.value[`unful_${e}`].location,
          restock_type: stockParameters.value[`unful_${e}`].restock
            ? item_restock_options.cancel
            : item_restock_options.no_restock,
        })),
      ...Object.entries(fulfilledQuantityStates.value)
        .filter(([, qty]) => qty > 0)
        .map(([e, qty]) => ({
          line_item_id: e,
          quantity: qty,
          location_id: !stockParameters.value[`ful_${e}`].restock
            ? null
            : stockParameters.value[`ful_${e}`].location,
          restock_type: stockParameters.value[`ful_${e}`].restock
            ? item_restock_options.return
            : item_restock_options.no_restock,
        })),
    ];

    const payload = {
      orderId: props.order.id,
      transactions: [
        {
          amount: Number(formState.refundAmount),
          order_id: props.order.id,
          parent_id:
            suggestedRefund.value.suggestedTransactions[0].parentTransaction.id,
          gateway: suggestedRefund.value.suggestedTransactions[0].gateway,
          kind: 'refund',
        },
      ],
      note: formState.refundNote,
      notify: formState.sendNotification,
      currency:
        suggestedRefund.value.maximumRefundableSet.shopMoney.currencyCode,
      shipping: {}, // currentRefund.value.shipping,
      // refundLineItems: currentRefund.value.refund_line_items,

      refundLineItems: refundLineItems,
    };

    const response = await OrdersAPI.refundOrder(payload);

    createRefundMessage(
      refundLineItems,
      response.data.refund.id,
      response.data.refund.totalRefundedSet
    );

    cancellationState.value = null;

    cancellationTimeout = setTimeout(() => {
      onClose();
      useAlert($t('CONVERSATION_SIDEBAR.SHOPIFY.CANCEL.API_TIMEOUT'));
    }, 30 * 1000);
  } catch (e) {
    cancellationState.value = null;
    let message = $t('CONVERSATION_SIDEBAR.SHOPIFY.CANCEL.API_FAILURE');
    if (isAxiosError(e)) {
      const errors = e.response.data.errors;
      if (errors && errors[0].message) {
        message = errors[0].message;
      }
    }
    useAlert(message);
  }
};

const allUnfulfilledRestockState = computed({
  // Getter: returns true if all relevant items are enabled
  get() {
    return Object.values(stockParameters.value).every(e =>
      !e.fulfilled ? e.restock : true
    );
  },
  // Setter: sets all relevant items to the new value
  set(value) {
    Object.values(stockParameters.value).forEach(e => {
      if (!e.fulfilled) {
        e.restock = value;
      }
    });
  },
});

const allFulfilledRestockState = computed({
  // Getter: returns true if all relevant items are enabled
  get() {
    return Object.values(stockParameters.value).every(e =>
      e.fulfilled ? e.restock : true
    );
  },
  // Setter: sets all relevant items to the new value
  set(value) {
    Object.values(stockParameters.value).forEach(e => {
      if (e.fulfilled) {
        e.restock = value;
      }
    });
  },
});

const buttonText = () => {
  return cancellationState.value === 'processing'
    ? 'CONVERSATION_SIDEBAR.SHOPIFY.REFUND.PROCESSING'
    : 'CONVERSATION_SIDEBAR.SHOPIFY.REFUND.REFUND_ORDER';
};
</script>

<template>
  <woot-modal :show="true" :on-close="onClose" size="w-[60.4rem] h-[50.4rem]">
    <woot-modal-header
      :header-title="$t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TITLE')"
      :header-content="$t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.DESC')"
    />

    <form>
      <div class="h-[28.4rem] overflow-auto justify-between">
        <div
          v-if="
            Object.values(lineItemsSegmentedByFulfillType).filter(
              e => e.unfulfilled_and_refundable > 0
            ).length > 0
          "
          class="flex flex-col gap-2"
        >
          <h3>Unfulfilled</h3>
          <table
            class="woot-table items-table overflow-auto max-h-2 table-fixed"
          >
            <thead>
              <tr>
                <th class="overflow-auto max-w-xs">
                  {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.PRODUCT') }}
                </th>
                <th>
                  {{
                    $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.ITEM_PRICE')
                  }}
                </th>
                <th>
                  {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.QUANTITY') }}
                </th>
                <th>
                  {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.TOTAL') }}
                </th>

                <th>
                  <div class="flex flex-row w-full justify-end gap-2">
                    {{
                      $t(
                        'CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.RESTOCK_ITEMS'
                      )
                    }}

                    <input
                      class="justify-end"
                      type="checkbox"
                      v-model="allUnfulfilledRestockState"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in Object.values(
                  lineItemsSegmentedByFulfillType
                ).filter(e => e.unfulfilled_and_refundable > 0)"
                :key="item.id"
              >
                <td>
                  <div class="overflow-auto max-w-xs">{{ item.name }}</div>
                </td>
                <td>
                  <div>
                    {{
                      currency_codes[item.price_set.shop_money.currency_code]
                    }}
                    {{
                      Number(item.price_set.shop_money.amount).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                        }
                      )
                    }}
                  </div>
                </td>
                <td class="text-center align-middle">
                  <!-- <div>{{ item.quantity }}</div> -->
                  <div class="inline-block">
                    <QuantityField
                      v-model="formState.unfulfilledQuantity[item.id]"
                      :min="0"
                      :max="Number(item.unfulfilled_and_refundable)"
                      @input_val="debouncedRefund"
                    />
                  </div>
                </td>
                <td>
                  <div>
                    {{
                      currency_codes[item.price_set.shop_money.currency_code]
                    }}
                    {{
                      item_total_price(item, 'unful').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </div>
                </td>
                <td>
                  <div class="flex flex-row w-full justify-end gap-4">
                    <div
                      v-if="
                        formState.stockParameters[`unful_${item.id}`].restock
                      "
                      class="flex flex-col"
                    >
                      <select
                        v-model="
                          formState.stockParameters[`unful_${item.id}`].location
                        "
                        class="thin-select"
                      >
                        <option
                          v-for="location in locations"
                          :key="location.id"
                          :value="location.id"
                        >
                          {{ location.name }}
                        </option>
                      </select>
                    </div>

                    <input
                      type="checkbox"
                      v-model="
                        formState.stockParameters[`unful_${item.id}`].restock
                      "
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <SimpleDivider />
        </div>

        <div
          v-if="
            Object.values(lineItemsSegmentedByFulfillType).filter(
              e => e.fulfilled_and_refundable > 0
            ).length > 0
          "
          class="flex flex-col gap-2"
        >
          <h3>Fulfilled</h3>
          <table
            class="woot-table items-table overflow-auto max-h-2 table-fixed"
          >
            <thead>
              <tr>
                <th class="overflow-auto max-w-xs">
                  {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.PRODUCT') }}
                </th>
                <th>
                  {{
                    $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.ITEM_PRICE')
                  }}
                </th>
                <th>
                  {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.QUANTITY') }}
                </th>
                <th>
                  {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.TOTAL') }}
                </th>

                <th>
                  <div class="flex flex-row w-full justify-end gap-2">
                    {{
                      $t(
                        'CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TABLE.RESTOCK_ITEMS'
                      )
                    }}

                    <input
                      class="justify-end"
                      type="checkbox"
                      v-model="allFulfilledRestockState"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in Object.values(
                  lineItemsSegmentedByFulfillType
                ).filter(e => e.fulfilled_and_refundable > 0)"
                :key="item.id"
              >
                <td>
                  <div class="overflow-auto max-w-xs">{{ item.name }}</div>
                </td>
                <td>
                  <div>
                    {{
                      currency_codes[item.price_set.shop_money.currency_code]
                    }}
                    {{
                      Number(item.price_set.shop_money.amount).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                        }
                      )
                    }}
                  </div>
                </td>
                <td class="text-center align-middle">
                  <!-- <div>{{ item.quantity }}</div> -->
                  <div class="inline-block">
                    <QuantityField
                      v-model="formState.fulfilledQuantity[item.id]"
                      :min="0"
                      :max="item.fulfilled_and_refundable"
                      @input_val="debouncedRefund"
                    />
                  </div>
                </td>
                <td>
                  <div>
                    {{
                      currency_codes[item.price_set.shop_money.currency_code]
                    }}
                    {{
                      item_total_price(item, 'ful').toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </div>
                </td>
                <td>
                  <div
                    class="flex flex-row w-full items-center justify-end gap-4"
                  >
                    <div
                      v-if="formState.stockParameters[`ful_${item.id}`].restock"
                      class="flex flex-col"
                    >
                      <select
                        v-model="
                          formState.stockParameters[`ful_${item.id}`].location
                        "
                        class="thin-select"
                      >
                        <option
                          v-for="location in locations"
                          :key="location.id"
                          :value="location.id"
                        >
                          {{ location.name }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        v-model="
                          formState.stockParameters[`ful_${item.id}`].restock
                        "
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <SimpleDivider />
        </div>

        <div
          class="flex flex-row h-full w-full items-center justify-center"
          v-if="
            orderInfo !== null &&
            Object.values(lineItemsSegmentedByFulfillType).filter(
              e =>
                e.fulfilled_and_refundable > 0 ||
                e.unfulfilled_and_refundable > 0
            ).length === 0
          "
        >
          {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.NO_REFUNDS') }}
        </div>
      </div>

      <div
        class="flex flex-row pr-[10px] pt-2 items-start justify-start content-start"
      >
        <div class="flex flex-col">
          <div class="flex flex-row justify-start items-start gap-4 pb-2">
            <div class="flex flex-col">
              <div class="flex flex-row gap-2 pb-2">
                <h5>
                  {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.REFUND_AMOUNT') }}
                </h5>
                <span v-if="formState.refundAmount !== availableRefund"
                  >(manual)</span
                >
              </div>

              <Input
                type="text"
                spacing="base"
                v-model="formState.refundAmount"
                :message-type="v$.refundAmount.$error ? 'error' : 'info'"
                :message="
                  v$.refundAmount.$error
                    ? $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.INVALID_AMOUNT')
                    : ''
                "
                @blur="v$.refundAmount.$touch"
                inputmode="decimal"
                placeholder="0.00"
                style="width: 200px; font-size: 1.1em"
                autocomplete="off"
              >
                <template #input-prefix>
                  <span class="text-gray-500">
                    {{ currency_codes[order.currency] }}
                  </span>
                </template>
              </Input>
            </div>

            <div class="flex flex-col">
              <h5 class="pb-2">
                {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.REFUND_REASON') }}
                <!-- {{ add marker for manual }}  -->
              </h5>

              <!-- spacing="compact" -->
              <FormSelect
                v-model="formState.refundNote"
                name="refundNote"
                :value="formState.refundNote"
                :options="reasonOptions"
                :placeholder="$t('CONVERSATION_SIDEBAR.SHOPIFY.CANCEL.REASON')"
                :has-error="v$.refundNote.$error"
                :error-message="
                  v$.refundNote.$error
                    ? $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.NOTE_REQUIRED')
                    : ''
                "
              >
                <!-- <select
                v-model="formState.refundNote"
                class="w-full mt-1 border-0 selectInbox"
                :class="{ 'border-red-500': v$.refundNote.$error }"
              > -->
                <option v-for="reason in reasons" :value="reason" :key="reason">
                  {{ reason }}
                </option>
                <!-- </select> -->
              </FormSelect>
            </div>
          </div>

          <div
            class="flex flex-col items-start justify-center content-start gap-2"
          >
            <div
              class="select-visible-checkbox gap-2"
              :style="selectVisibleCheckboxStyle"
            >
              <input
                type="checkbox"
                :checked="formState.sendNotification"
                @change="
                  formState.sendNotification = !formState.sendNotification
                "
              />

              <span>
                {{
                  $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.SEND_NOTIFICATION')
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex-1 flex-row" />

        <div class="flex flex-col">
          <div class="flex flex-row justify-start items-center gap-10">
            <label>
              {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.SUBTOTAL') }}
            </label>
            <span class="text-sm"
              >{{ currency_codes[order.currency] }}
              {{
                /* order.subtotal_price*/ currentSubtotal.toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                  }
                )
              }}</span
            >
          </div>

          <div class="flex flex-row justify-start items-center gap-[72px]">
            <label>
              {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TAX') }}
            </label>
            <span class="text-sm"
              >{{ currency_codes[order.currency] }}
              {{
                /* order.total_tax */ currentTax.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              }}</span
            >
          </div>

          <div class="flex flex-row justify-start items-center gap-[64px]">
            <label>
              {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TOTAL') }}
            </label>
            <span class="text-sm"
              >{{ currency_codes[order.currency] }}
              {{
                /* order.total_tax */ (
                  currentSubtotal + currentTax
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })
              }}</span
            >
          </div>
        </div>
      </div>

      <div
        v-if="availableRefund"
        class="flex flex-row justify-end items-center gap-10 pt-4 pr-[10px]"
      >
        <h4>
          {{ $t('CONVERSATION_SIDEBAR.SHOPIFY.REFUND.TOTAL_REFUNDABLE') }}
        </h4>
        <span class="text-base"
          >{{ availableRefund[1] }}
          {{
            /* refundableAmount */ Number(availableRefund[0]).toLocaleString(
              'en-US',
              {
                minimumFractionDigits: 2,
              }
            )
          }}</span
        >
      </div>
      <div class="flex flex-row justify-end absolute bottom-4 right-4">
        <Button
          type="button"
          :disabled="v$.$error || cancellationState === 'processing'"
          variant="primary"
          @click="() => refundOrder($t)"
        >
          {{ $t(buttonText()) }}
        </Button>
      </div>
    </form>
  </woot-modal>
</template>

<style lang="scss">
.items-table {
  > tbody {
    > tr {
      @apply cursor-pointer;

      &:hover {
        @apply bg-slate-50 dark:bg-slate-800;
      }

      &.is-active {
        @apply bg-slate-100 dark:bg-slate-700;
      }

      > td {
        &.conversation-count-item {
          @apply pl-6 rtl:pl-0 rtl:pr-6;
        }
      }

      &:last-child {
        @apply border-b-0;
      }
    }
  }
}

.select-visible-checkbox {
  @apply flex items-center text-sm text-slate-700 dark:text-white;

  input[type='checkbox'] {
    @apply w-4 h-4 cursor-pointer accent-black-600;
  }
}
</style>
