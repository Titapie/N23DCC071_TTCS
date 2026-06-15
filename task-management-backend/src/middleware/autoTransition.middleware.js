const { autoTransitionTasks } = require('../services/taskTransition.service');

/**
 * Middleware Express tự động kiểm tra và chuyển trạng thái task đến hạn bắt đầu
 */
module.exports = async (req, res, next) => {
  try {
    // Chỉ chạy đồng bộ đối với các request GET (để dữ liệu trả về cho client luôn mới nhất)
    if (req.method === 'GET') {
      await autoTransitionTasks();
    } else {
      // Các phương thức thay đổi dữ liệu (POST, PUT, DELETE) chạy ngầm bất đồng bộ để tránh làm chậm thao tác
      autoTransitionTasks().catch(err => {
        console.error('Lỗi chạy ngầm autoTransitionTasks trong middleware:', err.message);
      });
    }
  } catch (error) {
    console.error('Lỗi trong middleware tự động chuyển trạng thái task:', error.message);
  }
  next();
};
