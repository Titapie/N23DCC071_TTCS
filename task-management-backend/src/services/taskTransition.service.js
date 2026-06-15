const Task = require('../models/task.model');

/**
 * Tự động chuyển các task ở trạng thái "Chưa bắt đầu" (todo) sang "Đang làm" (in_progress)
 * nếu ngày bắt đầu (startDate) <= ngày hiện tại (so sánh theo ngày, không phân biệt giờ phút).
 */
const autoTransitionTasks = async () => {
  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Tìm các task thỏa mãn điều kiện: status là "todo" và startDate <= ngày hôm nay
    const tasksToTransition = await Task.find({
      status: 'todo',
      startDate: { $lte: todayEnd }
    }).select('_id name startDate');

    if (tasksToTransition.length === 0) {
      return { success: true, count: 0 };
    }

    const taskIds = tasksToTransition.map(t => t._id);
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: { status: 'in_progress' } }
    );

    for (const task of tasksToTransition) {
      const formattedDate = task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : 'N/A';
      console.log(`[System] Tự động chuyển trạng thái task "${task.name}" (${task._id}) từ "Chưa bắt đầu" -> "Đang làm" (startDate: ${formattedDate})`);
    }

    return { success: true, count: tasksToTransition.length };
  } catch (error) {
    console.error('Lỗi khi tự động chuyển trạng thái task:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  autoTransitionTasks
};
