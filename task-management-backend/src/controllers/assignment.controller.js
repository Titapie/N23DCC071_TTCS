// src/controllers/assignment.controller.js
const Assignment = require('../models/assignment.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const ProjectMember = require('../models/projectMember.model');
const mailService = require('../services/mail.service');
const { hasRole } = require('../middleware/auth.middleware');

/**
 * Tạo phân công (giao việc)
 * POST /api/assignments
 * Chỉ Manager của dự án chứa task, hoặc Admin.
 */
exports.createAssignment = async (req, res) => {
  const { taskId, assigneeId } = req.body;

  try {
    if (!taskId || !assigneeId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp taskId và assigneeId' });
    }

    const [task, assignee] = await Promise.all([
      Task.findById(taskId).populate('project', 'name createdBy'),
      User.findById(assigneeId),
    ]);

    if (!task) return res.status(404).json({ message: 'Công việc không tồn tại' });
    if (!assignee) return res.status(404).json({ message: 'Nhân viên không tồn tại' });

    // Kiểm tra quyền: chỉ manager của dự án hoặc admin được giao việc
    if (
      req.user.role !== 'admin' &&
      task.project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền giao việc trong dự án này' });
    }

    // (Đã xóa kiểm tra ProjectMember để cho phép phân công bất kỳ employee nào)

    const existing = await Assignment.findOne({ task: taskId, assignee: assigneeId });
    if (existing) {
      return res.status(409).json({ message: 'Nhân viên đã được phân công vào công việc này' });
    }

    const assignment = await Assignment.create({
      task: taskId,
      assignee: assigneeId,
      assignedBy: req.user._id,
    });

    // Tự động thêm assignee vào ProjectMember nếu chưa có
    const memberExists = await ProjectMember.findOne({
      project: task.project._id,
      user: assigneeId,
    });
    if (!memberExists) {
      await ProjectMember.create({
        project: task.project._id,
        user: assigneeId,
        role: 'member',
      });
    }

    const populated = await assignment
      .populate('task', 'name status dueDate')
      .then((a) => a.populate('assignee', 'firstName lastName email'))
      .then((a) => a.populate('assignedBy', 'firstName lastName'));

    // Gửi email thông báo cho nhân viên (không tạo notification trong DB)
    const assignedByName = `${req.user.firstName} ${req.user.lastName}`;
    mailService.sendTaskAssignmentMail(
      assignee.email,
      assignee.firstName,
      task.name,
      task.project.name,
      assignedByName,
      task.dueDate || null
    ).catch(err => {
      console.error(`Lỗi gửi email giao việc cho ${assignee.email}:`, err.message);
    });

    res.status(201).json({ message: 'Phân công thành công', data: populated });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Xóa phân công
 * DELETE /api/assignments/:id
 * Chỉ Manager của dự án hoặc Admin.
 */
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate({
      path: 'task',
      populate: { path: 'project', select: 'createdBy' },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Bản ghi phân công không tồn tại' });
    }

    // Kiểm tra quyền
    if (
      req.user.role !== 'admin' &&
      assignment.task.project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy phân công này' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Đã hủy phân công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy danh sách phân công theo task
 * GET /api/assignments?taskId=...
 * Admin/Manager xem tất cả.
 * Employee chỉ xem assignment của mình.
 */
exports.getAssignmentsByTask = async (req, res) => {
  const { taskId } = req.query;
  try {
    let filter = taskId ? { task: taskId } : {};

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');

    if (!isAdmin) {
      // Kiểm tra nếu user là manager của project chứa task
      let isProjectManager = false;
      if (isManager && taskId) {
        const task = await Task.findById(taskId).populate('project', 'createdBy');
        if (task && task.project.createdBy.toString() === req.user._id.toString()) {
          isProjectManager = true;
        }
      }

      // Nếu không phải manager của project → chỉ xem assignment của mình
      if (!isProjectManager && isEmployee) {
        filter.assignee = req.user._id;
      } else if (!isProjectManager && !isEmployee) {
        // Manager của project khác: chỉ xem của mình
        filter.assignee = req.user._id;
      }
    }

    const assignments = await Assignment.find(filter)
      .populate('task', 'name status')
      .populate('assignee', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName');

    res.status(200).json({ message: 'Danh sách phân công', data: assignments });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy danh sách công việc được giao cho người dùng đang đăng nhập
 * GET /api/assignments/my-tasks
 */
exports.getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ assignee: req.user._id })
      .populate({
        path: 'task',
        populate: { path: 'project', select: 'name' },
      })
      .sort({ assignedAt: -1 });

    res.status(200).json({ message: 'Công việc được giao cho tôi', data: assignments });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};
