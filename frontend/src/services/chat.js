import apiClient from '../api/client';

export const chatService = {
  getConversations: async (searchQuery = '') => {
    const response = await apiClient.get('/v1/chat/conversations/', {
      params: { q: searchQuery }
    });
    return response.data;
  },

  createConversation: async (receiverId) => {
    const response = await apiClient.post('/v1/chat/conversations/', {
      receiver_id: receiverId
    });
    return response.data;
  },

  getMessages: async (conversationId, page = 1) => {
    const response = await apiClient.get(`/v1/chat/messages/${conversationId}/`, {
      params: { page }
    });
    return response.data;
  },

  sendMessage: async (conversationId, content) => {
    const response = await apiClient.post('/v1/chat/messages/', {
      conversation_id: conversationId,
      content
    });
    return response.data;
  },

  markRead: async (messageId) => {
    const response = await apiClient.put(`/v1/chat/messages/${messageId}/read/`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/v1/chat/unread-count/');
    return response.data;
  }
};

export default chatService;
