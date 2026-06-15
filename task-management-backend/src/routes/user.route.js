// src/routes/user.route.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireAdmin, requireManager } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Người dùng
 *     description: API quản lý thông tin người dùng
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Người dùng]
 *     summary: Lấy danh sách người dùng (Admin xem tất cả, Manager chỉ xem employee)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *           enum: [employee, manager, admin]
 *       - name: isActive
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 */
router.get('/', authenticate, requireManager, userController.getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Người dùng]
 *     summary: Tạo người dùng mới (Admin only)
 *     security:
 *       - bearerAuth: []
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
 *         description: Người dùng đã được tạo
 *       403:
 *         description: Không có quyền (chỉ Admin)
 */
router.post('/', authenticate, requireAdmin, userController.createUser);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     tags: [Người dùng]
 *     summary: Cập nhật thông tin cá nhân (tất cả user)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/me', authenticate, userController.updateMe);

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     tags: [Người dùng]
 *     summary: Đổi role người dùng (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [employee, manager, admin]
 *     responses:
 *       200:
 *         description: Đổi role thành công
 *       403:
 *         description: Không có quyền (chỉ Admin)
 */
router.patch('/:id/role', authenticate, requireAdmin, userController.updateRole);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     tags: [Người dùng]
 *     summary: Cập nhật trạng thái tài khoản (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Trạng thái đã được cập nhật
 */
router.patch('/:id/status', authenticate, requireAdmin, userController.updateStatus);

/**
 * @swagger
 * /api/users/{id}/impact:
 *   get:
 *     tags: [Người dùng]
 *     summary: Kiểm tra ảnh hưởng của việc gỡ role/vô hiệu hóa tài khoản (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin ảnh hưởng dự án/task
 */
router.get('/:id/impact', authenticate, requireAdmin, userController.getUserImpact);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     tags: [Người dùng]
 *     summary: Cập nhật thông tin người dùng theo ID (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/:id', authenticate, requireAdmin, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Người dùng]
 *     summary: Xóa người dùng (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Người dùng đã được xóa
 */
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

module.exports = router;