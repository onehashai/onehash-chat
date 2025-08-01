<script>
import OnboardingBaseModal from './BaseModal.vue';
import { useStore } from 'vuex';
import { getWebWidgetScript } from 'dashboard/helper/inbox';

export default {
  components: {
    OnboardingBaseModal,
  },
  setup() {
    const store = useStore();
    return { store };
  },
  computed: {
    webWidgetScript() {
      return getWebWidgetScript(
        this.inbox.web_widget_options.options,
        this.inbox.phone_number,
        this.inbox.name
      );
    },

    currentInbox() {
      return this.$store.getters['inboxes/getInbox'](
        this.$route.params.inbox_id
      );
    },
    isATwilioInbox() {
      return this.currentInbox.channel_type === 'Channel::TwilioSms';
    },
    isAEmailInbox() {
      return this.currentInbox.channel_type === 'Channel::Email';
    },
    isALineInbox() {
      return this.currentInbox.channel_type === 'Channel::Line';
    },
    isASmsInbox() {
      return this.currentInbox.channel_type === 'Channel::Sms';
    },
    isWhatsAppCloudInbox() {
      return (
        this.currentInbox.channel_type === 'Channel::Whatsapp' &&
        this.currentInbox.provider === 'whatsapp_cloud'
      );
    },
    message() {
      if (this.isATwilioInbox) {
        return `${this.$t('INBOX_MGMT.FINISH.MESSAGE')}. ${this.$t(
          'INBOX_MGMT.ADD.TWILIO.API_CALLBACK.SUBTITLE'
        )}`;
      }

      if (this.isASmsInbox) {
        return `${this.$t('INBOX_MGMT.FINISH.MESSAGE')}. ${this.$t(
          'INBOX_MGMT.ADD.SMS.BANDWIDTH.API_CALLBACK.SUBTITLE'
        )}`;
      }

      if (this.isALineInbox) {
        return `${this.$t('INBOX_MGMT.FINISH.MESSAGE')}. ${this.$t(
          'INBOX_MGMT.ADD.LINE_CHANNEL.API_CALLBACK.SUBTITLE'
        )}`;
      }

      if (this.isWhatsAppCloudInbox) {
        return `${this.$t('INBOX_MGMT.FINISH.MESSAGE')}. ${this.$t(
          'INBOX_MGMT.ADD.WHATSAPP.API_CALLBACK.SUBTITLE'
        )}`;
      }

      if (this.isAEmailInbox && !this.currentInbox.provider) {
        return this.$t('INBOX_MGMT.ADD.EMAIL_CHANNEL.FINISH_MESSAGE');
      }

      if (this.currentInbox.web_widget_script) {
        return this.$t('INBOX_MGMT.FINISH.WEBSITE_SUCCESS');
      }

      return this.$t('INBOX_MGMT.FINISH.MESSAGE');
    },
  },
  mounted() {
    this.store.dispatch('accounts/update', {
      onboarding_step: 'true',
    });
  },
};
</script>

<template>
  <OnboardingBaseModal
    :title="$t('INBOX_MGMT.FINISH.TITLE')"
    :message="message"
  >
    <div class="w-full text-center">
      <div class="my-4 mx-auto max-w-full">
        <woot-code
          v-if="currentInbox.web_widget_script"
          :script="currentInbox.web_widget_script"
          class="bg-slate-800"
        />

        <woot-code
          v-else-if="isWhatsAppCloudInbox"
          :script="webWidgetScript"
          class="bg-slate-800"
        />
      </div>
      <div class="w-full max-w-full ml-full">
        <woot-code
          v-if="isATwilioInbox"
          lang="html"
          :script="currentInbox.callback_webhook_url"
        />
      </div>
      <div v-if="isWhatsAppCloudInbox" class="w-full max-w-full ml-full">
        <p class="mt-8 font-medium text-slate-700 dark:text-slate-200">
          {{ $t('INBOX_MGMT.ADD.WHATSAPP.API_CALLBACK.WEBHOOK_URL') }}
        </p>
        <woot-code lang="html" :script="currentInbox.callback_webhook_url" />
        <p class="mt-8 font-medium text-slate-700 dark:text-slate-200">
          {{
            $t(
              'INBOX_MGMT.ADD.WHATSAPP.API_CALLBACK.WEBHOOK_VERIFICATION_TOKEN'
            )
          }}
        </p>
        <woot-code
          lang="html"
          :script="currentInbox.provider_config.webhook_verify_token"
        />
      </div>
      <div class="w-full max-w-full ml-full">
        <woot-code
          v-if="isALineInbox"
          lang="html"
          :script="currentInbox.callback_webhook_url"
        />
      </div>
      <div class="w-full max-w-full ml-full">
        <woot-code
          v-if="isASmsInbox"
          lang="html"
          :script="currentInbox.callback_webhook_url"
        />
      </div>
      <div
        v-if="isAEmailInbox && !currentInbox.provider"
        class="w-full max-w-full ml-full"
      >
        <woot-code lang="html" :script="currentInbox.forward_to_email" />
      </div>
      <div class="flex justify-center gap-2 mt-4">
        <router-link
          class="rounded button hollow primary"
          :to="{
            name: 'settings_inbox_show',
            params: { inboxId: $route.params.inbox_id },
          }"
        >
          {{ $t('INBOX_MGMT.FINISH.MORE_SETTINGS') }}
        </router-link>
        <router-link
          class="rounded button success"
          :to="{
            name: 'inbox_dashboard',
            params: { inboxId: $route.params.inbox_id },
          }"
        >
          {{ $t('INBOX_MGMT.FINISH.BUTTON_TEXT') }}
        </router-link>
      </div>
    </div>
  </OnboardingBaseModal>
</template>
