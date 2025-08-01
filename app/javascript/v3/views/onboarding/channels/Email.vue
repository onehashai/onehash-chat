<script setup>
import { ref, computed } from 'vue';
import ForwardToOption from './emailChannels/ForwardToOption.vue';
import Microsoft from './emailChannels/Microsoft.vue';
import Google from './emailChannels/Google.vue';
import ChannelSelector from 'dashboard/components/ChannelSelector.vue';

import { useStoreGetters } from 'dashboard/composables/store';
import { useI18n } from 'vue-i18n';

const provider = ref('');

const getters = useStoreGetters();
const { t } = useI18n();

const globalConfig = getters['globalConfig/get'];
const isAChatwootInstance = getters['globalConfig/isAChatwootInstance'];

const emailProviderList = computed(() => {
  return [
    {
      title: t('INBOX_MGMT.EMAIL_PROVIDERS.MICROSOFT'),
      isEnabled: !!globalConfig.value.azureAppId,
      key: 'microsoft',
      src: '/assets/images/dashboard/channels/microsoft.png',
    },
    {
      title: t('INBOX_MGMT.EMAIL_PROVIDERS.GOOGLE'),
      isEnabled: !!window.chatwootConfig.googleOAuthClientId,
      key: 'google',
      src: '/assets/images/dashboard/channels/google.png',
    },
    {
      title: t('INBOX_MGMT.EMAIL_PROVIDERS.OTHER_PROVIDERS'),
      isEnabled: true,
      key: 'other_provider',
      src: '/assets/images/dashboard/channels/email.png',
    },
  ].filter(providerConfig => {
    if (isAChatwootInstance.value) {
      return true;
    }
    return providerConfig.isEnabled;
  });
});

function onClick(emailProvider) {
  if (emailProvider.isEnabled) {
    provider.value = emailProvider.key;
  }
}
</script>

<template>
  <div
    v-if="!provider"
    class="border border-slate-25 dark:border-slate-800/60 bg-white dark:bg-slate-900 h-full p-6 w-full max-w-full flex-shrink-0 flex-grow-0"
  >
    <div class="grid max-w-3xl grid-cols-3 mx-0 mt-6">
      <ChannelSelector
        v-for="emailProvider in emailProviderList"
        :key="emailProvider.key"
        :class="{ inactive: !emailProvider.isEnabled }"
        :title="emailProvider.title"
        :src="emailProvider.src"
        @click="() => onClick(emailProvider)"
      />
    </div>
  </div>
  <Microsoft v-else-if="provider === 'microsoft'" />
  <Google v-else-if="provider === 'google'" />
  <ForwardToOption v-else-if="provider === 'other_provider'" />
</template>
