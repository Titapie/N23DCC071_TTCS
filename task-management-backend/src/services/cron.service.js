// src/services/cron.service.js
const cron = require('node-cron');
const Task = require('../models/task.model');
const Assignment = require('../models/assignment.model');
const mailService = require('./mail.service');

// Chạy cron job mỗi ngày lúc 8:00 sáng
cron.schedule('0 8 * * *', async () => {
  console.log('Đang chạy CronJob: Kiểm tra công việc sắp hết hạn...');
  try {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(now.getHours() + 24);

    // Tìm các task đang chưa hoàn thành và hạn chót nằm trong 24h tới
    const upcomingTasks = await Task.find({
      status: { $nin: ['done', 'cancelled'] },
      dueDate: { $gte: now, $lte: tomorrow },
    }).populate('project', 'name');

    if (upcomingTasks.length === 0) {
      console.log('Không có công việc nào sắp hết hạn trong 24h tới.');
      return;
    }

    for (const task of upcomingTasks) {
      // Tìm những người được phân công làm task này
      const assignments = await Assignment.find({ task: task._id }).populate('assignee', 'firstName lastName email');

      for (const assignment of assignments) {
        const user = assignment.assignee;
        if (!user) continue;

        // Gửi Email nhắc nhở (không lưu notification vào DB)
        mailService.sendTaskReminderMail(
          user.email,
          user.firstName,
          task.name,
          task.project.name,
          task.dueDate
        ).catch(err => {
          console.error(`Lỗi gửi email nhắc nhở cho ${user.email}:`, err.message);
        });
      }
    }

    console.log(`Đã gửi email nhắc nhở cho ${upcomingTasks.length} công việc sắp hết hạn.`);
  } catch (error) {
    console.error('Lỗi khi chạy CronJob nhắc nhở công việc:', error.message);
  }
});

// Chạy cron job hàng ngày lúc 00:01 sáng để tự động chuyển trạng thái task đến ngày bắt đầu
cron.schedule('1 0 * * *', async () => {
  console.log('Đang chạy CronJob: Tự động chuyển trạng thái task đến ngày bắt đầu...');
  try {
    const { autoTransitionTasks } = require('./taskTransition.service');
    await autoTransitionTasks();
  } catch (error) {
    console.error('Lỗi khi chạy CronJob chuyển trạng thái task:', error.message);
  }
});
