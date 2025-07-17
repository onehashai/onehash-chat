<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
import { useMapGetter } from 'dashboard/composables/store';
import Button from 'shared/components/Button.vue';

const widgetColor = useMapGetter('appConfig/getWidgetColor');
const onSubmit = () => {
  router.replace({ name: 'shopify-orders-block', query: {} });
};
</script>

<template>
  <div
    class="flex flex-row w-full shadow outline-1 outline outline-n-container rounded-xl bg-n-background dark:bg-n-solid-2 px-5 py-4 items-center"
  >
    <div class="flex flex-col">
      <h2 class="font-medium text-n-slate-12">
        {{ $t('ORDER_TRACKING') }}
      </h2>
      <span class="text-xs">
        {{ $t('ORDER_TRACKING_DESC') }}
      </span>
    </div>
    <div class="flex-1" />
    <Button :style="{ color: widgetColor }" class="h-[35px]">
      <button
        :style="{ color: widgetColor }"
        @click.stop="onSubmit"
        class="flex flex-row items-center justify-center h-full w-full"
      >
        <label class="text-white h-full flex items-center justify-center">
          {{ $t('TRACK_ORDER') }}
        </label>
      </button>
    </Button>
  </div>
</template>
