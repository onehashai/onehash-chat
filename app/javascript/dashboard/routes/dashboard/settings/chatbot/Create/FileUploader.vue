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
      class-names="button--fixed-top"
      color-scheme="primary"
      @click="connectToInbox"
    >
      {{ $t('CHATBOT_SETTINGS.FORM.CONNECT_INBOX') }}
    </woot-button>
    <page-header
      :header-title="$t('CHATBOT_SETTINGS.CREATE_FLOW.CREATE.TITLE')"
      :header-content="$t('CHATBOT_SETTINGS.CREATE_FLOW.CREATE.DESC')"
    />
    <div class="flex flex-wrap">
      <upload-files @uploadTypeSelected="handleUploadTypeSelected" />
      <upload-area :upload-type="currentUploadType" />
    </div>
  </div>
</template>

<script>
import router from '../../../../index';
import { mapGetters } from 'vuex';
import BackButton from '../../../../../components/widgets/BackButton.vue';
import UploadFiles from '../UploadFiles.vue';
import PageHeader from '../../SettingsSubPageHeader.vue';
import alertMixin from 'shared/mixins/alertMixin';
import UploadArea from '../UploadArea.vue';

export default {
  components: {
    PageHeader,
    UploadFiles,
    UploadArea,
    BackButton,
  },
  mixins: [alertMixin],
  data() {
    return {
      enabledFeatures: {},
      currentUploadType: 'file',
      isHamburgerMenuOpen: true,
    };
  },
  computed: {
    ...mapGetters({ uiSettings: 'getUISettings' }),
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
    handleUploadTypeSelected(type) {
      this.currentUploadType = type;
    },
    async connectToInbox() {
      router.replace({
        name: 'chatbot_connect_inbox',
      });
    },
  },
};
</script>
