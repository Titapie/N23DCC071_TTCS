// src/routes/assignment.route.js
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { authenticate, requireManager } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Phân công
 *     description: API quản lý phân công công việc
 */

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     tags: [Phân công]
 *     summary: Tạo phân công (Manager/Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [taskId, assigneeId]
 *             properties:
 *               taskId:
 *                 type: string
 *               assigneeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Phân công thành công
 *       409:
 *         description: Đã phân công trước đó
 */
router.post('/', authenticate, requireManager, assignmentController.createAssignment);

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     tags: [Phân công]
 *     summary: Lấy danh sách phân công
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách phân công
 */
router.get('/', authenticate, assignmentController.getAssignmentsByTask);

/**
 * @swagger
 * /api/assignments/my-tasks:
 *   get:
 *     tags: [Phân công]
 *     summary: Lấy danh sách công việc được giao cho tôi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách công việc của tôi
 */
router.get('/my-tasks', authenticate, assignmentController.getMyAssignments);


/**
 * @swagger
 * /api/assignments/{id}:
 *   delete:
 *     tags: [Phân công]
 *     summary: Hủy phân công (Manager/Admin)
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
 *         description: Đã hủy phân công
 */
router.delete('/:id', authenticate, requireManager, assignmentController.deleteAssignment);

module.exports = router;
