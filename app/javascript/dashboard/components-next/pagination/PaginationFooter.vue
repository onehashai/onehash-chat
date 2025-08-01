<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from 'dashboard/components-next/button/Button.vue';

const props = defineProps({
  count: {
    type: Number,
    default: null,
  },
  currentPage: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  itemsPerPage: {
    type: Number,
    default: 16,
  },
  currentPageInfo: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:currentPage']);
const { t } = useI18n();

const totalPages = computed(() =>
  Math.ceil(props.totalItems / props.itemsPerPage)
);
const startItem = computed(
  () => (props.currentPage - 1) * props.itemsPerPage + 1
);
const endItem = computed(() =>
  Math.min(startItem.value + props.itemsPerPage - 1, props.totalItems)
);
const isFirstPage = computed(() => props.currentPage === 1);
const isLastPage = computed(() => props.currentPage === totalPages.value);
const changePage = newPage => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    emit('update:currentPage', newPage);
  }
};

const currentPageInformation = computed(() => {
  return t(
    props.currentPageInfo ? props.currentPageInfo : 'PAGINATION_FOOTER.SHOWING',
    {
      startItem: startItem.value,
      endItem: endItem.value,
      totalItems: props.totalItems,
    }
  );
});

const selectionInformation = computed(() => {
  return t(
    props.currentPageInfo
      ? props.currentPageInfo
      : 'PAGINATION_FOOTER.SELECTED',
    {
      count: props.count,
      totalItems: props.totalItems,
    }
  );
});

const pageInfo = computed(() => {
  return t('PAGINATION_FOOTER.CURRENT_PAGE_INFO', {
    currentPage: '',
    totalPages: totalPages.value,
  });
});
</script>

<template>
  <!-- REVIEW:CV4.0.3 This was the style pre v4.0.3 -->
  <!-- class="flex justify-between h-12 w-full max-w-[957px] outline outline-n-container outline-1 mx-auto bg-n-solid-2 rounded-xl py-2 ltr:pl-4 rtl:pr-4 ltr:pr-3 rtl:pl-3 items-center" -->
  <div
    class="flex justify-between h-12 w-full max-w-[calc(60rem-3px)] outline outline-n-container outline-1 -outline-offset-1 mx-auto bg-n-solid-2 rounded-xl py-2 ltr:pl-4 rtl:pr-4 ltr:pr-3 rtl:pl-3 items-center before:absolute before:inset-x-0 before:-top-4 before:bg-gradient-to-t before:from-n-background before:from-10% before:dark:from-0% before:to-transparent before:h-4 before:pointer-events-none"
  >
    <div class="flex items-center gap-3">
      <span class="min-w-0 text-sm font-normal line-clamp-1 text-n-slate-11">
        {{
          props.count == null ? currentPageInformation : selectionInformation
        }}
      </span>
    </div>
    <div class="flex items-center gap-2">
      <Button
        icon="i-lucide-chevrons-left"
        variant="ghost"
        size="sm"
        color="slate"
        class="!w-8 !h-6"
        :disabled="isFirstPage"
        @click="changePage(1)"
      />
      <Button
        icon="i-lucide-chevron-left"
        variant="ghost"
        color="slate"
        size="sm"
        class="!w-8 !h-6"
        :disabled="isFirstPage"
        @click="changePage(currentPage - 1)"
      />
      <div class="inline-flex items-center gap-2 text-sm text-n-slate-11">
        <span class="px-3 tabular-nums py-0.5 bg-n-alpha-black2 rounded-md">
          {{ currentPage }}
        </span>
        <span class="truncate">{{ pageInfo }}</span>
      </div>
      <Button
        icon="i-lucide-chevron-right"
        variant="ghost"
        color="slate"
        size="sm"
        class="!w-8 !h-6"
        :disabled="isLastPage"
        @click="changePage(currentPage + 1)"
      />
      <Button
        icon="i-lucide-chevrons-right"
        variant="ghost"
        color="slate"
        size="sm"
        class="!w-8 !h-6"
        :disabled="isLastPage"
        @click="changePage(totalPages)"
      />
    </div>
  </div>
</template>
