<script>
import { CAMPAIGN_TYPES } from 'shared/constants/campaign.js';
import { mapGetters } from 'vuex';

export default {
  name: 'ReportChannels',
  props: {},
  emits: ['reportChannelSelection'],
  data() {
    return {
      selectedOption: null,
    };
  },
  computed: {
    options() {
      return [
        { value: 'Channel::Whatsapp', title: 'WhatsApp', color: '#25D366' },
        { value: 'Channel::WebWidget', title: 'Live Chat', color: '#6366F1' },
        { value: 'Channel::Sms', title: 'SMS', color: '#fbbf24' },
      ];
      // return ['Channel::Whatsapp', 'Channel::WebWidget', 'Channel::Sms'];
    },
  },
  methods: {
    handleInput() {
      this.$emit('reportChannelSelection', this.selectedOption.value);
    },
  },
};
</script>

<template>
  <div class="multiselect-wrap--small">
    <multiselect
      v-model="selectedOption"
      class="no-margin"
      :placeholder="$t('CAMPAIGN_REPORTS.CHANNEL_FILTER_DROPDOWN_LABEL')"
      label="title"
      :options="options"
      :option-height="24"
      :show-labels="false"
      @update:model-value="handleInput"
    />
  </div>
</template>
