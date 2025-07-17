<script setup>
import FluentIcon from 'shared/components/FluentIcon/Index.vue';
import { onMounted, ref } from 'vue';
import { RingBottomNavigation } from 'bottom-navigation-vue';

import TabBar from 'dashboard/components-next/tabbar/TabBar.vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { computed, defineEmits, defineProps } from 'vue';
import { useDarkMode } from 'widget/composables/useDarkMode';
import { useMapGetter } from 'dashboard/composables/store';

const props = defineProps({
  activeTabIndex: {
    type: Number,
    required: true,
  },
});
const emit = defineEmits(['tabChange']);
const { prefersDarkMode } = useDarkMode();
const { t } = useI18n();

const popularArticles = useMapGetter('article/popularArticles');
const articleUiFlags = useMapGetter('article/uiFlags');
const getConversationSize = useMapGetter('conversation/getConversationSize');

const widgetColor = useMapGetter('appConfig/getWidgetColor');

// REVIEW: Maybe all this logic can simply be shifted to ArticleViewer instead (Also check Article Container which has the same code)

const portal = computed(() => window.chatwootWebChannel.portal);

const locale = computed(() => {
  const { locale: selectedLocale } = t;
  const {
    allowed_locales: allowedLocales,
    default_locale: defaultLocale = 'en',
  } = portal.value.config;
  // IMPORTANT: Variation strict locale matching, Follow iso_639_1_code
  // If the exact match of a locale is available in the list of portal locales, return it
  // Else return the default locale. Eg: `es` will not work if `es_ES` is available in the list
  if (allowedLocales.includes(selectedLocale)) {
    return locale;
  }
  return defaultLocale;
});

const buildArticleViewerParams = link => {
  const params = new URLSearchParams({
    show_plain_layout: 'true',
    theme: prefersDarkMode.value ? 'dark' : 'light',
  });

  const linkToOpen = `${link}?${params.toString()}`;
  return { link: linkToOpen };
};

const getArticleViewerParams = () => {
  const {
    portal: { slug },
  } = window.chatwootWebChannel;
  return buildArticleViewerParams(`/hc/${slug}/${locale.value}`);
};

const key = computed(() => [
  window.chatwootWebChannel.preChatFormEnabled && !getConversationSize.value,
  articleUiFlags.value.isFetching || !!popularArticles.value.length,
]);

const options = computed(() => {
  return [
    {
      id: 0,
      icon: 'home',
      title: 'Home',
      path: {
        name: 'home',
        query: {},
      },
    },
    {
      id:
        window.chatwootWebChannel.preChatFormEnabled &&
        !getConversationSize.value
          ? 1
          : 4,
      icon: 'chat',
      title: 'Chat',
      path:
        window.chatwootWebChannel.preChatFormEnabled &&
        !getConversationSize.value
          ? { name: 'prechat-form', query: {} }
          : { name: 'messages', query: {} },
    },

    ...(window.chatwootWebChannel.hasShop
      ? [
          {
            id: 2,
            icon: 'truck',
            title: 'Track',
            path: {
              name: 'shopify-orders-block',
              query: {},
            },
          },
        ]
      : []),
    ...(window.chatwootWebChannel.portal &&
    (articleUiFlags.value.isFetching || !!popularArticles.value.length)
      ? [
          {
            id: 3,
            icon: 'help',
            title: 'Help',
            path: {
              name: 'article-viewer',
              query: getArticleViewerParams(),
            },
          },
        ]
      : []),
  ];
});

const selected = ref(props.activeTabIndex);
</script>

<template>
  <div v-if="options.length > 1">
    <!-- <TabBar
      :tabs="tabs"
      :initial-active-tab="activeTabIndex"
      :fixed-size="true"
      @tab-changed="handleTabChange"
      class="w-full"
    /> -->

    <RingBottomNavigation
      :options="options"
      :key="key"
      v-model="selected"
      :titleColor="widgetColor"
      :badgeColor="widgetColor"
      :borderColor="widgetColor"
      :iconColor="widgetColor"
    >
      <template #icon="{ props }">
        <FluentIcon :icon="props.icon" size="14" />
      </template>

      <template #title="{ props }">
        <b>{{ props.title }}</b>
      </template>
    </RingBottomNavigation>
  </div>
</template>
