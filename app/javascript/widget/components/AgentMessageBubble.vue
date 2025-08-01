<script>
import { useMessageFormatter } from 'shared/composables/useMessageFormatter';
import ChatCard from 'shared/components/ChatCard.vue';
import ChatForm from 'shared/components/ChatForm.vue';
import ChatOptions from 'shared/components/ChatOptions.vue';
import ChatArticle from './template/Article.vue';
import EmailInput from './template/EmailInput.vue';
import ShopifyOrderEventCard from './template/ShopifyOrderEventCard.vue';
import CustomerSatisfaction from 'shared/components/CustomerSatisfaction.vue';
import IntegrationCard from './template/IntegrationCard.vue';
import CalEventCard from './template/CalEventCard.vue';
import CalEventConfirmationCard from './template/CalEventConfirmationCard.vue';
import CallingEventCard from './template/CallingEventCard.vue';
import ShopifyProductReferCard from './template/ShopifyProductReferCard.vue';
import ShopifyDiscountReferCard from './template/ShopifyDiscountReferCard.vue';

export default {
  name: 'AgentMessageBubble',
  components: {
    ChatArticle,
    ChatCard,
    ChatForm,
    ChatOptions,
    EmailInput,
    ShopifyOrderEventCard,
    ShopifyProductReferCard,
    ShopifyDiscountReferCard,
    CustomerSatisfaction,
    IntegrationCard,
    CalEventCard,
    CalEventConfirmationCard,
    CallingEventCard,
  },
  props: {
    message: { type: String, default: null },
    contentType: { type: String, default: null },
    messageType: { type: Number, default: null },
    messageId: { type: Number, default: null },
    messageContentAttributes: {
      type: Object,
      default: () => {},
    },
  },
  setup() {
    const { formatMessage, getPlainText, truncateMessage, highlightContent } =
      useMessageFormatter();
    return {
      formatMessage,
      getPlainText,
      truncateMessage,
      highlightContent,
    };
  },
  computed: {
    isTemplate() {
      return this.messageType === 3;
    },
    isTemplateEmail() {
      return this.contentType === 'input_email';
    },
    isTemplateShopifyOrderEvent() {
      return this.contentType === 'shopify_order_event';
    },
    isTemplateShopifyProductRefer() {
      return this.contentType === 'shopify_product_refer';
    },
    isTemplateShopifyDiscountRefer() {
      return this.contentType === 'shopify_discount_refer';
    },
    isCards() {
      return this.contentType === 'cards';
    },
    isOptions() {
      return this.contentType === 'input_select';
    },
    isForm() {
      return this.contentType === 'form';
    },
    isArticle() {
      return this.contentType === 'article';
    },
    isCSAT() {
      return this.contentType === 'input_csat';
    },
    isIntegrations() {
      return this.contentType === 'integrations';
    },
    isCalEvent() {
      return this.contentType === 'cal_event';
    },
    isCallingEvent() {
      return this.contentType === 'calling_event';
    },
    isCalEventConfirmation() {
      return this.contentType === 'cal_event_confirmation';
    },
  },

  methods: {
    onResponse(messageResponse) {
      this.$store.dispatch('message/update', messageResponse);
    },
    onOptionSelect(selectedOption) {
      this.onResponse({
        submittedValues: [selectedOption],
        messageId: this.messageId,
      });
    },
    onFormSubmit(formValues) {
      const formValuesAsArray = Object.keys(formValues).map(key => ({
        name: key,
        value: formValues[key],
      }));
      this.onResponse({
        submittedValues: formValuesAsArray,
        messageId: this.messageId,
      });
    },
  },
};
</script>

<template>
  <div class="chat-bubble-wrap">
    <div
      v-if="
        !isCards && !isOptions && !isForm && !isArticle && !isCards && !isCSAT
      "
      class="chat-bubble agent bg-n-background dark:bg-n-solid-3 text-n-slate-12"
    >
      <div
        v-dompurify-html="formatMessage(message, false)"
        class="message-content text-n-slate-12"
      />

      <CallingEventCard
        v-if="isCallingEvent"
        :call-status="messageContentAttributes.call_status"
        :call-start-time="messageContentAttributes.call_start_time"
        :message-id="messageId"
      />

      <EmailInput
        v-if="isTemplateEmail"
        :message-id="messageId"
        :message-content-attributes="messageContentAttributes"
      />

      <ShopifyOrderEventCard
        v-if="isTemplateShopifyOrderEvent"
        :message-id="messageId"
        :message-content-attributes="messageContentAttributes"
      />

      <ShopifyProductReferCard
        v-if="isTemplateShopifyProductRefer"
        :message-id="messageId"
        :message-content-attributes="messageContentAttributes"
      />

      <ShopifyDiscountReferCard
        v-if="isTemplateShopifyDiscountRefer"
        :message-id="messageId"
        :message-content-attributes="messageContentAttributes"
      />

      <IntegrationCard
        v-if="isIntegrations"
        :message-id="messageId"
        :meeting-data="messageContentAttributes.data"
      />

      <CalEventCard
        v-if="isCalEvent"
        :event-url="messageContentAttributes.event_url"
        :message-id="messageId"
      />

      <CalEventConfirmationCard
        v-if="isCalEventConfirmation"
        :event-payload="messageContentAttributes.event_payload"
      />
    </div>
    <div v-if="isOptions">
      <ChatOptions
        :title="message"
        :options="messageContentAttributes.items"
        :hide-fields="!!messageContentAttributes.submitted_values"
        @option-select="onOptionSelect"
      />
    </div>
    <ChatForm
      v-if="isForm && !messageContentAttributes.submitted_values"
      :items="messageContentAttributes.items"
      :button-label="messageContentAttributes.button_label"
      :submitted-values="messageContentAttributes.submitted_values"
      @submit="onFormSubmit"
    />
    <div v-if="isCards">
      <ChatCard
        v-for="item in messageContentAttributes.items"
        :key="item.title"
        :media-url="item.media_url"
        :title="item.title"
        :description="item.description"
        :actions="item.actions"
      />
    </div>
    <div v-if="isArticle">
      <ChatArticle :items="messageContentAttributes.items" />
    </div>
    <CustomerSatisfaction
      v-if="isCSAT"
      :message-content-attributes="messageContentAttributes.submitted_values"
      :display-type="messageContentAttributes.display_type"
      :message="message"
      :message-id="messageId"
    />
  </div>
</template>
