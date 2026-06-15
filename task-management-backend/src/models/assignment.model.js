// src/models/assignment.model.js
// Quan hệ "Phân công": Trưởng phòng phân công Công việc cho Nhân viên
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    // Công việc được phân công
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    // Nhân viên được giao việc
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Người giao việc (trưởng phòng/sếp)
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Ngày giao việc
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi nhân viên chỉ được phân công 1 lần vào 1 công việc
assignmentSchema.index({ task: 1, assignee: 1 }, { unique: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
