import types from '../../mutation-types';
import { format } from 'date-fns';

import ConversationApi from '../../../api/inbox/conversation';
import MessageApi from '../../../api/inbox/message';
import ShopifyProductsApi from '../../../api/shopify/products';

import { MESSAGE_STATUS, MESSAGE_TYPE } from 'shared/constants/messages';
import { createPendingMessage } from 'dashboard/helper/commons';
import {
  buildConversationList,
  isOnMentionsView,
  isOnUnattendedView,
} from './helpers/actionHelpers';
import messageReadActions from './actions/messageReadActions';
import messageTranslateActions from './actions/messageTranslateActions';
import * as Sentry from '@sentry/vue';
export const hasMessageFailedWithExternalError = pendingMessage => {
  // This helper is used to check if the message has failed with an external error.
  // We have two cases
  // 1. Messages that fail from the UI itself (due to large attachments or a failed network):
  //    In this case, the message will have a status of failed but no external error. So we need to create that message again
  // 2. Messages sent from Chatwoot but failed to deliver to the customer for some reason (user blocking or client system down):
  //    In this case, the message will have a status of failed and an external error. So we need to retry that message
  const { content_attributes: contentAttributes, status } = pendingMessage;
  const externalError = contentAttributes?.external_error ?? '';
  return status === MESSAGE_STATUS.FAILED && externalError !== '';
};

