<script setup>
import ShopifyOrdersContainer from '../components/pageComponents/Home/ShopifyOrders/ShopifyOrdersContainer.vue';
import ShopifyOrderShippingTracker from '../components/pageComponents/Home/ShopifyOrders/ShopifyOrderShippingTracker.vue';
import TabBar from 'dashboard/components-next/tabbar/TabBar.vue';
import { ref } from 'vue';

const input_type = ref('Order');

const input_types = [
  {
    label: 'Order',
    value: 'Order',
  },
  {
    label: 'Shipping',
    value: 'Shipping',
  },
];

const handleTypeChange = info => {
  input_type.value = info.value;
};
</script>

<template>
  <div class="m-4 h-[29.4rem]">
    <TabBar
      :tabs="input_types"
      :initial-active-tab="input_types.findIndex(e => e.label === input_type)"
      :fixed-size="true"
      @tab-changed="handleTypeChange"
      class="w-full"
    />
    <div class="h-2" />

    <ShopifyOrdersContainer v-if="input_type === 'Order'" />
    <ShopifyOrderShippingTracker v-if="input_type === 'Shipping'" />
  </div>
</template>
