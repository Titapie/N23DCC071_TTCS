// src/routes/tasks.route.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/tasks.controller');
const { authenticate, requireManager } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Công việc
 *     description: API quản lý công việc
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     tags: [Công việc]
 *     summary: Tạo công việc mới (Manager/Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, project]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               project:
 *                 type: string
 *                 description: ID của dự án
 *               parentTask:
 *                 type: string
 *                 description: ID của công việc cha (nếu có)
 *     responses:
 *       201:
 *         description: Công việc đã được tạo
 *       400:
 *         description: Thiếu thông tin
 */
router.post('/', authenticate, requireManager, taskController.createTask);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     tags: [Công việc]
 *     summary: Lấy danh sách công việc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: project
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách công việc
 */
router.get('/', authenticate, taskController.getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     tags: [Công việc]
 *     summary: Lấy thông tin công việc theo ID
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
 *         description: Thông tin công việc
 *       404:
 *         description: Công việc không tồn tại
 */
router.get('/:id', authenticate, taskController.getTaskById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     tags: [Công việc]
 *     summary: Cập nhật công việc (Manager/Admin)
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Công việc đã được cập nhật
 */
router.put('/:id', authenticate, requireManager, taskController.updateTask);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     tags: [Công việc]
 *     summary: Cập nhật trạng thái công việc
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done, pending, cancelled]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trạng thái đã được cập nhật
 */
router.patch('/:id/status', authenticate, taskController.updateTaskStatus);

/**
 * @swagger
 * /api/tasks/{id}/request-redo:
 *   post:
 *     tags: [Công việc]
 *     summary: Employee xin làm lại công việc đã hoàn thành (gửi email tới manager, không đổi status)
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
 *         description: Yêu cầu đã được gửi tới manager
 *       403:
 *         description: Không có quyền
 */
router.post('/:id/request-redo', authenticate, taskController.requestRedo);


/**
 * @swagger
 * /api/tasks/{id}/assignments:
 *   get:
 *     tags: [Công việc]
 *     summary: Lấy danh sách nhân viên được phân công
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
 *         description: Danh sách phân công
 */
router.get('/:id/assignments', authenticate, taskController.getTaskAssignments);


/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     tags: [Công việc]
 *     summary: Xóa công việc (Manager/Admin)
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
 *         description: Công việc đã được xóa
 *       404:
 *         description: Công việc không tồn tại
 */
router.delete('/:id', authenticate, requireManager, taskController.deleteTask);

module.exports = router;