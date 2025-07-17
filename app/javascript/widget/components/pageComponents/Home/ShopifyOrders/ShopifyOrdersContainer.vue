<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'dashboard/composables/store';
import CustomerIdentificationBlock from './CustomerIdentificationBlock.vue';
import ShopifyOrdersBlock from './ShopifyOrdersBlock.vue';

const props = defineProps({
  limit: {
    type: Number,
    default: null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const store = useStore();

const order = computed(() => store.getters['orders/getOrder']);

const orderUiFlags = computed(() => store.getters['orders/getUiFlags']);

const contact = computed(() => store.getters['contacts/getCurrentUser']);
</script>

<template>
  <div
    class="w-full shadow outline-1 outline outline-n-container rounded-xl bg-n-background dark:bg-n-solid-2 px-5 py-4"
  >
    <CustomerIdentificationBlock
      v-if="!order"
      :unverfied_shopify_email="contact.unverfied_shopify_email"
    />
    <ShopifyOrdersBlock v-if="order" :order="order" />

    <span
      v-if="orderUiFlags.noOrder"
      class="items-center justify-center text-base pl-2 text-n-ruby-9"
    >
      {{ $t('ORDER_NOT_FOUND') }}
    </span>
  </div>
</template>