// actions
const actions = {
  getConversation: async ({ commit }, conversationId) => {
    try {
      const response = await ConversationApi.show(conversationId);
      commit(types.UPDATE_CONVERSATION, response.data);
      commit(`contacts/${types.SET_CONTACT_ITEM}`, response.data.meta.sender);
    } catch (error) {
      // Ignore error
    }
  },

  fetchProducts: async ({ commit }) => {
    try {
      const response = await ShopifyProductsApi.get();
      commit(types.SET_SHOPIFY_PRODUCTS, response.data.products);
    } catch (error) {
      // Ignore error
    }
  },

  fetchDiscounts: async ({ commit }) => {
    try {
      const response = await ShopifyProductsApi.getDiscounts();
      commit(types.SET_SHOPIFY_DISCOUNTS, response.data.discounts);
    } catch (error) {
      // Ignore error
    }
  },

  sendProducts: async ({ commit, dispatch }, body) => {
    try {
      let messagePayload = {
        conversationId: body.chat_id,
        message: 'Referred products',
        private: false,
        sender: body.sender,
        content_type: 16,
        contentAttributes: {
          products: body.products,
        },
      };

      await dispatch('createPendingMessageAndSend', messagePayload);
    } catch (error) {
      // Ignore error
    }
  },

  sendDiscounts: async ({ commit, dispatch }, body) => {
    try {
      let messagePayload = {
        conversationId: body.chat_id,
        message: 'Referred discounts',
        private: false,
        sender: body.sender,
        content_type: 17,
        contentAttributes: {
          discounts: body.discounts,
        },
      };

      await dispatch('createPendingMessageAndSend', messagePayload);
    } catch (error) {
      // Ignore error
    }
  },

  createCall: async ({ commit, dispatch }, body) => {
    try {
      let messagePayload = {
        conversationId: body.chat_id,
        message: 'Started a call',
        private: false,
        sender: body.sender,
        content_type: 14,
        contentAttributes: {
          call_start_time: new Date().toISOString(),
          call_room: body.room_id,
        },
      };

      const call = await ConversationApi.createCall(body.chat_id, {
        ...body,
        message_id: 20,
      });

      body.jwt = call.data.jwt;

      commit(types.ACTIVE_CALL, body);

      const message = await dispatch(
        'createPendingMessageAndSend',
        messagePayload
      );

      return call;
    } catch (error) {
      return null;
    }
  },

  returnOrder: async ({ dispatch }, body) => {
    try {
      const now = new Date();
      const { order_id, order_name, line_items, sender, chat_id, status_url } =
        body;

      let messagePayload = {
        conversationId: chat_id,
        message: `Return created for Order ${order_name} on ${format(now, "yy-MM-dd 'at' HH:mm a")}`,
        private: false,
        sender: sender,
        content_type: 15,
        contentAttributes: {
          shopify_event: {
            event_time: now.toISOString(),
            event_name: 'return_order',
            order_id: order_id,
            items: line_items,
            status_url: status_url,
          },
        },
      };

      const message = await dispatch(
        'createPendingMessageAndSend',
        messagePayload
      );
      return message;
    } catch (error) {
      return null;
    }
  },

  fulfillOrder: async ({ dispatch }, body) => {
    try {
      const now = new Date();
      const { order_id, order_name, line_items, sender, chat_id, status_url } =
        body;

      let messagePayload = {
        conversationId: chat_id,
        message: `Fulfillment created for Order ${order_name} on ${format(now, "yy-MM-dd 'at' HH:mm a")}`,
        private: false,
        sender: sender,
        content_type: 15,
        contentAttributes: {
          shopify_event: {
            event_time: now.toISOString(),
            event_name: 'fulfill_order',
            order_id: order_id,
            items: line_items,
            status_url: status_url,
          },
        },
      };

      const message = await dispatch(
        'createPendingMessageAndSend',
        messagePayload
      );
      return message;
    } catch (error) {
      return null;
    }
  },

  refundOrder: async ({ dispatch }, body) => {
    try {
      const now = new Date();
      const {
        order_id,
        order_name,
        line_items,
        sender,
        chat_id,
        total_refund,
        status_url,
      } = body;

      let messagePayload = {
        conversationId: chat_id,
        message: `Refund created for Order ${order_name} on ${format(now, "yy-MM-dd 'at' HH:mm a")}`,
        private: false,
        sender: sender,
        content_type: 15,
        contentAttributes: {
          shopify_event: {
            event_time: now.toISOString(),
            event_name: 'refund_order',
            order_id: order_id,
            items: line_items,
            status_url: status_url,
            total_refund: total_refund,
          },
        },
      };

      const message = await dispatch(
        'createPendingMessageAndSend',
        messagePayload
      );
      return message;
    } catch (error) {
      return null;
    }
  },

  cancelOrder: async ({ dispatch }, body) => {
    try {
      const now = new Date();
      let messagePayload = {
        conversationId: body.chat_id,
        message: `Your shopify Order ${body.order_name} was cancelled on ${format(now, "yy-MM-dd 'at' HH:mm a")}`,
        private: false,
        sender: body.sender,
        content_type: 15,
        contentAttributes: {
          shopify_event: {
            event_time: now.toISOString(),
            event_name: 'cancel_order',
            order_id: body.order_id,
            status_url: body.status_url,
          },
        },
      };

      const message = await dispatch(
        'createPendingMessageAndSend',
        messagePayload
      );
      return message;
    } catch (error) {
      return null;
    }
  },

  endCall: async ({ commit }, body) => {
    try {
      await ConversationApi.endCall(body.chat_id, body);
      commit(types.REMOVE_CALL);
    } catch (error) {
      // Handle error
    }
  },

  closeCall: async ({ commit }) => {
    try {
      commit(types.REMOVE_CALL);
    } catch (error) {
      // Handle error
    }
  },

  fetchAllConversations: async ({ commit, state, dispatch }) => {
    commit(types.SET_LIST_LOADING_STATUS);
    try {
      const params = state.conversationFilters;
      const {
        data: { data },
      } = await ConversationApi.get(params);
      buildConversationList(
        { commit, dispatch },
        params,
        data,
        params.assigneeType
      );
    } catch (error) {
      // Handle error
    }
  },

  fetchFilteredConversations: async ({ commit, dispatch }, params) => {
    commit(types.SET_LIST_LOADING_STATUS);
    try {
      const { data } = await ConversationApi.filter(params);
      buildConversationList(
        { commit, dispatch },
        params,
        data,
        'appliedFilters'
      );
    } catch (error) {
      // Handle error
    }
  },

  emptyAllConversations({ commit }) {
    commit(types.EMPTY_ALL_CONVERSATION);
  },

  clearSelectedState({ commit }) {
    commit(types.CLEAR_CURRENT_CHAT_WINDOW);
  },

  fetchPreviousMessages: async ({ commit }, data) => {
    try {
      const {
        data: { meta, payload },
      } = await MessageApi.getPreviousMessages(data);
      commit(`conversationMetadata/${types.SET_CONVERSATION_METADATA}`, {
        id: data.conversationId,
        data: meta,
      });
      commit(types.SET_PREVIOUS_CONVERSATIONS, {
        id: data.conversationId,
        data: payload,
      });
      if (!payload.length) {
        commit(types.SET_ALL_MESSAGES_LOADED);
      }
    } catch (error) {
      // Handle error
    }
  },

  fetchAllAttachments: async ({ commit }, conversationId) => {
    let attachments = [];

    try {
      const { data } = await ConversationApi.getAllAttachments(conversationId);
      attachments = data.payload;
    } catch (error) {
      // in case of error, log the error and continue
      Sentry.setContext('Conversation', {
        id: conversationId,
      });
      Sentry.captureException(error);
    } finally {
      // we run the commit even if the request fails
      // this ensures that the `attachment` variable is always present on chat
      commit(types.SET_ALL_ATTACHMENTS, {
        id: conversationId,
        data: attachments,
      });
    }
  },

  syncActiveConversationMessages: async (
    { commit, state, dispatch },
    { conversationId }
  ) => {
    const { allConversations, syncConversationsMessages } = state;
    const lastMessageId = syncConversationsMessages[conversationId];
    const selectedChat = allConversations.find(
      conversation => conversation.id === conversationId
    );
    if (!selectedChat) return;
    try {
      const { messages } = selectedChat;
      // Fetch all the messages after the last message id
      const {
        data: { meta, payload },
      } = await MessageApi.getPreviousMessages({
        conversationId,
        after: lastMessageId,
      });
      commit(`conversationMetadata/${types.SET_CONVERSATION_METADATA}`, {
        id: conversationId,
        data: meta,
      });
      // Find the messages that are not already present in the store
      const missingMessages = payload.filter(
        message => !messages.find(item => item.id === message.id)
      );
      selectedChat.messages.push(...missingMessages);
      // Sort the messages by created_at
      const sortedMessages = selectedChat.messages.sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
      });
      commit(types.SET_MISSING_MESSAGES, {
        id: conversationId,
        data: sortedMessages,
      });
      commit(types.SET_LAST_MESSAGE_ID_IN_SYNC_CONVERSATION, {
        conversationId,
        messageId: null,
      });
      dispatch('markMessagesRead', { id: conversationId }, { root: true });
    } catch (error) {
      // Handle error
    }
  },

  setConversationLastMessageId: async (
    { commit, state },
    { conversationId }
  ) => {
    const { allConversations } = state;
    const selectedChat = allConversations.find(
      conversation => conversation.id === conversationId
    );
    if (!selectedChat) return;
    const { messages } = selectedChat;
    const lastMessage = messages.last();
    if (!lastMessage) return;
    commit(types.SET_LAST_MESSAGE_ID_IN_SYNC_CONVERSATION, {
      conversationId,
      messageId: lastMessage.id,
    });
  },

  async setActiveChat({ commit, dispatch }, { data, after }) {
    commit(types.SET_CURRENT_CHAT_WINDOW, data);
    commit(types.CLEAR_ALL_MESSAGES_LOADED);
    if (data.dataFetched === undefined) {
      try {
        await dispatch('fetchPreviousMessages', {
          after,
          before: data.messages[0].id,
          conversationId: data.id,
        });
        data.dataFetched = true;
      } catch (error) {
        // Ignore error
      }
    }
  },

  assignAgent: async ({ dispatch }, { conversationId, agentId }) => {
    try {
      const response = await ConversationApi.assignAgent({
        conversationId,
        agentId,
      });
      dispatch('setCurrentChatAssignee', response.data);
    } catch (error) {
      // Handle error
    }
  },

  setCurrentChatAssignee({ commit }, assignee) {
    commit(types.ASSIGN_AGENT, assignee);
  },

  assignTeam: async ({ dispatch }, { conversationId, teamId }) => {
    try {
      const response = await ConversationApi.assignTeam({
        conversationId,
        teamId,
      });
      dispatch('setCurrentChatTeam', { team: response.data, conversationId });
    } catch (error) {
      // Handle error
    }
  },

  setCurrentChatTeam({ commit }, { team, conversationId }) {
    commit(types.ASSIGN_TEAM, { team, conversationId });
  },

  toggleStatus: async (
    { commit },
    { conversationId, status, snoozedUntil = null }
  ) => {
    try {
      const {
        data: {
          payload: {
            current_status: updatedStatus,
            snoozed_until: updatedSnoozedUntil,
          } = {},
        } = {},
      } = await ConversationApi.toggleStatus({
        conversationId,
        status,
        snoozedUntil,
      });
      commit(types.CHANGE_CONVERSATION_STATUS, {
        conversationId,
        status: updatedStatus,
        snoozedUntil: updatedSnoozedUntil,
      });
    } catch (error) {
      // Handle error
    }
  },

  createPendingMessageAndSend: async ({ dispatch }, data) => {
    const pendingMessage = createPendingMessage(data);
    const response = await dispatch('sendMessageWithData', pendingMessage);
    return response;
  },

  sendMessageWithData: async ({ commit }, pendingMessage) => {
    const { conversation_id: conversationId, id } = pendingMessage;
    try {
      commit(types.ADD_MESSAGE, {
        ...pendingMessage,
        status: MESSAGE_STATUS.PROGRESS,
      });
      const response = hasMessageFailedWithExternalError(pendingMessage)
        ? await MessageApi.retry(conversationId, id)
        : await MessageApi.create(pendingMessage);
      commit(types.ADD_MESSAGE, {
        ...response.data,
        status: MESSAGE_STATUS.SENT,
      });
      commit(types.ADD_CONVERSATION_ATTACHMENTS, {
        ...response.data,
        status: MESSAGE_STATUS.SENT,
      });
      return response;
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.error
        : undefined;
      commit(types.ADD_MESSAGE, {
        ...pendingMessage,
        meta: {
          error: errorMessage,
        },
        status: MESSAGE_STATUS.FAILED,
      });
      throw error;
    }
  },

  addMessage({ commit }, message) {
    commit(types.ADD_MESSAGE, message);
    if (message.message_type === MESSAGE_TYPE.INCOMING) {
      commit(types.SET_CONVERSATION_CAN_REPLY, {
        conversationId: message.conversation_id,
        canReply: true,
      });
      commit(types.ADD_CONVERSATION_ATTACHMENTS, message);
    }
  },

  updateMessage({ commit }, message) {
    commit(types.ADD_MESSAGE, message);
  },

  deleteMessage: async function deleteLabels(
    { commit },
    { conversationId, messageId }
  ) {
    try {
      const { data } = await MessageApi.delete(conversationId, messageId);
      commit(types.ADD_MESSAGE, data);
      commit(types.DELETE_CONVERSATION_ATTACHMENTS, data);
    } catch (error) {
      throw new Error(error);
    }
  },

  addConversation({ commit, state, dispatch, rootState }, conversation) {
    const { currentInbox, appliedFilters } = state;
    const {
      inbox_id: inboxId,
      meta: { sender },
    } = conversation;

    const hasAppliedFilters = !!appliedFilters.length;
    const isMatchingInboxFilter =
      !currentInbox || Number(currentInbox) === inboxId;
    if (
      !hasAppliedFilters &&
      !isOnMentionsView(rootState) &&
      !isOnUnattendedView(rootState) &&
      isMatchingInboxFilter
    ) {
      commit(types.ADD_CONVERSATION, conversation);
      dispatch('contacts/setContact', sender);
    }
  },

  addMentions({ dispatch, rootState }, conversation) {
    if (isOnMentionsView(rootState)) {
      dispatch('updateConversation', conversation);
    }
  },

  addUnattended({ dispatch, rootState }, conversation) {
    if (isOnUnattendedView(rootState)) {
      dispatch('updateConversation', conversation);
    }
  },

  updateConversation({ commit, dispatch }, conversation) {
    const {
      meta: { sender },
    } = conversation;
    commit(types.UPDATE_CONVERSATION, conversation);

    dispatch('conversationLabels/setConversationLabel', {
      id: conversation.id,
      data: conversation.labels,
    });

    dispatch('contacts/setContact', sender);
  },

  updateConversationLastActivity(
    { commit },
    { conversationId, lastActivityAt }
  ) {
    commit(types.UPDATE_CONVERSATION_LAST_ACTIVITY, {
      lastActivityAt,
      conversationId,
    });
  },

  setChatStatusFilter({ commit }, data) {
    commit(types.CHANGE_CHAT_STATUS_FILTER, data);
  },

  setChatSortFilter({ commit }, data) {
    commit(types.CHANGE_CHAT_SORT_FILTER, data);
  },

  updateAssignee({ commit }, data) {
    commit(types.UPDATE_ASSIGNEE, data);
  },

  updateConversationContact({ commit }, data) {
    if (data.id) {
      commit(`contacts/${types.SET_CONTACT_ITEM}`, data);
    }
    commit(types.UPDATE_CONVERSATION_CONTACT, data);
  },

  setActiveInbox({ commit }, inboxId) {
    commit(types.SET_ACTIVE_INBOX, inboxId);
  },

  muteConversation: async ({ commit }, conversationId) => {
    try {
      await ConversationApi.mute(conversationId);
      commit(types.MUTE_CONVERSATION);
    } catch (error) {
      //
    }
  },

  unmuteConversation: async ({ commit }, conversationId) => {
    try {
      await ConversationApi.unmute(conversationId);
      commit(types.UNMUTE_CONVERSATION);
    } catch (error) {
      //
    }
  },

  sendEmailTranscript: async (_, { conversationId, email }) => {
    try {
      await ConversationApi.sendEmailTranscript({ conversationId, email });
    } catch (error) {
      throw new Error(error);
    }
  },

  updateCustomAttributes: async (
    { commit },
    { conversationId, customAttributes }
  ) => {
    try {
      const response = await ConversationApi.updateCustomAttributes({
        conversationId,
        customAttributes,
      });
      const { custom_attributes } = response.data;
      commit(types.UPDATE_CONVERSATION_CUSTOM_ATTRIBUTES, custom_attributes);
    } catch (error) {
      // Handle error
    }
  },

  setConversationFilters({ commit }, data) {
    commit(types.SET_CONVERSATION_FILTERS, data);
  },

  clearConversationFilters({ commit }) {
    commit(types.CLEAR_CONVERSATION_FILTERS);
  },

  setChatListFilters({ commit }, data) {
    commit(types.SET_CHAT_LIST_FILTERS, data);
  },

  updateChatListFilters({ commit }, data) {
    commit(types.UPDATE_CHAT_LIST_FILTERS, data);
  },

  assignPriority: async ({ dispatch }, { conversationId, priority }) => {
    try {
      await ConversationApi.togglePriority({
        conversationId,
        priority,
      });

      dispatch('setCurrentChatPriority', {
        priority,
        conversationId,
      });
    } catch (error) {
      // Handle error
    }
  },

  setCurrentChatPriority({ commit }, { priority, conversationId }) {
    commit(types.ASSIGN_PRIORITY, { priority, conversationId });
  },

  setContextMenuChatId({ commit }, chatId) {
    commit(types.SET_CONTEXT_MENU_CHAT_ID, chatId);
  },

  sendCalEvent: async (
    _,
    { account_id, conversation_id, event_url, title }
  ) => {
    try {
      await MessageApi.sendCalEvent({
        account_id,
        conversation_id,
        event_url,
        title,
      });
    } catch (error) {
      throw new Error(error);
    }
  },
  getInboxCaptainAssistantById: async ({ commit }, conversationId) => {
    try {
      const response = await ConversationApi.getInboxAssistant(conversationId);
      commit(types.SET_INBOX_CAPTAIN_ASSISTANT, response.data);
    } catch (error) {
      // Handle error
    }
  },

  ...messageReadActions,
  ...messageTranslateActions,
};

export default actions;
