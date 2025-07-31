<script setup>
import Button from 'dashboard/components-next/button/Button.vue';
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

const products = computed(() => {
  return [...props.messageContentAttributes.products];
});
</script>

<template>
  <div class="gap-4">
    <div
      class="flex flex-col w-full px-2 py-1 text-xs shadow-md rounded-md my-2"
      v-for="item in products"
      :key="item.id"
    >
      <div class="flex flex-row justify-start items-start">
        <img
          :src="item.image ?? 'assets/images/placeholder.png'"
          alt="Product image"
          class="object-cover object-center max-w-[60px] max-h-[60px] min-w-[60px] min-h-[60px] rounded-lg shadow"
        />
        <div class="flex-1" />
        <div class="flex flex-col w-full pl-2">
          <div class="h-[20px] text-sm overflow-x-auto overflow-y-hidden">
            {{ item.displayName }}
          </div>

          <div class="flex flex-row gap-2 text-xs">
            <span v-if="item.compareAtPrice" class="line-through">
              {{ currency_codes[item.currency] }}
              {{ item.compareAtPrice }}
            </span>
            <span>
              {{ currency_codes[item.currency] }}
              {{ item.price }}
            </span>
          </div>

          <a
            :href="item.link_url"
            target="_blank"
            rel="noopener noreferrer"
            class="items-center px-2 py-1 text-xs bg-green-50 rounded-md"
          >
            Visit Product
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
