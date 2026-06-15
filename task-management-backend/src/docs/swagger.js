// src/docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'API cho hệ thống quản lý công việc và dự án'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token của bạn (không cần gõ chữ Bearer)'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']  // Tự động tìm các routes để tài liệu hóa
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;