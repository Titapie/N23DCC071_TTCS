// src/routes/project-member.route.js
const express = require('express');
const router = express.Router();
const projectMemberController = require('../controllers/project-member.controller');
const { authenticate, requireManager } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Thành viên dự án
 *     description: API quản lý thành viên tham gia dự án
 */

/**
 * @swagger
 * /api/project-members:
 *   post:
 *     tags: [Thành viên dự án]
 *     summary: Thêm thành viên vào dự án (Manager/Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, userId]
 *             properties:
 *               projectId:
 *                 type: string
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [member, lead]
 *     responses:
 *       201:
 *         description: Thêm thành viên thành công
 *       409:
 *         description: Người dùng đã là thành viên
 */
router.post('/', authenticate, requireManager, projectMemberController.addMember);

/**
 * @swagger
 * /api/project-members/{id}:
 *   patch:
 *     tags: [Thành viên dự án]
 *     summary: Cập nhật vai trò thành viên (Manager/Admin)
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
 *               role:
 *                 type: string
 *                 enum: [member, lead]
 *     responses:
 *       200:
 *         description: Cập nhật vai trò thành công
 */
router.patch('/:id', authenticate, requireManager, projectMemberController.updateMemberRole);

/**
 * @swagger
 * /api/project-members/{id}:
 *   delete:
 *     tags: [Thành viên dự án]
 *     summary: Xóa thành viên khỏi dự án (Manager/Admin)
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
 *         description: Đã xóa thành viên
 */
router.delete('/:id', authenticate, requireManager, projectMemberController.removeMember);

module.exports = router;
