const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

/**
 * Dịch vụ kết nối và gọi Gemini AI API
 */
class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = 'gemini-2.5-flash';
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    } else {
      console.warn('[AIService] Cảnh báo: Chưa cấu hình GEMINI_API_KEY trong file .env');
    }
  }

  /**
   * Gửi system instruction và prompt đến Gemini API
   * @param {string} systemInstruction Chỉ thị hệ thống định hình hành vi AI
   * @param {string} prompt Câu hỏi kết hợp context gửi cho AI
   * @returns {Promise<string>} Câu trả lời dạng text của AI
   */
  async generateResponse(systemInstruction, prompt) {
    try {
      if (!this.apiKey) {
        // Fallback kiểm tra nếu API key được điền động sau khi khởi chạy
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
          throw new Error('Chưa cấu hình GEMINI_API_KEY. Vui lòng điền API key vào file .env ở backend.');
        }
        this.genAI = new GoogleGenerativeAI(this.apiKey);
      }

      // Cấu hình giảm ngưỡng an toàn để tránh chặn các từ lóng trong game hoặc các tên dự án thực tế của người dùng
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ];

      // Khởi tạo model kèm cấu hình systemInstruction và safetySettings
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstruction,
        safetySettings,
      });

      // Cấu hình thế hệ (generation config)
      const generationConfig = {
        temperature: 0.2, // Giảm temperature để AI bám sát dữ liệu context, ít tự ý sáng tạo (ảo tưởng)
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      };

      let retries = 5;
      let delay = 3000; // 3 giây trễ ban đầu

      for (let i = 0; i < retries; i++) {
        try {
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig,
          });

          const response = await result.response;
          return response.text();
        } catch (err) {
          const status = err.status || (err.response && err.response.status);
          const isRateLimit = status === 503 || status === 429 || 
                              err.message.includes('503') || err.message.includes('429') || 
                              err.message.includes('high demand') || err.message.includes('quota') || 
                              err.message.includes('Too Many Requests') || err.message.includes('Service Unavailable');
          
          if (isRateLimit && i < retries - 1) {
            console.log(`[AIService] Gemini API bị quá tải hoặc hết quota (Status: ${status || 'N/A'}). Đang chờ và thử lại lần ${i + 1}/${retries} sau ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Tăng thời gian chờ gấp đôi
          } else {
            console.error('[AIService] Lỗi không thể phục hồi từ Gemini API:', err.message);
            throw err;
          }
        }
      }
    } catch (error) {
      console.error('[AIService] Lỗi gọi Gemini API sau nhiều lần thử:', error.message);
      throw error;
    }
  }
}

module.exports = new AIService();
