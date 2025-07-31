<script setup>
// import Button from 'dashboard/components-next/button/Button.vue';
import currency_codes from 'shared/constants/currency_codes';
import { computed, onMounted } from 'vue';

const props = defineProps({
  messageId: {
    type: Number,
    required: true,
  },
  messageContentAttributes: {
    type: Object,
    default: () => {},
  },
});

const addCode = item => {
  const shopDomain = `${window.chatwootWebChannel.shopDomain}`;
  window.top.location.href = `https://${shopDomain}/discount/${item.discount.title}`;
};

const discounts = computed(() => {
  return [...props.messageContentAttributes.discounts];
});
</script>

<template>
  <div class="gap-4">
    <div
      class="flex flex-col min-w-full px-2 py-1 text-xs shadow-md rounded-md my-2 gap-2"
      v-for="item in discounts"
      :key="item.id"
    >
      <div class="flex flex-row text-sm">
        {{ item.discount.title }}
      </div>
      <div class="flex flex-row">
        {{ item.discount.summary }}
      </div>

      <button
        class="px-4 py-2 bg-woot-500 text-white rounded hover:bg-woot-700 focus:outline-none focus:ring-2 focus:bg-woot-500"
        type="button"
        variant="solid"
        @click="() => addCode(item)"
      >
        {{ $t('ADD_TOKEN') }}
      </button>
    </div>
  </div>
</template>
