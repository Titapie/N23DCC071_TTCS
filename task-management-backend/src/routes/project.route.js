// src/routes/project.route.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, requireManager, checkProjectManager } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Dự án
 *     description: API quản lý dự án
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags: [Dự án]
 *     summary: Tạo dự án mới (Manager/Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Dự án đã được tạo
 */
router.post('/', authenticate, requireManager, projectController.createProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags: [Dự án]
 *     summary: Lấy danh sách tất cả dự án
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách dự án
 */
router.get('/', authenticate, projectController.getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags: [Dự án]
 *     summary: Lấy thông tin chi tiết dự án
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
 *         description: Thông tin dự án
 *       404:
 *         description: Dự án không tồn tại
 */
router.get('/:id', authenticate, projectController.getProjectById);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     tags: [Dự án]
 *     summary: Cập nhật dự án (Manager/Admin)
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
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               progress:
 *                 type: number
 *     responses:
 *       200:
 *         description: Dự án đã được cập nhật
 */
router.put('/:id', authenticate, requireManager, projectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags: [Dự án]
 *     summary: Xóa dự án (Manager/Admin)
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
 *         description: Dự án đã được xóa
 *       404:
 *         description: Dự án không tồn tại
 */
router.delete('/:id', authenticate, requireManager, projectController.deleteProject);

/**
 * @swagger
 * /api/projects/{id}/tasks:
 *   get:
 *     tags: [Dự án]
 *     summary: Lấy danh sách công việc của dự án
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
 *         description: Danh sách công việc
 */
router.get('/:id/tasks', authenticate, projectController.getProjectTasks);

/**
 * @swagger
 * /api/projects/{id}/members:
 *   get:
 *     tags: [Dự án]
 *     summary: Lấy danh sách thành viên của dự án
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
 *         description: Danh sách thành viên
 */
router.get('/:id/members', authenticate, projectController.getProjectMembers);

// Xử lý kiểm tra task chưa kết thúc của thành viên trong dự án
router.get('/:projectId/members/:employeeId/unfinished-tasks', authenticate, checkProjectManager, projectController.getMemberUnfinishedTasks);

// Xử lý xóa thành viên khỏi dự án kèm bàn giao task
router.delete('/:projectId/members/:employeeId', authenticate, checkProjectManager, projectController.removeMemberFromProject);

module.exports = router;