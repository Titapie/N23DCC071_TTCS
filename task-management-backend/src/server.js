// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import kết nối DB
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/user.route');
const projectRoutes = require('./routes/project.route');
const taskRoutes = require('./routes/tasks.route');
const dashboardRoutes = require('./routes/dashboard.route');
const assignmentRoutes = require('./routes/assignment.route');
const projectMemberRoutes = require('./routes/project-member.route');
const statisticsRoutes = require('./routes/statistics.route');
const aiRoutes = require('./routes/ai.route');

// Import services
require('./services/cron.service');

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'API cho hệ thống quản lý công việc và dự án',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Auto-Transition Middleware ───────────────────────────────────────────────
const autoTransitionMiddleware = require('./middleware/autoTransition.middleware');
app.use(['/api/tasks', '/api/projects', '/api/dashboard', '/api/statistics'], autoTransitionMiddleware);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/project-members', projectMemberRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/ai', aiRoutes);
// Notification routes đã bị loại bỏ - hệ thống dùng email thay thế

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`API Docs: http://localhost:${PORT}/api-docs`);

    // Đồng bộ trạng thái task ngay khi khởi động server
    const { autoTransitionTasks } = require('./services/taskTransition.service');
    autoTransitionTasks().then(res => {
      if (res.success && res.count > 0) {
        console.log(`[System] Hoàn thành đồng bộ trạng thái cho ${res.count} task khi khởi động server.`);
      }
    }).catch(err => {
      console.error('[System] Lỗi khi đồng bộ trạng thái task lúc khởi động server:', err.message);
    });
  });
});