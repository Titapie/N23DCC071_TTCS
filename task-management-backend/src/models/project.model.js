// src/models/project.model.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    // Tên dự án
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Mô tả dự án
    description: {
      type: String,
      default: '',
    },
    // Ngày bắt đầu
    startDate: {
      type: Date,
      required: true,
    },
    // Ngày kết thúc
    endDate: {
      type: Date,
      required: true,
    },
    // Tiến độ dự án (%)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Trưởng phòng/sếp tạo dự án
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;