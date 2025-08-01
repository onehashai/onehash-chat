<script>
import { ref } from 'vue';
// composable
import { useConfig } from 'dashboard/composables/useConfig';
import { useKeyboardEvents } from 'dashboard/composables/useKeyboardEvents';
import { useAI } from 'dashboard/composables/useAI';
import { useMapGetter } from 'dashboard/composables/store';

// components
import ReplyBox from './ReplyBox.vue';
import Message from './Message.vue';
import NextMessageList from 'next/message/MessageList.vue';
import ConversationLabelSuggestion from './conversation/LabelSuggestion.vue';
import Banner from 'dashboard/components/ui/Banner.vue';

// stores and apis
import { mapGetters } from 'vuex';

// mixins
import inboxMixin, { INBOX_FEATURES } from 'shared/mixins/inboxMixin';

// utils
import { emitter } from 'shared/helpers/mitt';
import { getTypingUsersText } from '../../../helper/commons';
import { calculateScrollTop } from './helpers/scrollTopCalculationHelper';
import { LocalStorage } from 'shared/helpers/localStorage';
import {
  filterDuplicateSourceMessages,
  getReadMessages,
  getUnreadMessages,
} from 'dashboard/helper/conversationHelper';

// constants
import { BUS_EVENTS } from 'shared/constants/busEvents';
import { REPLY_POLICY } from 'shared/constants/links';
import wootConstants from 'dashboard/constants/globals';
import { LOCAL_STORAGE_KEYS } from 'dashboard/constants/localStorage';
import { FEATURE_FLAGS } from '../../../featureFlags';
import { INBOX_TYPES } from 'dashboard/helper/inbox';

import NextButton from 'dashboard/components-next/button/Button.vue';

