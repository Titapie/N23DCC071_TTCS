// src/routes/statistics.route.js
const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statistics.controller');
const { authenticate, requireManager } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Thống kê
 *     description: API thống kê công việc và dự án
 */

/**
 * @swagger
 * /api/statistics/tasks:
 *   get:
 *     tags: [Thống kê]
 *     summary: Thống kê tổng quan công việc
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: query
 *         description: Lọc theo dự án (tuỳ chọn)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thống kê công việc
 */
router.get('/tasks', authenticate, statisticsController.getTaskStatistics);

/**
 * @swagger
 * /api/statistics/tasks/status:
 *   get:
 *     tags: [Thống kê]
 *     summary: Thống kê công việc theo trạng thái
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thống kê theo trạng thái
 */
router.get('/tasks/status', authenticate, statisticsController.getTaskStatusStats);

/**
 * @swagger
 * /api/statistics/tasks/user/{userId}:
 *   get:
 *     tags: [Thống kê]
 *     summary: Thống kê công việc của một nhân viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thống kê công việc nhân viên
 *       404:
 *         description: Người dùng không tồn tại
 */
router.get('/tasks/user/:userId', authenticate, requireManager, statisticsController.getUserTaskStats);

/**
 * @swagger
 * /api/statistics/projects:
 *   get:
 *     tags: [Thống kê]
 *     summary: Thống kê tiến độ các dự án (Manager/Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê dự án
 */
router.get('/projects', authenticate, requireManager, statisticsController.getProjectStats);

module.exports = router;