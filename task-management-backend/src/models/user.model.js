// src/models/user.model.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    // role: 'employee' (nhân viên), 'manager' (trưởng phòng/sếp), 'admin'
    // Giữ lại để tương thích JWT và data cũ. Luôn đồng bộ với roles array.
    role: {
      type: String,
      enum: ['employee', 'manager', 'admin'],
      default: 'employee',
    },
    // roles: mảng roles, là source of truth cho phân quyền multi-role.
    // Các tổ hợp hợp lệ: ['employee'], ['manager'], ['employee','manager'], ['admin']
    // Không được gộp 'admin' với 'employee' hoặc 'manager'.
    roles: {
      type: [String],
      enum: ['employee', 'manager', 'admin'],
      default: [],
    },
    // Trạng thái tài khoản
    isActive: {
      type: Boolean,
      default: true,
    },
    // Lưu refresh token để có thể invalidate khi logout
    refreshToken: {
      type: String,
      default: null,
    },
    // OTP cho quên mật khẩu/xác thực
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;