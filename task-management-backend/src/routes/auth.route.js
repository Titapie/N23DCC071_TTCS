// src/routes/auth.route.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Xác thực
 *     description: API đăng ký, đăng nhập, thông tin người dùng
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Xác thực]
 *     summary: Đăng ký tài khoản mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [employee, manager, admin]
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       409:
 *         description: Email đã tồn tại
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Xác thực]
 *     summary: Đăng nhập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về token
 *       401:
 *         description: Sai thông tin đăng nhập
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Xác thực]
 *     summary: Lấy thông tin người dùng hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *       401:
 *         description: Chưa xác thực
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     tags: [Xác thực]
 *     summary: Đổi mật khẩu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không đúng
 */
router.patch('/change-password', authenticate, authController.changePassword);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Xác thực]
 *     summary: Làm mới access token bằng refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trả về accessToken mới
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Xác thực]
 *     summary: Đăng xuất - vô hiệu hóa refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', authController.logout);
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Xác thực]
 *     summary: Quên mật khẩu - Yêu cầu gửi mã OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Đã gửi mã OTP về email
 *       404:
 *         description: Không tìm thấy email trong hệ thống
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Xác thực]
 *     summary: Đặt lại mật khẩu bằng mã OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "newStrongPassword123"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Mã OTP không hợp lệ hoặc đã hết hạn
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /api/auth/verify-registration:
 *   post:
 *     tags: [Xác thực]
 *     summary: Xác thực đăng ký bằng mã OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Kích hoạt tài khoản thành công
 *       400:
 *         description: OTP không hợp lệ, hoặc tài khoản đã kích hoạt
 */
router.post('/verify-registration', authController.verifyRegistration);

module.exports = router;