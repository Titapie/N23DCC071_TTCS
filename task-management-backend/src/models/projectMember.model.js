// src/models/projectMember.model.js
// Quan hệ "Tham gia" giữa Nhân viên (User) và Dự án
const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema(
  {
    // Dự án
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    // Thành viên (nhân viên)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Vai trò trong dự án
    role: {
      type: String,
      enum: ['member', 'lead'],
      default: 'member',
    },
    // Ngày tham gia dự án
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi người chỉ tham gia 1 lần vào mỗi dự án
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);

module.exports = ProjectMember;
