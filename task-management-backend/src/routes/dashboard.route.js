// src/routes/dashboard.route.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: API tổng quan và thống kê hệ thống
 */

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     tags: [Dashboard]
 *     summary: Tổng quan (Admin xem toàn hệ thống, Manager xem dự án mình, Employee xem task mình)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê tổng quan
 */
router.get('/overview', authenticate, dashboardController.getOverview);

/**
 * @swagger
 * /api/dashboard/my-projects:
 *   get:
 *     tags: [Dashboard]
 *     summary: Danh sách dự án của tôi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dự án của tôi
 */
router.get('/my-projects', authenticate, dashboardController.getMyProjects);

/**
 * @swagger
 * /api/dashboard/my-tasks:
 *   get:
 *     tags: [Dashboard]
 *     summary: Công việc được giao cho tôi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Công việc của tôi
 */
router.get('/my-tasks', authenticate, dashboardController.getMyTasks);

module.exports = router;