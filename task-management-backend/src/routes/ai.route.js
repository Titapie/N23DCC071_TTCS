// src/routes/ai.route.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Trợ lý AI
 *     description: API tích hợp Trợ lý ảo AI Chatbox
 */

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     tags: [Trợ lý AI]
 *     summary: Gửi câu hỏi lên trợ lý ảo AI (Yêu cầu đăng nhập)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: Nội dung câu hỏi của người dùng
 *                 example: Tôi có task nào sắp đến hạn chót?
 *     responses:
 *       200:
 *         description: Trả lời từ AI thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reply:
 *                   type: string
 *                   description: Câu trả lời từ AI định dạng markdown
 *       400:
 *         description: Thiếu tin nhắn đầu vào
 *       401:
 *         description: Chưa xác thực token
 *       500:
 *         description: Lỗi hệ thống hoặc lỗi gọi API AI
 */
const rateLimit = require('express-rate-limit');

// Giới hạn tần suất gọi AI Chatbox (tối đa 5 yêu cầu / 1 phút) để tránh spam API
const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5, // Tối đa 5 yêu cầu mỗi phút
  keyGenerator: (req) => {
    // Sử dụng userId sau khi authenticate để rate limit riêng biệt cho từng người dùng,
    // tránh tình trạng nhiều người dùng dùng chung mạng LAN/NAT bị chặn chéo lẫn nhau.
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: {
    success: false,
    message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng nghỉ ngơi và thử lại sau 1 phút.'
  },
  standardHeaders: true, // Trả về thông tin hạn mức trong headers RateLimit-*
  legacyHeaders: false, // Tắt các header X-RateLimit-* cũ
  validate: false, // Tắt các kiểm tra cảnh báo cấu hình tự định nghĩa key
});

router.post('/chat', authenticate, aiRateLimiter, aiController.chat);

module.exports = router;
