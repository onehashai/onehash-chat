<template>
  <div
    class="border border-slate-25 dark:border-slate-800/60 bg-white dark:bg-slate-900 h-full p-6 w-full max-w-full md:w-3/4 md:max-w-[75%] flex-shrink-0 flex-grow-0"
  >
    <template v-if="isHamburgerMenuOpen">
      <back-button class="absolute top-[17px] left-[420px]" />
    </template>
    <template v-else>
      <back-button class="absolute top-[17px] left-[240px]" />
    </template>
    <woot-button
      :is-disabled="!isButtonActive"
      class-names="button--fixed-top"
      color-scheme="primary"
      @click="createChatbot"
    >
      {{ $t('CHATBOT_SETTINGS.FORM.SUBMIT_CREATE') }}
    </woot-button>
    <page-header
      :header-title="$t('CHATBOT_SETTINGS.CREATE_FLOW.CONNECT.TITLE')"
      :header-content="$t('CHATBOT_SETTINGS.CREATE_FLOW.CONNECT.DESC')"
    />
    <div class="flex flex-wrap">
      <div class="mt-2 flex-grow-0 flex-shrink-0 flex-[80%]">
        <label>
          {{ $t('CHATBOT_SETTINGS.FORM.TITLE') }}
          <select
            v-model="selectedInbox"
            class="inbox-dropdown"
            @change="allotWebsiteToken"
          >
            <option
              v-for="inbox in filteredInboxes"
              :key="inbox.id"
              :value="inbox.id"
            >
              {{ inbox.name }}
            </option>
          </select>
        </label>
      </div>
    </div>
    <banner
      v-if="!userDismissedBotCreatingMessage && showBotCreatingMessage"
      color-scheme="primary"
      :banner-message="botCreatingMessage"
      has-close-button
      class="fixed top-0 left-0 w-full z-50"
      @close="dismissUpdateBanner"
    />
    <banner
      v-if="
        !userDismissedBotCreationFailureMessage && showBotCreationFailureMessage
      "
      color-scheme="alert"
      :banner-message="botCreationFailureMessage"
      has-close-button
      class="fixed top-0 left-0 w-full z-50"
      @close="dismissUpdateBanner"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ChatbotAPI from '../../../../../api/chatbot';
import PageHeader from '../../SettingsSubPageHeader.vue';
import Banner from '../../../../../../dashboard/components/ui/Banner.vue';
import BackButton from '../../../../../components/widgets/BackButton.vue';

export default {
  components: {
    PageHeader,
    Banner,
    BackButton,
  },
  data() {
    return {
      selectedInbox: null,
      website_token: '',
      isButtonActive: false,
      inbox_id: '',
      inbox_name: '',
      showBotCreatingMessage: false,
      showBotCreationFailureMessage: false,
      userDismissedBotCreatingMessage: false,
      userDismissedBotCreationFailureMessage: false,
      chatbot_id: '',
      isHamburgerMenuOpen: true,
    };
  },
  computed: {
    ...mapGetters({
      inboxesList: 'inboxes/getInboxes',
      currentAccountId: 'getCurrentAccountId',
      botFiles: 'chatbot/getBotFiles',
      botText: 'chatbot/getBotText',
      botUrls: 'chatbot/getBotUrls',
    }),
    ...mapGetters({ uiSettings: 'getUISettings' }),
    filteredInboxes() {
      return this.inboxesList.filter(
        inbox => inbox.channel_type === 'Channel::WebWidget'
      );
    },
    botCreatingMessage() {
      return this.$t('CHATBOT_SETTINGS.BANNER.CREATING');
    },
    botCreationFailureMessage() {
      return this.$t('CHATBOT_SETTINGS.BANNER.FAIL');
    },
  },
  watch: {
    'uiSettings.show_secondary_sidebar': function (newVal) {
      this.isHamburgerMenuOpen = newVal;
    },
  },
  created() {
    this.isHamburgerMenuOpen = this.uiSettings.show_secondary_sidebar;
  },
  methods: {
    async createChatbot() {
      try {
        this.showBotCreatingMessage = true;
        // saving bot info to backend DB
        const payload = new FormData();
        payload.append('accountId', this.currentAccountId);
        payload.append('website_token', this.website_token);
        payload.append('inbox_id', this.inbox_id);
        payload.append('inbox_name', this.inbox_name);
        const res = await ChatbotAPI.storeToDb(payload);
        // saving bot info to microservice DB
        const formData = new FormData();
        formData.append('bot_text', this.botText);
        formData.append('chatbot_id', res.chatbot_id);
        formData.append('temperature', 0.1);
        this.chatbot_id = res.chatbot_id;
        for (let i = 0; i < this.botFiles.length; i += 1) {
          formData.append('bot_files', this.botFiles[i]);
        }
        for (let i = 0; i < this.botUrls.length; i += 1) {
          formData.append('bot_urls', this.botUrls[i]);
        }
        await ChatbotAPI.createChatbot(formData);
      } catch (error) {
        this.showBotCreatingMessage = false;
        this.userDismissedBotCreationFailureMessage = false;
        this.showBotCreationFailureMessage = true;
        await ChatbotAPI.deleteChatbotWithChatbotId(this.chatbot_id);
      }
    },
    dismissUpdateBanner() {
      this.userDismissedBotCreatingMessage = true;
      this.userDismissedBotCreationFailureMessage = true;
    },
    allotWebsiteToken() {
      if (this.selectedInbox) {
        const selectedInboxData = this.filteredInboxes.find(
          inbox => inbox.id === this.selectedInbox
        );
        this.isButtonActive = true;
        this.inbox_name = selectedInboxData.name;
        this.website_token = selectedInboxData.website_token;
        this.inbox_id = selectedInboxData.id;
      } else {
        this.isButtonActive = false;
      }
    },
  },
};
</script>
