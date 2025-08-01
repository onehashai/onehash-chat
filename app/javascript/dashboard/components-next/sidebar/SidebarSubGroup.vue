<script setup>
import { computed, ref } from 'vue';
import SidebarGroupLeaf from './SidebarGroupLeaf.vue';
import SidebarGroupSeparator from './SidebarGroupSeparator.vue';
import SidebarGroupEmptyLeaf from './SidebarGroupEmptyLeaf.vue';

import { useSidebarContext } from './provider';
import { useEventListener } from '@vueuse/core';

const props = defineProps({
  isExpanded: { type: Boolean, default: false },
  label: { type: String, required: true },
  icon: { type: [Object, String], required: true },
  children: { type: Array, default: undefined },
  activeChild: { type: Object, default: undefined },
});

const { isAllowed } = useSidebarContext();
const scrollableContainer = ref(null);

const accessibleItems = computed(
  () => props.children.filter(child => isAllowed(child.to))

  // REVIEW:CV4.0.2 Below code isn't in our version, why?
  // props.children.filter(child => {
  //   return child.to && isAllowed(child.to);
  // })
);

const hasAccessibleItems = computed(() => {
  if (props.children.length === 0) {
    // cases like segment, folder and labels where users can create new items
    return true;
  }

  // REVIEW:CV4.0.2 Below code isn't in our version, why?
  return accessibleItems.value.length > 0;
});

const isScrollable = computed(() => {
  return accessibleItems.value.length > 7;
});

const scrollEnd = ref(false);

// set scrollEnd to true when the scroll reaches the end
useEventListener(scrollableContainer, 'scroll', () => {
  const { scrollHeight, scrollTop, clientHeight } = scrollableContainer.value;
  scrollEnd.value = scrollHeight - scrollTop === clientHeight;
});
</script>

<template>
  <SidebarGroupSeparator
    v-if="hasAccessibleItems"
    v-show="isExpanded"
    :label
    :icon
    class="my-1"
  />

  <ul class="m-0 list-none reset-base relative group">
    <!-- REVIEW:CV4.0.2 Below code isn't in our version, why? -->
    <!-- <ul v-if="children.length" class="m-0 list-none reset-base relative group"> -->
    <!-- Each element has h-8, which is 32px, we will show 7 items with one hidden at the end,
    which is 14rem. Then we add 16px so that we have some text visible from the next item  -->
    <div
      ref="scrollableContainer"
      :class="{
        'max-h-[calc(14rem+16px)] overflow-y-scroll no-scrollbar': isScrollable,
      }"
    >
      <template v-if="children.length">
        <!-- REVIEW:CV4.0.2 this condition is only in our version, why? -->
        <SidebarGroupLeaf
          v-for="child in children"
          v-show="isExpanded || activeChild?.name === child.name"
          v-bind="child"
          :key="child.name"
          :active="activeChild?.name === child.name"
        />
      </template>
      <!-- REVIEW:CV4.0.2 this leaf is only in our version, why? -->
      <SidebarGroupEmptyLeaf v-else v-show="isExpanded" class="ml-3 rtl:mr-3" />
    </div>
    <div
      v-if="isScrollable && isExpanded"
      v-show="!scrollEnd"
      class="absolute bg-gradient-to-t from-n-solid-2 w-full h-12 to-transparent -bottom-1 pointer-events-none flex items-end justify-end px-2 animate-fade-in-up"
    >
      <svg
        width="16"
        height="24"
        viewBox="0 0 16 24"
        fill="none"
        class="text-n-slate-9 opacity-50 group-hover:opacity-100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4L8 8L12 4"
          stroke="currentColor"
          opacity="0.5"
          stroke-width="1.33333"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M4 10L8 14L12 10"
          stroke="currentColor"
          opacity="0.75"
          stroke-width="1.33333"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M4 16L8 20L12 16"
          stroke="currentColor"
          stroke-width="1.33333"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </ul>
</template>
