import { api } from "../utils/api";

export const aiService = {
  /**
   * Gửi tin nhắn câu hỏi lên API AI Chatbox ở backend
   * @param {string} message Câu hỏi của người dùng
   * @returns {Promise<Object>} Response từ server dạng { success: true, reply: "..." }
   */
  async sendMessage(message) {
    return await api.post('/ai/chat', { message });
  }
};
