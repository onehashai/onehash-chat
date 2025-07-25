<script setup>
import currency_codes from 'shared/constants/currency_codes';
import Button from 'dashboard/components-next/button/Button.vue';
import { ref, defineEmits } from 'vue';
import { onMounted } from 'vue';

const props = defineProps({
  shopifyDiscounts: {
    type: Array,
    required: true,
  },
});

const emits = defineEmits('close', 'onSelect');

const onClose = () => {
  emits('close');
};

const includedDiscounts = ref([]);

const includeItem = item => {
  const idx = includedDiscounts.value.findIndex(e => e.id === item.id);
  if (idx === -1) {
    includedDiscounts.value.push(item);
  } else {
    includedDiscounts.value = includedDiscounts.value.filter(
      e => e.id !== item.id
    );
  }
};

const sendDiscounts = () => {
  emits('onSelect', { discounts: includedDiscounts.value });
};
</script>

<template>
  <woot-modal :show="true" :on-close="onClose" size="w-[50.4rem] h-[40.4rem]">
    <woot-modal-header
      :header-title="$t('SHOPIFY_DISCOUNTS.MODAL.TITLE')"
      :header-content="$t('SHOPIFY_DISCOUNTS.MODAL.DESC')"
      class="pb-6"
    />

    <div class="p-8 h-[30.4rem] overflow-auto">
      <table class="woot-table items-table">
        <thead>
          <tr>
            <th>
              {{ $t('SHOPIFY_DISCOUNTS.MODAL.TABLE.CODE') }}
            </th>
            <th>
              {{ $t('SHOPIFY_DISCOUNTS.MODAL.TABLE.EFFECT') }}
            </th>
            <th>
              {{ $t('SHOPIFY_DISCOUNTS.MODAL.TABLE.STOCK') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in shopifyDiscounts" :key="item.id">
            <td>
              <div>{{ item.discount.title }}</div>
            </td>
            <td>
              <div>{{ item.discount.summary }}</div>
            </td>
            <td
              class="flex flex-row w-full h-full items-end content-end justify-end"
            >
              <input
                class="pt-4"
                type="checkbox"
                :checked="includedDiscounts.some(e => e.id == item.id)"
                @change="() => includeItem(item)"
                style="transform: translateY(8px); padding-right: 24px"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex flex-row gap-4 justify-end absolute bottom-4 right-4">
      <td v-if="variantMode">
        <Button
          type="button"
          variant="solid"
          @click="resetVariants"
          class="flex flex-row justify-center items-center"
        >
          {{ $t('SHOPIFY_DISCOUNTS.MODAL.OTHER_PRODUCTS') }}
        </Button>
      </td>
      <Button
        type="button"
        :disabled="includedDiscounts.length === 0"
        variant="solid"
        class="p-0"
        @click="sendDiscounts"
      >
        {{ $t('SHOPIFY_DISCOUNTS.MODAL.ADD_VARIANTS') }}
      </Button>
    </div>
  </woot-modal>
</template>
