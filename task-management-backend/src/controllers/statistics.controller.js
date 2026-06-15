// src/controllers/statistics.controller.js
const Task = require('../models/task.model');
const Assignment = require('../models/assignment.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');

/**
 * Thống kê công việc theo trạng thái
 * GET /api/statistics/tasks/status
 */
exports.getTaskStatusStats = async (req, res) => {
  try {
    const { projectId, mode } = req.query;
    const { hasRole } = require('../middleware/auth.middleware');

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');

    // Chặn admin truyền mode
    if (isAdmin && mode) {
      return res.status(403).json({ message: 'Admin không có chế độ dashboard nhân viên/quản lý' });
    }

    let match = {};
    if (projectId) {
      match.project = require('mongoose').Types.ObjectId(projectId);
    }

    if (!isAdmin) {
      let targetMode = mode;
      if (!targetMode) {
        if (isManager && isEmployee) {
          targetMode = 'manager';
        } else if (isManager) {
          targetMode = 'manager';
        } else {
          targetMode = 'employee';
        }
      }

      if (targetMode === 'manager') {
        if (!isManager) return res.status(403).json({ message: 'Bạn không có vai trò quản lý' });
        // Chỉ lấy các projects do manager tạo
        const Project = require('../models/project.model');
        const myProjects = await Project.find({ createdBy: req.user._id }).select('_id');
        const projectIds = myProjects.map(p => p._id);
        
        if (projectId) {
          const isMyProject = projectIds.some(id => id.toString() === projectId);
          if (!isMyProject) {
            return res.status(403).json({ message: 'Bạn không quản lý dự án này' });
          }
        } else {
          match.project = { $in: projectIds };
        }
      } else if (targetMode === 'employee') {
        if (!isEmployee) return res.status(403).json({ message: 'Bạn không có vai trò nhân viên' });
        // Lấy danh sách dự án mà user là member
        const ProjectMember = require('../models/projectMember.model');
        const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
        const projectIds = memberships.map((m) => m.project);

        // Lấy danh sách task được giao cho user
        const Assignment = require('../models/assignment.model');
        const myAssignments = await Assignment.find({ assignee: req.user._id }).select('task');
        const assignedTaskIds = myAssignments.map((a) => a.task);

        if (projectId) {
          const isMember = projectIds.some((id) => id.toString() === projectId);
          if (!isMember) {
            return res.status(403).json({ message: 'Bạn không phải là thành viên của dự án này' });
          }
        } else {
          match.project = { $in: projectIds };
        }
        match._id = { $in: assignedTaskIds };
      } else {
        return res.status(400).json({ message: 'Chế độ không hợp lệ' });
      }
    }

    const stats = await Task.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = {
      todo: 0,
      in_progress: 0,
      done: 0,
      pending: 0,
      cancelled: 0,
      total: 0,
    };

    stats.forEach((s) => {
      if (result.hasOwnProperty(s._id)) {
        result[s._id] = s.count;
      }
      result.total += s.count;
    });

    res.status(200).json({ message: 'Thống kê công việc theo trạng thái', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Thống kê công việc của từng nhân viên
 * GET /api/statistics/tasks/user/:userId
 */
exports.getUserTaskStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('firstName lastName email');
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    const assignments = await Assignment.find({ assignee: userId }).populate('task', 'status priority');

    const stats = {
      total: assignments.length,
      todo: 0,
      in_progress: 0,
      done: 0,
      pending: 0,
      cancelled: 0,
    };

    assignments.forEach((a) => {
      if (a.task && stats.hasOwnProperty(a.task.status)) {
        stats[a.task.status]++;
      }
    });

    res.status(200).json({
      message: `Thống kê công việc của ${user.firstName} ${user.lastName}`,
      data: { user, stats },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Thống kê tổng quan công việc (theo project hoặc toàn hệ thống)
 * GET /api/statistics/tasks
 */
exports.getTaskStatistics = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { project: projectId } : {};

    const [total, byStatus, byPriority] = await Promise.all([
      Task.countDocuments(filter),
      Task.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    const statusResult = {};
    byStatus.forEach((s) => { statusResult[s._id] = s.count; });

    const priorityResult = {};
    byPriority.forEach((p) => { priorityResult[p._id] = p.count; });

    res.status(200).json({
      message: 'Thống kê công việc',
      data: {
        total,
        byStatus: statusResult,
        byPriority: priorityResult,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Thống kê tiến độ dự án
 * GET /api/statistics/projects
 */
exports.getProjectStats = async (req, res) => {
  try {
    const { mode } = req.query;
    const { hasRole } = require('../middleware/auth.middleware');

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');

    // Chặn admin truyền mode
    if (isAdmin && mode) {
      return res.status(403).json({ message: 'Admin không có chế độ dashboard nhân viên/quản lý' });
    }

    let projects = [];
    if (isAdmin) {
      projects = await Project.find().select('name progress startDate endDate createdBy');
    } else {
      let targetMode = mode;
      if (!targetMode) {
        if (isManager && isEmployee) {
          targetMode = 'manager';
        } else if (isManager) {
          targetMode = 'manager';
        } else {
          targetMode = 'employee';
        }
      }

      if (targetMode === 'manager') {
        if (!isManager) return res.status(403).json({ message: 'Bạn không có vai trò quản lý' });
        projects = await Project.find({ createdBy: req.user._id }).select('name progress startDate endDate createdBy');
      } else if (targetMode === 'employee') {
        if (!isEmployee) return res.status(403).json({ message: 'Bạn không có vai trò nhân viên' });
        const ProjectMember = require('../models/projectMember.model');
        const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
        const projectIds = memberships.map(m => m.project);
        projects = await Project.find({ _id: { $in: projectIds } }).select('name progress startDate endDate createdBy');
      } else {
        return res.status(400).json({ message: 'Chế độ không hợp lệ' });
      }
    }

    const result = await Promise.all(
      projects.map(async (project) => {
        const [totalTasks, doneTasks] = await Promise.all([
          Task.countDocuments({ project: project._id }),
          Task.countDocuments({ project: project._id, status: 'done' }),
        ]);
        return {
          ...project.toObject(),
          totalTasks,
          doneTasks,
          completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        };
      })
    );

    res.status(200).json({ message: 'Thống kê dự án', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};
