// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const ProjectMember = require('../models/projectMember.model');

/**
 * Helper: Kiểm tra user có role nào đó không.
 * Ưu tiên kiểm tra `roles` array (multi-role), fallback sang `role` string (cũ).
 * @param {Object} user - User object từ DB
 * @param {string} roleName - Role cần kiểm tra
 * @returns {boolean}
 */
const hasRole = (user, roleName) => {
  if (!user) return false;
  if (user.roles && user.roles.length > 0) return user.roles.includes(roleName);
  return user.role === roleName;
};
exports.hasRole = hasRole;

/**
 * Xác thực JWT token
 */
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ' });
  }
};

/**
 * Kiểm tra quyền admin (chỉ admin)
 */
exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền thực hiện thao tác này' });
  }
  next();
};

/**
 * Kiểm tra quyền manager hoặc admin.
 * Hỗ trợ multi-role: user có roles=['employee','manager'] cũng được phép.
 */
exports.requireManager = (req, res, next) => {
  if (!hasRole(req.user, 'manager') && !hasRole(req.user, 'admin')) {
    return res.status(403).json({ message: 'Chỉ trưởng phòng hoặc admin mới có quyền thực hiện thao tác này' });
  }
  next();
};

/**
 * Phân quyền linh hoạt theo danh sách roles.
 * Hỗ trợ multi-role: user thỏa bất kỳ 1 role trong danh sách là được.
 * Ví dụ: authorizeRoles('admin', 'manager')
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const permitted = roles.some(r => hasRole(req.user, r));
    if (!permitted) {
      return res.status(403).json({
        message: `Chỉ [${roles.join(', ')}] mới có quyền thực hiện thao tác này`,
      });
    }
    next();
  };
};

/**
 * Kiểm tra user là manager của project (req.params.id là projectId).
 * Admin luôn được phép.
 * Manager chỉ được phép nếu project.createdBy == req.user._id.
 */
exports.checkProjectManager = async (req, res, next) => {
  try {
    // Admin bypass tất cả
    if (req.user.role === 'admin') return next();

    // Lấy projectId từ params hoặc body
    const projectId = req.params.id || req.params.projectId || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'Thiếu projectId' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền quản lý dự án này' });
    }

    // Gắn project vào req để controller dùng lại, tránh query 2 lần
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Kiểm tra user là thành viên hoặc manager của project.
 * Admin luôn được phép.
 * Manager của project được phép (kiểm tra qua createdBy, hỗ trợ multi-role).
 * Employee chỉ được phép nếu có trong danh sách ProjectMember.
 */
exports.checkProjectMember = async (req, res, next) => {
  try {
    // Admin bypass tất cả
    if (req.user.role === 'admin') return next();

    const projectId = req.params.id || req.params.projectId || req.query.project || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'Thiếu projectId' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    // Manager của project được phép (dùng hasRole hỗ trợ multi-role)
    if (
      hasRole(req.user, 'manager') &&
      project.createdBy.toString() === req.user._id.toString()
    ) {
      req.project = project;
      return next();
    }

    // Kiểm tra là thành viên của project (employee hoặc manager được thêm vào)
    const membership = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
    });

    if (!membership) {
      return res.status(403).json({ message: 'Bạn không phải thành viên của dự án này' });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};
