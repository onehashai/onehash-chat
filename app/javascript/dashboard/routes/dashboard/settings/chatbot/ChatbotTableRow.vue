<script setup>
import { computed } from 'vue';

const props = defineProps({
  chatbot: {
    type: Object,
    required: true,
  },
});
defineEmits(['delete']);

const canEdit = computed(() => {
  return (
    props.chatbot.status !== 'Creating' || props.chatbot.status !== 'Retraining'
  );
});
</script>

<template>
  <tr class="">
    <td class="py-4 ltr:pr-4 pl-4">{{ chatbot.name }}</td>
    <td class="py-4 ltr:pr-4 text-center">{{ chatbot.status }}</td>
    <td class="py-4 ltr:pr-4 rtl:pl-4 text-center ">{{ chatbot.last_trained_at }}</td>
    <td class="py-4 flex justify-center gap-1 ">
      <router-link
        :to="{ name: 'chatbots_setting', params: { chatbotId: chatbot.id } }"
      >
        <woot-button
          v-tooltip.top="$t('CHATBOTS.EDIT.TOOLTIP')"
          variant="smooth"
          size="tiny"
          color-scheme="secondary"
          class-names="grey-btn"
          icon="edit"
          :disabled="!canEdit"
        />
      </router-link>
      <woot-button
        v-tooltip.top="$t('CHATBOTS.DELETE.TOOLTIP')"
        variant="smooth"
        color-scheme="alert"
        size="tiny"
        icon="dismiss-circle"
        class-names="grey-btn"
        @click="$emit('delete')"
      />
    </td>
  </tr>
</template>