<script setup>
import ShopifyOrderTile from './ShopifyOrderTile.vue';

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <h3 class="font-medium text-n-slate-12">
    {{ $t('SHOPIFY_ORDERS.TITLE') }}
  </h3>

  <ShopifyOrderTile v-if="order" :key="order.id" :order="order" />
</template>
