<script setup>
import currency_codes from 'shared/constants/currency_codes';
import Button from 'dashboard/components-next/button/Button.vue';
import { ref, defineEmits } from 'vue';
import { onMounted } from 'vue';

const props = defineProps({
  shopifyProducts: {
    type: Array,
    required: true,
  },
});

const emits = defineEmits('close', 'onSelect');

const onClose = () => {
  emits('close');
};

const includedVariants = ref([]);
const variants = ref([]);

const includeItem = item => {
  const idx = includedVariants.value.findIndex(e => e.id === item.id);
  if (idx === -1) {
    includedVariants.value.push(item);
  } else {
    includedVariants.value = includedVariants.value.filter(
      e => e.id !== item.id
    );
  }
};

onMounted(() => {
  console.log('Got products');
  variants.value = defaultVariants();

  props.shopifyProducts.forEach(p => {
    p.variants.forEach(v => {
      v.product_id = p.id;
      v.currency = p.currency;
      v.link_url = p.online_store_preview_url;
      v.total_variants = p.variants.length;
      v.displayName = v.total_variants === 1 ? p.name : v.displayName;
      v.image = p.image?.url ?? p.media_image_url;
    });
  });

  console.log('Vars: ', variants.value);
});

const addVariants = () => {
  emits('onSelect', { products: includedVariants.value });
};

const variantMode = ref(false);

const selectVariantsOfProduct = id => {
  variantMode.value = true;

  variants.value = props.shopifyProducts.find(e => e.id === id).variants;
};

const defaultVariants = () => {
  return props.shopifyProducts.map(e => e.variants[0]);
};

const resetVariants = () => {
  variantMode.value = !variantMode.value;
  variants.value = defaultVariants();
};
</script>

<template>
  <woot-modal :show="true" :on-close="onClose" size="w-[50.4rem] h-[40.4rem]">
    <woot-modal-header
      :header-title="$t('SHOPIFY_PRODUCTS.MODAL.TITLE')"
      :header-content="$t('SHOPIFY_PRODUCTS.MODAL.DESC')"
      class="pb-6"
    />

    <div class="p-8 h-[30.4rem] overflow-auto">
      <table class="woot-table items-table">
        <thead>
          <tr>
            <th>
              {{ $t('SHOPIFY_PRODUCTS.MODAL.TABLE.NAME') }}
            </th>
            <th>
              {{ $t('SHOPIFY_PRODUCTS.MODAL.TABLE.QUANTITY') }}
            </th>
            <th>
              {{ $t('SHOPIFY_PRODUCTS.MODAL.TABLE.PRICE') }}
            </th>
            <th v-if="!variantMode">
              {{ $t('SHOPIFY_PRODUCTS.MODAL.TABLE.VARIANTS') }}
            </th>
            <th>
              {{ $t('SHOPIFY_PRODUCTS.MODAL.TABLE.STOCK') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in variants" :key="item.id">
            <td>
              <div>{{ item.displayName }}</div>
            </td>
            <td class="text-center align-middle">
              <div>{{ item.inventoryQuantity }}</div>
            </td>
            <td>
              <div class="flex flex-col">
                <div v-if="item.compareAtPrice" class="w-[100px] line-through">
                  {{ currency_codes[item.currency] }}
                  {{ item.compareAtPrice }}
                </div>
                <span class="w-[100px]">
                  {{ currency_codes[item.currency] }}
                  {{ item.price }}
                </span>
              </div>
            </td>

            <td v-if="!variantMode">
              <Button
                type="button"
                :is-disabled="item.total_variants < 2"
                variant="link"
                @click="() => selectVariantsOfProduct(item.product_id)"
                class="flex flex-row justify-center items-center"
              >
                <div class="w-[20px]">
                  {{
                    $t('SHOPIFY_PRODUCTS.MODAL.VARIANTS', {
                      count: item.total_variants,
                      selected: includedVariants.filter(
                        e => e.product_id === item.product_id
                      ).length,
                    })
                  }}
                </div>
              </Button>
            </td>
            <td
              class="flex flex-row w-full h-full items-end content-end justify-end"
            >
              <input
                class="pt-4"
                type="checkbox"
                :checked="includedVariants.some(e => e.id == item.id)"
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
          {{ $t('SHOPIFY_PRODUCTS.MODAL.OTHER_PRODUCTS') }}
        </Button>
      </td>
      <Button
        type="button"
        :disabled="includedVariants.length === 0"
        variant="solid"
        @click="addVariants"
      >
        {{ $t('SHOPIFY_PRODUCTS.MODAL.ADD_VARIANTS') }}
      </Button>
    </div>
  </woot-modal>
</template>
