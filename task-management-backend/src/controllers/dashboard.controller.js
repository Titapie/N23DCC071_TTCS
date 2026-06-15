// src/controllers/dashboard.controller.js
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');
const Assignment = require('../models/assignment.model');
const ProjectMember = require('../models/projectMember.model');
const { hasRole } = require('../middleware/auth.middleware');

/**
 * Tổng quan hệ thống
 * GET /api/dashboard/overview
 * - Admin: thống kê toàn hệ thống
 * - Manager: thống kê trong phạm vi dự án mình quản lý
 * - Employee: thống kê công việc được giao cho mình
 * - Employee + Manager: kết hợp cả hai góc nhìn
 */
exports.getOverview = async (req, res) => {
  try {
    const { mode } = req.query;

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');

    // Chặn admin truyền mode
    if (isAdmin && mode) {
      return res.status(403).json({ message: 'Admin không có chế độ dashboard nhân viên/quản lý' });
    }

    if (isAdmin) {
      // Admin xem toàn hệ thống
      const [totalUsers, totalProjects, totalTasks, tasksByStatus, tasksByPriority] =
        await Promise.all([
          User.countDocuments({ isActive: true }),
          Project.countDocuments(),
          Task.countDocuments(),
          Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
          Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
        ]);

      const statusMap = {};
      tasksByStatus.forEach((s) => { statusMap[s._id] = s.count; });

      const priorityMap = {};
      tasksByPriority.forEach((p) => { priorityMap[p._id] = p.count; });

      return res.status(200).json({
        message: 'Tổng quan hệ thống',
        data: {
          totalUsers,
          totalProjects,
          totalTasks,
          tasksByStatus: {
            todo: statusMap['todo'] || 0,
            in_progress: statusMap['in_progress'] || 0,
            done: statusMap['done'] || 0,
            pending: statusMap['pending'] || 0,
            cancelled: statusMap['cancelled'] || 0,
          },
          tasksByPriority: {
            low: priorityMap['low'] || 0,
            medium: priorityMap['medium'] || 0,
            high: priorityMap['high'] || 0,
          },
        },
      });
    }

    // Xác định target role
    let targetMode = mode;
    if (!targetMode) {
      if (isManager && isEmployee) {
        targetMode = 'manager'; // Mặc định cho tài khoản song song 2 role
      } else if (isManager) {
        targetMode = 'manager';
      } else {
        targetMode = 'employee';
      }
    }

    if (targetMode === 'manager') {
      if (!isManager) {
        return res.status(403).json({ message: 'Bạn không có vai trò quản lý' });
      }
      // Thống kê trong phạm vi dự án manager quản lý
      const myProjects = await Project.find({ createdBy: req.user._id }).select('_id');
      const projectIds = myProjects.map((p) => p._id);

      const [totalTasks, tasksByStatus, overdueTasksCount] = await Promise.all([
        Task.countDocuments({ project: { $in: projectIds } }),
        Task.aggregate([
          { $match: { project: { $in: projectIds } } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Task.countDocuments({
          project: { $in: projectIds },
          dueDate: { $lt: new Date() },
          status: { $nin: ['done', 'cancelled'] }
        })
      ]);

      const statusMap = {};
      tasksByStatus.forEach((s) => { statusMap[s._id] = s.count; });

      return res.status(200).json({
        message: 'Tổng quan dự án của tôi (Manager)',
        data: {
          totalProjects: myProjects.length,
          totalTasks,
          tasksByStatus: {
            todo: statusMap['todo'] || 0,
            in_progress: statusMap['in_progress'] || 0,
            done: statusMap['done'] || 0,
            pending: statusMap['pending'] || 0,
            cancelled: statusMap['cancelled'] || 0,
          },
          overdueTasksCount,
        },
      });
    }

    if (targetMode === 'employee') {
      if (!isEmployee) {
        return res.status(403).json({ message: 'Bạn không có vai trò nhân viên' });
      }
      // Lấy danh sách dự án mà user là member
      const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
      const projectIds = memberships.map((m) => m.project);

      // Lấy danh sách task được giao cho user
      const myAssignments = await Assignment.find({ assignee: req.user._id }).select('task');
      const assignedTaskIds = myAssignments.map((a) => a.task);

      // Thống kê công việc được giao cho nhân viên thuộc dự án tham gia
      const tasks = await Task.find({
        project: { $in: projectIds },
        _id: { $in: assignedTaskIds }
      });

      const statusMap = {};
      tasks.forEach((t) => { statusMap[t.status] = (statusMap[t.status] || 0) + 1; });

      // Tính số lượng task quá hạn (dueDate < currentDate và chưa hoàn thành/hủy)
      const now = new Date();
      const overdueTasksCount = tasks.filter((t) => {
        return t.dueDate && new Date(t.dueDate) < now && t.status !== 'done' && t.status !== 'cancelled';
      }).length;

      return res.status(200).json({
        message: 'Thống kê công việc của tôi (Employee)',
        data: {
          totalAssignedTasks: tasks.length,
          tasksByStatus: {
            todo: statusMap['todo'] || 0,
            in_progress: statusMap['in_progress'] || 0,
            done: statusMap['done'] || 0,
            pending: statusMap['pending'] || 0,
            cancelled: statusMap['cancelled'] || 0,
          },
          overdueTasksCount,
        },
      });
    }

    return res.status(400).json({ message: 'Chế độ dashboard không hợp lệ' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Thống kê dự án của user
 * GET /api/dashboard/my-projects
 */
exports.getMyProjects = async (req, res) => {
  try {
    const { mode } = req.query;

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');

    // Chặn admin truyền mode
    if (isAdmin && mode) {
      return res.status(403).json({ message: 'Admin không có chế độ dashboard nhân viên/quản lý' });
    }

    let projects;

    if (isAdmin) {
      // Admin xem tất cả
      projects = await Project.find()
        .select('name progress startDate endDate createdBy')
        .sort({ createdAt: -1 });
      projects = projects.map(p => ({ ...p.toObject(), userRole: 'admin' }));
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
        // Chỉ dự án do user quản lý
        projects = await Project.find({ createdBy: req.user._id })
          .select('name progress startDate endDate createdBy')
          .sort({ createdAt: -1 });
        projects = projects.map(p => ({ ...p.toObject(), userRole: 'manager' }));
      } else if (targetMode === 'employee') {
        if (!isEmployee) return res.status(403).json({ message: 'Bạn không có vai trò nhân viên' });
        // Dự án user là thành viên hoặc được giao task
        const [memberships, myAssignments] = await Promise.all([
          ProjectMember.find({ user: req.user._id }).select('project'),
          Assignment.find({ assignee: req.user._id }).populate({
            path: 'task',
            select: 'project'
          })
        ]);
        const memberProjectIds = memberships.map((m) => m.project.toString());
        const assignedProjectIds = myAssignments
          .map(a => a.task?.project?.toString())
          .filter(Boolean);
        const projectIds = Array.from(new Set([...memberProjectIds, ...assignedProjectIds]));

        projects = await Project.find({ _id: { $in: projectIds } })
          .select('name progress startDate endDate createdBy')
          .sort({ createdAt: -1 });
        projects = projects.map(p => ({ ...p.toObject(), userRole: 'employee' }));
      } else {
        return res.status(400).json({ message: 'Chế độ không hợp lệ' });
      }
    }

    // Đếm số task của mỗi project
    const result = await Promise.all(
      projects.map(async (project) => {
        const [taskCount, doneTasks] = await Promise.all([
          Task.countDocuments({ project: project._id }),
          Task.countDocuments({ project: project._id, status: 'done' }),
        ]);
        return { ...project, taskCount, doneTasks };
      })
    );

    res.status(200).json({ message: 'Dự án của tôi', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Thống kê công việc được giao cho nhân viên đang đăng nhập
 * GET /api/dashboard/my-tasks
 */
exports.getMyTasks = async (req, res) => {
  try {
    const { mode } = req.query;

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');

    // Chặn admin truyền mode
    if (isAdmin && mode) {
      return res.status(403).json({ message: 'Admin không có chế độ dashboard nhân viên/quản lý' });
    }

    let tasks = [];
    if (isAdmin) {
      // Admin lấy tất cả
      tasks = await Task.find()
        .populate('project', 'name')
        .sort({ createdAt: -1 });
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
        // Lấy tasks trong dự án do manager tạo
        const myProjects = await Project.find({ createdBy: req.user._id }).select('_id');
        const projectIds = myProjects.map((p) => p._id);
        tasks = await Task.find({ project: { $in: projectIds } })
          .populate('project', 'name')
          .sort({ createdAt: -1 });
      } else if (targetMode === 'employee') {
        if (!isEmployee) return res.status(403).json({ message: 'Bạn không có vai trò nhân viên' });
        // Lấy tasks được giao cho employee
        const assignments = await Assignment.find({ assignee: req.user._id })
          .populate({
            path: 'task',
            select: 'name status priority dueDate project',
            populate: { path: 'project', select: 'name' },
          })
          .sort({ assignedAt: -1 });
        tasks = assignments.map((a) => a.task).filter(Boolean);
      } else {
        return res.status(400).json({ message: 'Chế độ không hợp lệ' });
      }
    }

    const taskIds = tasks.map((t) => t._id);
    const allAssignments = await Assignment.find({ task: { $in: taskIds } }).populate(
      'assignee',
      'firstName lastName email avatar'
    );

    const tasksWithMembers = tasks.map((t) => {
      const taskObj = t.toObject();
      taskObj.members = allAssignments
        .filter((a) => a.task.toString() === taskObj._id.toString())
        .map((a) => a.assignee);
      return taskObj;
    });

    const statusMap = {};
    tasksWithMembers.forEach((t) => {
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });

    res.status(200).json({
      message: 'Công việc của tôi',
      data: {
        tasks: tasksWithMembers,
        summary: {
          total: tasksWithMembers.length,
          ...statusMap,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};