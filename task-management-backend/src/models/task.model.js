// src/models/task.model.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // Tên công việc
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Mô tả
    description: {
      type: String,
      default: '',
    },
    // Trạng thái công việc
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done', 'pending', 'cancelled'],
      default: 'todo',
    },
    // Mức độ ưu tiên
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    // Ngày bắt đầu
    startDate: {
      type: Date,
    },
    // Hạn hoàn thành
    dueDate: {
      type: Date,
    },
    // Dự án chứa công việc (quan hệ Gồm: 1 dự án - N công việc)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    // Trưởng phòng/sếp tạo công việc
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Công việc cha (quan hệ Phụ thuộc M-N tự quan hệ)
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;