export default {
  components: {
    Message,
    NextMessageList,
    ReplyBox,
    Banner,
    ConversationLabelSuggestion,
    NextButton,
  },
  mixins: [inboxMixin],
  props: {
    isContactPanelOpen: {
      type: Boolean,
      default: false,
    },
    isInboxView: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['contactPanelToggle'],
  setup() {
    const isPopOutReplyBox = ref(false);
    const { isEnterprise } = useConfig();

    const closePopOutReplyBox = () => {
      isPopOutReplyBox.value = false;
    };

    const showPopOutReplyBox = () => {
      isPopOutReplyBox.value = !isPopOutReplyBox.value;
    };

    const keyboardEvents = {
      Escape: {
        action: closePopOutReplyBox,
      },
    };

    useKeyboardEvents(keyboardEvents);

    const {
      isAIIntegrationEnabled,
      isLabelSuggestionFeatureEnabled,
      fetchIntegrationsIfRequired,
      fetchLabelSuggestions,
    } = useAI();

    const currentAccountId = useMapGetter('getCurrentAccountId');
    const isFeatureEnabledonAccount = useMapGetter(
      'accounts/isFeatureEnabledonAccount'
    );

    const showNextBubbles = isFeatureEnabledonAccount.value(
      currentAccountId.value,
      FEATURE_FLAGS.CHATWOOT_V4
    );

    return {
      isEnterprise,
      isPopOutReplyBox,
      closePopOutReplyBox,
      showPopOutReplyBox,
      isAIIntegrationEnabled,
      isLabelSuggestionFeatureEnabled,
      fetchIntegrationsIfRequired,
      fetchLabelSuggestions,
      showNextBubbles,
    };
  },
  data() {
    return {
      isLoadingPrevious: true,
      heightBeforeLoad: null,
      conversationPanel: null,
      hasUserScrolled: false,
      isProgrammaticScroll: false,
      messageSentSinceOpened: false,
      labelSuggestions: [],
    };
  },

  computed: {
    ...mapGetters({
      currentChat: 'getSelectedChat',
      currentUserId: 'getCurrentUserID',
      listLoadingStatus: 'getAllMessagesLoaded',
      currentAccountId: 'getCurrentAccountId',
    }),
    isOpen() {
      return this.currentChat?.status === wootConstants.STATUS_TYPE.OPEN;
    },
    shouldShowLabelSuggestions() {
      return (
        this.isOpen &&
        this.isEnterprise &&
        this.isAIIntegrationEnabled &&
        !this.messageSentSinceOpened
      );
    },
    inboxId() {
      return this.currentChat.inbox_id;
    },
    inbox() {
      return this.$store.getters['inboxes/getInbox'](this.inboxId);
    },
    typingUsersList() {
      const userList = this.$store.getters[
        'conversationTypingStatus/getUserList'
      ](this.currentChat.id);
      return userList;
    },
    isAnyoneTyping() {
      const userList = this.typingUsersList;
      return userList.length !== 0;
    },
    typingUserNames() {
      const userList = this.typingUsersList;
      if (this.isAnyoneTyping) {
        const [i18nKey, params] = getTypingUsersText(userList);
        return this.$t(i18nKey, params);
      }

      return '';
    },
    getMessages() {
      const messages = this.currentChat.messages || [];
      if (this.isAWhatsAppChannel) {
        return filterDuplicateSourceMessages(messages);
      }
      return messages;
    },
    readMessages() {
      return getReadMessages(
        this.getMessages,
        this.currentChat.agent_last_seen_at
      );
    },
    unReadMessages() {
      return getUnreadMessages(
        this.getMessages,
        this.currentChat.agent_last_seen_at
      );
    },
    shouldShowSpinner() {
      return (
        (this.currentChat && this.currentChat.dataFetched === undefined) ||
        (!this.listLoadingStatus && this.isLoadingPrevious)
      );
    },
    conversationType() {
      const { additional_attributes: additionalAttributes } = this.currentChat;
      const type = additionalAttributes ? additionalAttributes.type : '';
      return type || '';
    },

    isATweet() {
      return this.conversationType === 'tweet';
    },
    isRightOrLeftIcon() {
      if (this.isContactPanelOpen) {
        return 'arrow-chevron-right';
      }
      return 'arrow-chevron-left';
    },
    getLastSeenAt() {
      const { contact_last_seen_at: contactLastSeenAt } = this.currentChat;
      return contactLastSeenAt;
    },

    // Check there is a instagram inbox exists with the same instagram_id
    hasDuplicateInstagramInbox() {
      const instagramId = this.inbox.instagram_id;
      const { additional_attributes: additionalAttributes = {} } = this.inbox;
      const instagramInbox =
        this.$store.getters['inboxes/getInstagramInboxByInstagramId'](
          instagramId
        );

      return (
        this.inbox.channel_type === INBOX_TYPES.FB &&
        additionalAttributes.type === 'instagram_direct_message' &&
        instagramInbox
      );
    },

    replyWindowBannerMessage() {
      if (this.isAWhatsAppChannel) {
        return this.$t('CONVERSATION.TWILIO_WHATSAPP_CAN_REPLY');
      }
      if (this.isAPIInbox) {
        const { additional_attributes: additionalAttributes = {} } = this.inbox;
        if (additionalAttributes) {
          const {
            agent_reply_time_window_message: agentReplyTimeWindowMessage,
            agent_reply_time_window: agentReplyTimeWindow,
          } = additionalAttributes;
          return (
            agentReplyTimeWindowMessage ||
            this.$t('CONVERSATION.API_HOURS_WINDOW', {
              hours: agentReplyTimeWindow,
            })
          );
        }
        return '';
      }
      return this.$t('CONVERSATION.CANNOT_REPLY');
    },
    replyWindowLink() {
      if (this.isAFacebookInbox || this.isAnInstagramChannel) {
        return REPLY_POLICY.FACEBOOK;
      }
      if (this.isAWhatsAppCloudChannel) {
        return REPLY_POLICY.WHATSAPP_CLOUD;
      }
      if (!this.isAPIInbox) {
        return REPLY_POLICY.TWILIO_WHATSAPP;
      }
      return '';
    },
    replyWindowLinkText() {
      if (
        this.isAWhatsAppChannel ||
        this.isAFacebookInbox ||
        this.isAnInstagramChannel
      ) {
        return this.$t('CONVERSATION.24_HOURS_WINDOW');
      }
      if (!this.isAPIInbox) {
        return this.$t('CONVERSATION.TWILIO_WHATSAPP_24_HOURS_WINDOW');
      }
      return '';
    },
    unreadMessageCount() {
      return this.currentChat.unread_count || 0;
    },
    unreadMessageLabel() {
      const count =
        this.unreadMessageCount > 9 ? '9+' : this.unreadMessageCount;
      const label =
        this.unreadMessageCount > 1
          ? 'CONVERSATION.UNREAD_MESSAGES'
          : 'CONVERSATION.UNREAD_MESSAGE';
      return `${count} ${this.$t(label)}`;
    },
    isInstagramDM() {
      return this.conversationType === 'instagram_direct_message';
    },
    inboxSupportsReplyTo() {
      const incoming = this.inboxHasFeature(INBOX_FEATURES.REPLY_TO);
      const outgoing =
        this.inboxHasFeature(INBOX_FEATURES.REPLY_TO_OUTGOING) &&
        !this.is360DialogWhatsAppChannel;

      return { incoming, outgoing };
    },
  },

  watch: {
    currentChat(newChat, oldChat) {
      if (newChat.id === oldChat.id) {
        return;
      }
      this.fetchAllAttachmentsFromCurrentChat();
      this.fetchSuggestions();
      this.messageSentSinceOpened = false;
    },
  },

  created() {
    emitter.on(BUS_EVENTS.SCROLL_TO_MESSAGE, this.onScrollToMessage);
    // when a new message comes in, we refetch the label suggestions
    emitter.on(BUS_EVENTS.FETCH_LABEL_SUGGESTIONS, this.fetchSuggestions);
    // when a message is sent we set the flag to true this hides the label suggestions,
    // until the chat is changed and the flag is reset in the watch for currentChat
    emitter.on(BUS_EVENTS.MESSAGE_SENT, () => {
      this.messageSentSinceOpened = true;
    });
  },

  mounted() {
    this.addScrollListener();
    this.fetchAllAttachmentsFromCurrentChat();
    this.fetchSuggestions();
  },

  unmounted() {
    this.removeBusListeners();
    this.removeScrollListener();
  },

  methods: {
    async fetchSuggestions() {
      // start empty, this ensures that the label suggestions are not shown
      this.labelSuggestions = [];

      if (this.isLabelSuggestionDismissed()) {
        return;
      }

      if (!this.isEnterprise) {
        return;
      }

      // method available in mixin, need to ensure that integrations are present
      await this.fetchIntegrationsIfRequired();

      if (!this.isLabelSuggestionFeatureEnabled) {
        return;
      }

      this.labelSuggestions = await this.fetchLabelSuggestions({
        conversationId: this.currentChat.id,
      });

      // once the labels are fetched, we need to scroll to bottom
      // but we need to wait for the DOM to be updated
      // so we use the nextTick method
      this.$nextTick(() => {
        // this param is added to route, telling the UI to navigate to the message
        // it is triggered by the SCROLL_TO_MESSAGE method
        // see setActiveChat on ConversationView.vue for more info
        const { messageId } = this.$route.query;

        // only trigger the scroll to bottom if the user has not scrolled
        // and there's no active messageId that is selected in view
        if (!messageId && !this.hasUserScrolled) {
          this.scrollToBottom();
        }
      });
    },
    isLabelSuggestionDismissed() {
      return LocalStorage.getFlag(
        LOCAL_STORAGE_KEYS.DISMISSED_LABEL_SUGGESTIONS,
        this.currentAccountId,
        this.currentChat.id
      );
    },
    fetchAllAttachmentsFromCurrentChat() {
      this.$store.dispatch('fetchAllAttachments', this.currentChat.id);
    },
    removeBusListeners() {
      emitter.off(BUS_EVENTS.SCROLL_TO_MESSAGE, this.onScrollToMessage);
    },
    onScrollToMessage({ messageId = '' } = {}) {
      this.$nextTick(() => {
        const messageElement = document.getElementById('message' + messageId);
        if (messageElement) {
          this.isProgrammaticScroll = true;
          messageElement.scrollIntoView({ behavior: 'smooth' });
          this.fetchPreviousMessages();
        } else {
          this.scrollToBottom();
        }
      });
      this.makeMessagesRead();
    },
    addScrollListener() {
      this.conversationPanel = this.$el.querySelector('.conversation-panel');
      this.setScrollParams();
      this.conversationPanel.addEventListener('scroll', this.handleScroll);
      this.$nextTick(() => this.scrollToBottom());
      this.isLoadingPrevious = false;
    },
    removeScrollListener() {
      this.conversationPanel.removeEventListener('scroll', this.handleScroll);
    },
    scrollToBottom() {
      this.isProgrammaticScroll = true;
      let relevantMessages = [];

      // label suggestions are not part of the messages list
      // so we need to handle them separately
      let labelSuggestions =
        this.conversationPanel.querySelector('.label-suggestion');

      // if there are unread messages, scroll to the first unread message
      if (this.unreadMessageCount > 0) {
        // capturing only the unread messages
        relevantMessages =
          this.conversationPanel.querySelectorAll('.message--unread');
      } else if (labelSuggestions) {
        // when scrolling to the bottom, the label suggestions is below the last message
        // so we scroll there if there are no unread messages
        // Unread messages always take the highest priority
        relevantMessages = [labelSuggestions];
      } else {
        // if there are no unread messages or label suggestion, scroll to the last message
        // capturing last message from the messages list
        relevantMessages = Array.from(
          this.conversationPanel.querySelectorAll('.message--read')
        ).slice(-1);
      }

      this.conversationPanel.scrollTop = calculateScrollTop(
        this.conversationPanel.scrollHeight,
        this.$el.scrollHeight,
        relevantMessages
      );
    },
    onToggleContactPanel() {
      this.$emit('contactPanelToggle');
    },
    setScrollParams() {
      this.heightBeforeLoad = this.conversationPanel.scrollHeight;
      this.scrollTopBeforeLoad = this.conversationPanel.scrollTop;
    },

    async fetchPreviousMessages(scrollTop = 0) {
      this.setScrollParams();
      const shouldLoadMoreMessages =
        this.currentChat.dataFetched === true &&
        !this.listLoadingStatus &&
        !this.isLoadingPrevious;

      if (
        scrollTop < 100 &&
        !this.isLoadingPrevious &&
        shouldLoadMoreMessages
      ) {
        this.isLoadingPrevious = true;
        try {
          await this.$store.dispatch('fetchPreviousMessages', {
            conversationId: this.currentChat.id,
            before: this.currentChat.messages[0].id,
          });
          const heightDifference =
            this.conversationPanel.scrollHeight - this.heightBeforeLoad;
          this.conversationPanel.scrollTop =
            this.scrollTopBeforeLoad + heightDifference;
          this.setScrollParams();
        } catch (error) {
          // Ignore Error
        } finally {
          this.isLoadingPrevious = false;
        }
      }
    },

    handleScroll(e) {
      if (this.isProgrammaticScroll) {
        // Reset the flag
        this.isProgrammaticScroll = false;
        this.hasUserScrolled = false;
      } else {
        this.hasUserScrolled = true;
      }
      emitter.emit(BUS_EVENTS.ON_MESSAGE_LIST_SCROLL);
      this.fetchPreviousMessages(e.target.scrollTop);
    },

    makeMessagesRead() {
      this.$store.dispatch('markMessagesRead', { id: this.currentChat.id });
    },
    getInReplyToMessage(parentMessage) {
      if (!parentMessage) return {};
      const inReplyToMessageId = parentMessage.content_attributes?.in_reply_to;
      if (!inReplyToMessageId) return {};

      return this.currentChat?.messages.find(message => {
        if (message.id === inReplyToMessageId) {
          return true;
        }
        return false;
      });
    },
  },
};
</script>

<template>
  <div class="flex flex-col justify-between flex-grow h-full min-w-0 m-0">
    <Banner
      v-if="!currentChat.can_reply"
      color-scheme="alert"
      class="mx-2 mt-2 overflow-hidden rounded-lg"
      :banner-message="replyWindowBannerMessage"
      :href-link="replyWindowLink"
      :href-link-text="replyWindowLinkText"
    />
    <Banner
      v-else-if="hasDuplicateInstagramInbox"
      color-scheme="alert"
      class="mx-2 mt-2 overflow-hidden rounded-lg"
      :banner-message="$t('CONVERSATION.OLD_INSTAGRAM_INBOX_REPLY_BANNER')"
    />
    <div class="flex justify-end">
      <NextButton
        faded
        xs
        slate
        class="!rounded-r-none rtl:rotate-180 !rounded-2xl !fixed z-10"
        :icon="
          isContactPanelOpen ? 'i-ph-caret-right-fill' : 'i-ph-caret-left-fill'
        "
        :class="isInboxView ? 'top-52 md:top-40' : 'top-32'"
        @click="onToggleContactPanel"
      />
    </div>
    <NextMessageList
      v-if="showNextBubbles"
      class="conversation-panel"
      :read-messages="readMessages"
      :un-read-messages="unReadMessages"
      :current-user-id="currentUserId"
      :is-an-email-channel="isAnEmailChannel"
      :inbox-supports-reply-to="inboxSupportsReplyTo"
      :messages="currentChat ? currentChat.messages : []"
    >
      <template #beforeAll>
        <transition name="slide-up">
          <!-- eslint-disable-next-line vue/require-toggle-inside-transition -->
          <li class="min-h-[4rem]">
            <span v-if="shouldShowSpinner" class="spinner message" />
          </li>
        </transition>
      </template>
      <template #beforeUnread>
        <li v-show="unreadMessageCount != 0" class="unread--toast">
          <span>
            {{ unreadMessageCount > 9 ? '9+' : unreadMessageCount }}
            {{
              unreadMessageCount > 1
                ? $t('CONVERSATION.UNREAD_MESSAGES')
                : $t('CONVERSATION.UNREAD_MESSAGE')
            }}
            <!-- REVIEW:CV4.0.2 Below code isn't in our version, why? -->
            <!-- <template #unreadBadge>
        <li v-show="unreadMessageCount != 0" class="unread--toast">
          <span>
            {{ unreadMessageLabel }} -->
          </span>
        </li>
      </template>
      <template #after>
        <ConversationLabelSuggestion
          v-if="shouldShowLabelSuggestions"
          :suggested-labels="labelSuggestions"
          :chat-labels="currentChat.labels"
          :conversation-id="currentChat.id"
        />
      </template>
    </NextMessageList>
    <ul v-else class="conversation-panel">
      <transition name="slide-up">
        <!-- eslint-disable-next-line vue/require-toggle-inside-transition -->
        <li class="min-h-[4rem]">
          <span v-if="shouldShowSpinner" class="spinner message" />
        </li>
      </transition>
      <Message
        v-for="message in readMessages"
        :key="message.id"
        class="message--read ph-no-capture"
        data-clarity-mask="True"
        :data="message"
        :is-a-tweet="isATweet"
        :is-a-whatsapp-channel="isAWhatsAppChannel"
        :is-web-widget-inbox="isAWebWidgetInbox"
        :is-a-facebook-inbox="isAFacebookInbox"
        :is-an-email-inbox="isAnEmailChannel"
        :is-instagram="isInstagramDM"
        :inbox-supports-reply-to="inboxSupportsReplyTo"
        :in-reply-to="getInReplyToMessage(message)"
      />
      <li v-show="unreadMessageCount != 0" class="unread--toast">
        <span>
          {{ unreadMessageCount > 9 ? '9+' : unreadMessageCount }}
          {{
            unreadMessageCount > 1
              ? $t('CONVERSATION.UNREAD_MESSAGES')
              : $t('CONVERSATION.UNREAD_MESSAGE')
          }}
        </span>
      </li>
      <Message
        v-for="message in unReadMessages"
        :key="message.id"
        class="message--unread ph-no-capture"
        data-clarity-mask="True"
        :data="message"
        :is-a-tweet="isATweet"
        :is-a-whatsapp-channel="isAWhatsAppChannel"
        :is-web-widget-inbox="isAWebWidgetInbox"
        :is-a-facebook-inbox="isAFacebookInbox"
        :is-instagram-dm="isInstagramDM"
        :inbox-supports-reply-to="inboxSupportsReplyTo"
        :in-reply-to="getInReplyToMessage(message)"
      />
      <ConversationLabelSuggestion
        v-if="shouldShowLabelSuggestions"
        :suggested-labels="labelSuggestions"
        :chat-labels="currentChat.labels"
        :conversation-id="currentChat.id"
      />
    </ul>
    <div
      class="conversation-footer"
      :class="{
        'modal-mask': isPopOutReplyBox,
        'bg-n-background': showNextBubbles && !isPopOutReplyBox,
      }"
    >
      <div
        v-if="isAnyoneTyping"
        class="absolute flex items-center w-full h-0 -top-7"
      >
        <div
          class="flex py-2 pr-4 pl-5 shadow-md rounded-full bg-white dark:bg-slate-700 text-n-slate-11 text-xs font-semibold my-2.5 mx-auto"
        >
          {{ typingUserNames }}
          <img
            class="w-6 ltr:ml-2 rtl:mr-2"
            src="assets/images/typing.gif"
            alt="Someone is typing"
          />
        </div>
      </div>
      <ReplyBox
        v-model:popout-reply-box="isPopOutReplyBox"
        @toggle-popout="showPopOutReplyBox"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-mask {
  @apply absolute;

  &::v-deep {
    .ProseMirror-woot-style {
      @apply max-h-[25rem];
    }

    .reply-box {
      @apply border border-n-weak max-w-[75rem] w-[70%];

      &.is-private {
        @apply dark:border-n-amber-3/30 border-n-amber-12/5;
      }
    }

    .reply-box .reply-box__top {
      @apply relative min-h-[27.5rem];
    }

    .reply-box__top .input {
      @apply min-h-[27.5rem];
    }

    .emoji-dialog {
      @apply absolute left-auto bottom-1;
    }
  }
}
</style>
