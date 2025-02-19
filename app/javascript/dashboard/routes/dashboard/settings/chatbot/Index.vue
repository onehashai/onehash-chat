<script setup>
import { useStoreGetters, useStore } from 'dashboard/composables/store';
import { useI18n } from 'vue-i18n';
import { useAdmin } from 'dashboard/composables/useAdmin';
import { useAlert } from 'dashboard/composables';
import { computed, onMounted, ref } from 'vue';
import BaseSettingsHeader from '../components/BaseSettingsHeader.vue';
import SettingsLayout from '../SettingsLayout.vue';
import ChatbotTableRow from './ChatbotTableRow.vue';

const getters = useStoreGetters();
const store = useStore();
const { t } = useI18n();
const { isAdmin } = useAdmin();

const showDeleteConfirmationPopup = ref(false);
const selectedChatbot = ref({});

const records = computed(() => getters['chatbots/getChatbots'].value);
const uiFlags = computed(() => getters['chatbots/getUIFlags'].value);

const deleteMessage = computed(() => ` ${selectedChatbot.value.name}?`);

onMounted(() => {
  store.dispatch('chatbots/get');
});

const deleteChatbot = async id => {
  try {
    await store.dispatch('chatbots/delete', id);
    useAlert(t('CHATBOTS.DELETE.API.SUCCESS_MESSAGE'));
  } catch (error) {
    useAlert(t('CHATBOTS.DELETE.API.ERROR_MESSAGE'));
  }
};

const openDeletePopup = response => {
  showDeleteConfirmationPopup.value = true;
  selectedChatbot.value = response;
};

const closeDeletePopup = () => {
  showDeleteConfirmationPopup.value = false;
};

const confirmDeletion = () => {
  closeDeletePopup();
  deleteChatbot(selectedChatbot.value.id);
};
</script>

<template>
  <SettingsLayout
    :no-records-message="$t('CHATBOTS.LIST.404')"
    :no-records-found="!records.length"
    :is-loading="uiFlags.isFetching"
    :loading-message="$t('CHATBOTS.LOADING')"
    feature-name="chatbots"
  >
    <template #header>
      <BaseSettingsHeader
        :title="$t('CHATBOTS.HEADER')"
        :description="$t('CHATBOTS.DESCRIPTION')"
        :link-text="$t('CHATBOTS.LEARN_MORE')"
        feature-name="chatbots"
      >
        <template #actions>
          <router-link
            v-if="isAdmin"
            :to="{ name: 'chatbots_new' }"
            class="button rounded-md primary"
          >
            <fluent-icon icon="add-circle" />
            <span class="button__content">
              {{ $t('CHATBOTS.NEW_CHATBOT') }}
            </span>
          </router-link>
        </template>
      </BaseSettingsHeader>
    </template>
    <template #body>
      <table class="min-w-full divide-y divide-slate-75 dark:divide-slate-700">
        <thead>
          <tr>
            <th class="py-4  text-left">{{ $t('CHATBOTS.NAME') }}</th>
            <th class="py-4  text-center">{{ $t('CHATBOTS.STATUS') }}</th>
            <th class="py-4  text-center">{{ $t('CHATBOTS.LAST_TRAINED_AT') }}</th>
            <th class="py-4  text-center">{{ $t('CHATBOTS.ACTIONS') }}</th>
          </tr>
        </thead>
        <tbody>
          <ChatbotTableRow
            v-for="chatbot in records"
            :key="chatbot.id"
            :chatbot="chatbot"
            @delete="openDeletePopup(chatbot)"
          />
        </tbody>
      </table>
      <woot-delete-modal
      :show.sync="showDeleteConfirmationPopup"
      :on-close="closeDeletePopup"
      :on-confirm="confirmDeletion"
      :title="$t('LABEL_MGMT.DELETE.CONFIRM.TITLE')"
      :reject-text="$t('CHATBOTS.DELETE.CONFIRM.NO')"
      :message="$t('CHATBOTS.DELETE.CONFIRM.MESSAGE')"
      :message-value="deleteMessage"
      :confirm-text="$t('CHATBOTS.DELETE.CONFIRM.YES')"
      :show="showDeleteConfirmationPopup"
        @confirm="confirmDeletion"
        @close="closeDeletePopup"
      >
        <template #message>
          {{ $t('CHATBOTS.DELETE.CONFIRM.MESSAGE', { name: selectedChatbot.name }) }}
        </template>
      </woot-delete-modal>
    </template>
  </SettingsLayout>
</template>