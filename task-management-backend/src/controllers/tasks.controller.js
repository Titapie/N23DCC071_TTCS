// src/controllers/tasks.controller.js
const Task = require('../models/task.model');
const Assignment = require('../models/assignment.model');
const Project = require('../models/project.model');
const ProjectMember = require('../models/projectMember.model');
const User = require('../models/user.model');
const mailService = require('../services/mail.service');
const { hasRole } = require('../middleware/auth.middleware');

// ============================================================
// Helper: Map status enum → tên tiếng Việt (dùng cho email)
// ============================================================
const STATUS_VI = {
  todo: 'Chưa bắt đầu',
  in_progress: 'Đang làm',
  pending: 'Đang chờ',
  done: 'Đã hoàn thành',
  cancelled: 'Đã hủy',
};

// ============================================================
// Helper: Lấy tất cả assignees của task (populate email, name)
// ============================================================
const getTaskAssignees = async (taskId) => {
  const assignments = await Assignment.find({ task: taskId }).populate(
    'assignee',
    'firstName lastName email'
  );
  return assignments.map((a) => a.assignee).filter(Boolean);
};

// ============================================================
// Helper: Gửi email tới tất cả assignees (không throw nếu lỗi)
// ============================================================
const notifyAssigneesStatusChange = (assignees, taskName, projectName, newStatusVI, managerName) => {
  for (const user of assignees) {
    mailService
      .sendTaskStatusChangedMail(
        user.email,
        user.firstName,
        taskName,
        projectName,
        newStatusVI,
        managerName
      )
      .catch((err) => {
        console.error(`Lỗi gửi email đổi trạng thái cho ${user.email}:`, err.message);
      });
  }
};

const notifyAssigneesCancel = (assignees, taskName, projectName, managerName) => {
  for (const user of assignees) {
    mailService
      .sendTaskCancelledMail(user.email, user.firstName, taskName, projectName, managerName)
      .catch((err) => {
        console.error(`Lỗi gửi email hủy task cho ${user.email}:`, err.message);
      });
  }
};

// ============================================================
// VALID TRANSITIONS — luật chuyển trạng thái
// ============================================================
// Employee: chỉ được in_progress → done
const EMPLOYEE_ALLOWED_TRANSITIONS = {
  in_progress: ['done'],
};

// Manager/Admin: được phép mọi transition tự do
const MANAGER_ALLOWED_TRANSITIONS = {
  todo: ['todo', 'in_progress', 'pending', 'done', 'cancelled'],
  in_progress: ['todo', 'in_progress', 'pending', 'done', 'cancelled'],
  pending: ['todo', 'in_progress', 'pending', 'done', 'cancelled'],
  done: ['todo', 'in_progress', 'pending', 'done', 'cancelled'],
  cancelled: ['todo', 'in_progress', 'pending', 'done', 'cancelled'],
};

/**
 * Tạo công việc mới
 * POST /api/tasks
 * Chỉ Manager của dự án hoặc Admin.
 */
exports.createTask = async (req, res) => {
  const { name, description, priority, startDate, dueDate, project, parentTask } = req.body;

  try {
    if (!name || !project) {
      return res.status(400).json({ message: 'Tên công việc và dự án không được để trống' });
    }

    const existingProject = await Project.findById(project);
    if (!existingProject) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    // Kiểm tra quyền: chỉ manager của dự án hoặc admin
    if (
      !hasRole(req.user, 'admin') &&
      existingProject.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền tạo công việc trong dự án này' });
    }

    const getMidnight = (dateVal) => {
      const d = new Date(dateVal);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    // Validate deadline task vs project
    if (dueDate && existingProject.endDate) {
      const taskDue = getMidnight(dueDate);
      const projEnd = getMidnight(existingProject.endDate);
      if (taskDue > projEnd) {
        return res.status(400).json({
          message: `Deadline công việc (${taskDue.toLocaleDateString('vi-VN')}) không được vượt quá deadline dự án (${projEnd.toLocaleDateString('vi-VN')}).`,
        });
      }
    }

    // Validate startDate vs project.startDate
    if (startDate && existingProject.startDate) {
      const taskStart = getMidnight(startDate);
      const projStart = getMidnight(existingProject.startDate);
      if (taskStart < projStart) {
        return res.status(400).json({
          message: `Ngày bắt đầu công việc không được trước ngày bắt đầu dự án (${projStart.toLocaleDateString('vi-VN')}).`,
        });
      }
    }

    if (startDate && dueDate) {
      const taskStart = getMidnight(startDate);
      const taskDue = getMidnight(dueDate);
      if (taskStart > taskDue) {
        return res.status(400).json({ message: 'Ngày bắt đầu công việc không được sau deadline.' });
      }
    }

    let calculatedStatus = 'todo';
    if (startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let start;
      if (typeof startDate === 'string' && startDate.includes('-')) {
        const parts = startDate.slice(0, 10).split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          start = new Date(year, month, day);
        }
      }
      if (!start) {
        start = new Date(startDate);
      }
      start.setHours(0, 0, 0, 0);

      calculatedStatus = start <= today ? 'in_progress' : 'todo';
    }

    const task = await Task.create({
      name,
      description,
      priority: priority || 'medium',
      startDate,
      dueDate,
      project,
      createdBy: req.user._id,
      parentTask: parentTask || null,
      status: calculatedStatus,
    });

    res.status(201).json({ message: 'Công việc đã được tạo thành công', data: task });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy danh sách công việc (có thể filter theo project)
 * GET /api/tasks
 * - Admin: xem tất cả
 * - Manager: xem task trong các dự án mình quản lý
 * - Employee: xem task được giao + task trong dự án mình tham gia
 * - Employee + Manager: UNION của cả hai
 */
exports.getTasks = async (req, res) => {
  try {
    const { project, status, priority, page = 1, limit = 20, mode, manager, assignee, myTasks } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');

    // Chặn admin truyền mode
    if (isAdmin && mode) {
      return res.status(403).json({ message: 'Admin không có chế độ dashboard nhân viên/quản lý' });
    }

    let targetMode = mode;
    if (targetMode) {
      if (targetMode === 'manager' && !isManager) {
        return res.status(403).json({ message: 'Bạn không có vai trò quản lý' });
      }
      if (targetMode === 'employee' && !isEmployee) {
        return res.status(403).json({ message: 'Bạn không có vai trò nhân viên' });
      }
    }

    if (isAdmin) {
      // Admin xem tất cả
      if (project) filter.project = project;
    } else {
      const activeMode = targetMode || (isManager && isEmployee ? 'union' : (isManager ? 'manager' : 'employee'));

      if (activeMode === 'union') {
        // Đa role: UNION task của manager + task của employee
        const [myProjects, memberships, myAssignments] = await Promise.all([
          Project.find({ createdBy: req.user._id }).select('_id'),
          ProjectMember.find({ user: req.user._id }).select('project'),
          Assignment.find({ assignee: req.user._id }).select('task'),
        ]);

        const managerProjectIds = myProjects.map(p => p._id);
        const employeeProjectIds = memberships.map(m => m.project);
        const assignedTaskIds = myAssignments.map(a => a.task);

        // Gộp tất cả điều kiện bằng $or
        const unionFilter = {
          $or: [
            { project: { $in: managerProjectIds } },
            { project: { $in: employeeProjectIds } },
            { project: { $in: employeeProjectIds }, _id: { $in: assignedTaskIds } },
          ],
        };

        if (project) {
          // Nếu query theo project cụ thể, phải vừa khớp project vừa trong quyền
          filter.$and = [{ project }, unionFilter];
        } else {
          filter.$or = unionFilter.$or;
        }
      } else if (activeMode === 'manager') {
        // Chỉ manager: task trong dự án mình quản lý
        const myProjects = await Project.find({ createdBy: req.user._id }).select('_id');
        const projectIds = myProjects.map(p => p._id);
        filter.project = project
          ? (projectIds.some(id => id.toString() === project) ? project : { $in: [] })
          : { $in: projectIds };
      } else {
        // Chỉ employee:
        const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
        const projectIds = memberships.map(m => m.project);

        if (myTasks === 'true') {
          // Lọc "My Task": ProjectMember AND Assignment/assignee
          const myAssignments = await Assignment.find({ assignee: req.user._id }).select('task');
          const assignedTaskIds = myAssignments.map(a => a.task);

          const employeeFilter = {
            project: { $in: projectIds },
            _id: { $in: assignedTaskIds }
          };

          if (project) {
            filter.$and = [{ project }, employeeFilter];
          } else {
            filter.project = { $in: projectIds };
            filter._id = { $in: assignedTaskIds };
          }
        } else {
          // Mặc định: Chỉ hiển thị task thuộc dự án tham gia (ProjectMember)
          const employeeFilter = {
            project: { $in: projectIds }
          };

          if (project) {
            filter.$and = [{ project }, employeeFilter];
          } else {
            filter.project = { $in: projectIds };
          }
        }
      }
    }

    if (manager) {
      const managerProjects = await Project.find({ createdBy: manager }).select('_id');
      const managerProjectIds = managerProjects.map(p => p._id);
      if (filter.project) {
        if (filter.project.$in) {
          const intersected = filter.project.$in.filter(id => managerProjectIds.some(mid => mid.toString() === id.toString()));
          filter.project = { $in: intersected };
        } else {
          const isMatched = managerProjectIds.some(id => id.toString() === filter.project.toString());
          filter.project = isMatched ? filter.project : { $in: [] };
        }
      } else {
        filter.project = { $in: managerProjectIds };
      }
    }

    if (assignee) {
      const userAssignments = await Assignment.find({ assignee }).select('task');
      const assignedTaskIds = userAssignments.map(a => a.task);
      if (filter._id) {
        if (filter._id.$in) {
          const intersected = filter._id.$in.filter(id => assignedTaskIds.some(aid => aid.toString() === id.toString()));
          filter._id = { $in: intersected };
        } else {
          const isMatched = assignedTaskIds.some(id => id.toString() === filter._id.toString());
          filter._id = isMatched ? filter._id : { $in: [] };
        }
      } else {
        filter._id = { $in: assignedTaskIds };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate({
          path: 'project',
          select: 'name endDate startDate createdBy',
          populate: {
            path: 'createdBy',
            select: 'firstName lastName email'
          }
        })
        .populate('createdBy', 'firstName lastName')
        .populate('parentTask', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    // Fetch assignments to attach members to each task
    const taskIds = tasks.map((t) => t._id);
    const assignments = await Assignment.find({ task: { $in: taskIds } }).populate(
      'assignee',
      'firstName lastName email'
    );

    const myIdStr = req.user._id.toString();
    const tasksWithMembers = tasks.map((t) => {
      const taskObj = t.toObject();
      taskObj.members = assignments
        .filter((a) => a.task.toString() === taskObj._id.toString())
        .map((a) => a.assignee);

      // Gắn userRole cho task
      if (isAdmin) {
        taskObj.userRole = 'admin';
      } else {
        const projectCreatedBy = taskObj.project?.createdBy;
        const projectCreatorId = projectCreatedBy && typeof projectCreatedBy === 'object'
          ? (projectCreatedBy._id || projectCreatedBy.id)
          : projectCreatedBy;
        const isTaskProjectManager = projectCreatorId?.toString() === myIdStr;
        const isAssigned = taskObj.members.some(m => m && m._id?.toString() === myIdStr);
        if (isTaskProjectManager && isAssigned) taskObj.userRole = 'both';
        else if (isTaskProjectManager) taskObj.userRole = 'manager';
        else taskObj.userRole = 'employee';
      }

      return taskObj;
    });

    res.status(200).json({
      message: 'Danh sách công việc',
      data: tasksWithMembers,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy thông tin công việc theo ID
 * GET /api/tasks/:id
 * Hỗ trợ đa role: thỏa 1 điều kiện là được xem.
 */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name createdBy startDate endDate')
      .populate('createdBy', 'firstName lastName email')
      .populate('parentTask', 'name status');

    if (!task) {
      return res.status(404).json({ message: 'Công việc không tồn tại' });
    }

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');
    const myId = req.user._id.toString();

    // Admin bypass
    if (isAdmin) {
      return res.status(200).json({ message: 'Thông tin công việc', data: task });
    }

    // Manager của project: OK
    if (isManager && task.project.createdBy.toString() === myId) {
      return res.status(200).json({ message: 'Thông tin công việc', data: task });
    }

    // Employee: kiểm tra membership hoặc assignment
    if (isEmployee) {
      const [membership, assignment] = await Promise.all([
        ProjectMember.findOne({ project: task.project._id, user: req.user._id }),
        Assignment.findOne({ task: task._id, assignee: req.user._id }),
      ]);
      if (membership || assignment) {
        return res.status(200).json({ message: 'Thông tin công việc', data: task });
      }
    }

    return res.status(403).json({ message: 'Bạn không có quyền xem công việc này' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Cập nhật công việc (tên, mô tả, ưu tiên, ngày)
 * PUT /api/tasks/:id
 * Chỉ Manager của dự án hoặc Admin.
 * Nếu dueDate thay đổi → gửi email cho assignees.
 */
exports.updateTask = async (req, res) => {
  try {
    const { name, description, status, priority, startDate, dueDate, parentTask } = req.body;
    const task = await Task.findById(req.params.id).populate('project', 'createdBy endDate startDate name');
    if (!task) {
      return res.status(404).json({ message: 'Công việc không tồn tại' });
    }

    // Kiểm tra quyền
    if (
      !hasRole(req.user, 'admin') &&
      task.project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa công việc này' });
    }

    const effectiveDueDate = dueDate !== undefined ? new Date(dueDate) : task.dueDate;
    const effectiveStartDate = startDate !== undefined ? new Date(startDate) : task.startDate;

    // Validate startDate vs dueDate
    if (effectiveStartDate && effectiveDueDate && effectiveStartDate > effectiveDueDate) {
      return res.status(400).json({ message: 'Ngày bắt đầu công việc không được sau deadline.' });
    }

    // Validate dueDate vs project.endDate
    if (effectiveDueDate && task.project.endDate) {
      const projEnd = new Date(task.project.endDate);
      if (effectiveDueDate > projEnd) {
        return res.status(400).json({
          message: `Deadline công việc (${effectiveDueDate.toLocaleDateString('vi-VN')}) không được vượt quá deadline dự án (${projEnd.toLocaleDateString('vi-VN')}).`,
          code: 'TASK_DEADLINE_EXCEEDS_PROJECT',
          projectEndDate: task.project.endDate,
        });
      }
    }

    // Validate startDate vs project.startDate
    if (effectiveStartDate && task.project.startDate) {
      const projStart = new Date(task.project.startDate);
      if (effectiveStartDate < projStart) {
        return res.status(400).json({
          message: `Ngày bắt đầu công việc không được trước ngày bắt đầu dự án (${projStart.toLocaleDateString('vi-VN')}).`,
        });
      }
    }

    const oldDueDate = task.dueDate;
    const dueDateChanged =
      dueDate !== undefined &&
      (!oldDueDate || new Date(dueDate).toDateString() !== new Date(oldDueDate).toDateString());

    if (name !== undefined) task.name = name;
    if (description !== undefined) task.description = description;

    // Validate status nếu có truyền vào
    if (status !== undefined) {
      const validStatuses = ['todo', 'in_progress', 'done', 'pending', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}`,
        });
      }
    }

    const finalStatus = status !== undefined ? status : task.status;
    const finalStartDate = startDate !== undefined ? startDate : task.startDate;

    if (priority !== undefined) task.priority = priority;
    if (startDate !== undefined) task.startDate = startDate;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (parentTask !== undefined) task.parentTask = parentTask;

    // Tự động chuyển sang "Đang làm" nếu ngày bắt đầu <= hôm nay và trạng thái là "Chưa bắt đầu"
    if (finalStatus === 'todo' && finalStartDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(finalStartDate);
      start.setHours(0, 0, 0, 0);

      if (start <= today) {
        task.status = 'in_progress';
        console.log(`[System] Tự động chuyển trạng thái task "${task.name}" (${task._id}) sang "Đang làm" do cập nhật startDate <= hôm nay`);
      } else if (status !== undefined) {
        task.status = status;
      }
    } else if (status !== undefined) {
      task.status = status;
    }

    await task.save();

    // Gửi email cho assignees nếu dueDate thay đổi
    if (dueDateChanged) {
      const assignees = await getTaskAssignees(task._id);
      for (const user of assignees) {
        mailService
          .sendTaskDeadlineChangedMail(
            user.email,
            user.firstName,
            task.name,
            task.project.name,
            oldDueDate,
            task.dueDate
          )
          .catch((err) => {
            console.error(`Lỗi gửi email deadline task cho ${user.email}:`, err.message);
          });
      }
    }

    res.status(200).json({ message: 'Công việc đã được cập nhật', data: task });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Cập nhật trạng thái công việc
 * PATCH /api/tasks/:id/status
 * - Manager của dự án: cập nhật mọi task trong dự án mình + gửi email
 * - Employee: chỉ cập nhật task được giao cho mình, chỉ in_progress → done
 * - Đa role (employee+manager): dùng quyền cao nhất phù hợp với task
 * - Admin: toàn quyền + gửi email
 * Body: { status, startDate?, dueDate? }
 */
exports.updateTaskStatus = async (req, res) => {
  const { status, startDate, dueDate } = req.body;

  try {
    if (!status) {
      return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái mới' });
    }

    // Kiểm tra status có trong enum thật không
    const validStatuses = ['todo', 'in_progress', 'done', 'pending', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}`,
      });
    }

    const task = await Task.findById(req.params.id).populate('project', 'createdBy name endDate startDate');
    if (!task) {
      return res.status(404).json({ message: 'Công việc không tồn tại' });
    }

    const fromStatus = task.status;
    let managerUser = null;
    let useManagerPermission = false;

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');
    const myId = req.user._id.toString();
    const isProjectManager = task.project.createdBy.toString() === myId;

    // ─── PHÂN QUYỀN ───────────────────────────────────────────
    if (isAdmin) {
      // Admin: toàn quyền
      const allowed = MANAGER_ALLOWED_TRANSITIONS[fromStatus] || [];
      if (!allowed.includes(status) && fromStatus !== status) {
        return res.status(400).json({
          message: `Không thể chuyển từ "${STATUS_VI[fromStatus]}" sang "${STATUS_VI[status]}".`,
        });
      }
      managerUser = req.user;
      useManagerPermission = true;
    } else if (isManager && isEmployee) {
      // Đa role: xác định quyền theo vị trí trong project cụ thể
      if (isProjectManager) {
        // User là manager của project này → dùng quyền manager
        const allowed = MANAGER_ALLOWED_TRANSITIONS[fromStatus] || [];
        if (!allowed.includes(status)) {
          return res.status(400).json({
            message: `Không thể chuyển từ "${STATUS_VI[fromStatus]}" sang "${STATUS_VI[status]}".`,
          });
        }
        managerUser = req.user;
        useManagerPermission = true;
      } else {
        // Không phải manager của project → dùng quyền employee
        const assignment = await Assignment.findOne({ task: req.params.id, assignee: req.user._id });
        if (!assignment) {
          return res.status(403).json({
            message: 'Bạn không có quyền cập nhật trạng thái công việc này',
          });
        }
        const allowed = EMPLOYEE_ALLOWED_TRANSITIONS[fromStatus] || [];
        if (!allowed.includes(status)) {
          return res.status(403).json({
            message: `Bạn không có quyền chuyển công việc từ "${STATUS_VI[fromStatus]}" sang "${STATUS_VI[status]}". Bạn chỉ có thể chuyển từ "Đang làm" sang "Đã hoàn thành".`,
          });
        }
        useManagerPermission = false;
      }
    } else if (isManager) {
      // Chỉ manager: kiểm tra manager của project
      if (!isProjectManager) {
        return res.status(403).json({ message: 'Bạn không có quyền cập nhật trạng thái công việc này' });
      }
      const allowed = MANAGER_ALLOWED_TRANSITIONS[fromStatus] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          message: `Không thể chuyển từ "${STATUS_VI[fromStatus]}" sang "${STATUS_VI[status]}".`,
        });
      }
      managerUser = req.user;
      useManagerPermission = true;
    } else {
      // Chỉ employee
      const assignment = await Assignment.findOne({ task: req.params.id, assignee: req.user._id });
      if (!assignment) {
        return res.status(403).json({
          message: 'Bạn chỉ có thể cập nhật trạng thái công việc được giao cho bạn',
        });
      }
      const allowed = EMPLOYEE_ALLOWED_TRANSITIONS[fromStatus] || [];
      if (!allowed.includes(status)) {
        return res.status(403).json({
          message: `Bạn không có quyền chuyển công việc từ "${STATUS_VI[fromStatus]}" sang "${STATUS_VI[status]}". Bạn chỉ có thể chuyển từ "Đang làm" sang "Đã hoàn thành".`,
        });
      }
      useManagerPermission = false;
    }

    // ─── VALIDATE NGÀY ────────────────────────────────────────
    const effectiveDueDate = dueDate !== undefined ? new Date(dueDate) : task.dueDate;
    const effectiveStartDate = startDate !== undefined ? new Date(startDate) : task.startDate;

    if (effectiveStartDate && effectiveDueDate && effectiveStartDate > effectiveDueDate) {
      return res.status(400).json({ message: 'Ngày bắt đầu công việc không được sau deadline.' });
    }

    if (effectiveDueDate && task.project.endDate) {
      const projEnd = new Date(task.project.endDate);
      if (effectiveDueDate > projEnd) {
        return res.status(400).json({
          message: `Deadline công việc (${effectiveDueDate.toLocaleDateString('vi-VN')}) không được vượt quá deadline dự án (${projEnd.toLocaleDateString('vi-VN')}).`,
          code: 'TASK_DEADLINE_EXCEEDS_PROJECT',
          projectEndDate: task.project.endDate,
        });
      }
    }

    if (effectiveStartDate && task.project.startDate) {
      const projStart = new Date(task.project.startDate);
      if (effectiveStartDate < projStart) {
        return res.status(400).json({
          message: `Ngày bắt đầu công việc không được trước ngày bắt đầu dự án (${projStart.toLocaleDateString('vi-VN')}).`,
        });
      }
    }

    // ─── CẬP NHẬT NGÀY THEO TRANSITION ────────────────────────
    if (status === 'in_progress' && (fromStatus === 'todo' || fromStatus === 'pending') && !task.startDate && !startDate) {
      task.startDate = new Date();
    }

    if (startDate !== undefined) task.startDate = startDate;
    if (dueDate !== undefined) task.dueDate = dueDate;

    // ─── ĐỔI STATUS ───────────────────────────────────────────
    task.status = status;
    await task.save();

    // ─── GỬI EMAIL TỰ ĐỘNG (chỉ khi dùng quyền manager) ──────
    if (useManagerPermission && managerUser) {
      const managerName = `${managerUser.firstName} ${managerUser.lastName}`;
      const projectName = task.project.name;
      const taskName = task.name;
      const assignees = await getTaskAssignees(task._id);

      if (status === 'cancelled') {
        notifyAssigneesCancel(assignees, taskName, projectName, managerName);
      } else if (status === 'pending') {
        notifyAssigneesStatusChange(assignees, taskName, projectName, STATUS_VI['pending'], managerName);
      } else if (status === 'in_progress' && (fromStatus === 'pending' || fromStatus === 'done' || fromStatus === 'cancelled')) {
        notifyAssigneesStatusChange(assignees, taskName, projectName, STATUS_VI['in_progress'], managerName);
      } else if (status === 'done') {
        notifyAssigneesStatusChange(assignees, taskName, projectName, STATUS_VI['done'], managerName);
      } else if (status === 'todo' && fromStatus !== 'todo') {
        notifyAssigneesStatusChange(assignees, taskName, projectName, STATUS_VI['todo'], managerName);
      }
    }

    res.status(200).json({
      message: `Trạng thái công việc đã cập nhật từ "${STATUS_VI[fromStatus]}" → "${STATUS_VI[status]}"`,
      data: task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Employee xin làm lại task đã hoàn thành
 * POST /api/tasks/:id/request-redo
 * - Chỉ user có vai trò employee mới gọi được (hỗ trợ đa role)
 * - Employee phải được giao task này
 * - Không đổi status task
 * - Gửi email tới manager của project
 */
exports.requestRedo = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'name createdBy');
    if (!task) {
      return res.status(404).json({ message: 'Công việc không tồn tại' });
    }

    // Chỉ user có vai trò employee mới gọi được (dùng hasRole để hỗ trợ đa role)
    if (!hasRole(req.user, 'employee')) {
      return res.status(403).json({ message: 'Chỉ nhân viên mới có thể gửi yêu cầu làm lại' });
    }

    // Phải được giao task
    const assignment = await Assignment.findOne({
      task: req.params.id,
      assignee: req.user._id,
    });
    if (!assignment) {
      return res.status(403).json({ message: 'Bạn không được giao công việc này' });
    }

    // Chỉ xin làm lại task đã hoàn thành
    if (task.status !== 'done') {
      return res.status(400).json({ message: 'Chỉ có thể xin làm lại công việc đã hoàn thành' });
    }

    // Lấy thông tin manager của project
    const manager = await User.findById(task.project.createdBy).select('firstName lastName email');
    if (!manager) {
      return res.status(500).json({ message: 'Không tìm thấy thông tin manager của dự án' });
    }

    const employeeName = `${req.user.firstName} ${req.user.lastName}`;
    const managerName = `${manager.firstName} ${manager.lastName}`;

    // Gửi email tới manager (không await, không lưu DB)
    mailService
      .sendEmployeeRedoRequestMail(
        manager.email,
        managerName,
        employeeName,
        task.name,
        task.project.name
      )
      .catch((err) => {
        console.error(`Lỗi gửi email request redo cho manager ${manager.email}:`, err.message);
      });

    res.status(200).json({
      message: 'Yêu cầu làm lại đã được gửi tới manager. Trạng thái công việc sẽ được cập nhật sau khi manager xem xét.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy danh sách nhân viên được phân công vào công việc
 * GET /api/tasks/:id/assignments
 * Hỗ trợ đa role: manager của project thấy tất cả; employee chỉ thấy nếu có liên quan.
 */
exports.getTaskAssignments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'createdBy');
    if (!task) {
      return res.status(404).json({ message: 'Công việc không tồn tại' });
    }

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');
    const myId = req.user._id.toString();
    const isProjectManager = task.project.createdBy.toString() === myId;

    if (isAdmin) {
      // Admin bypass
    } else if (isManager && isProjectManager) {
      // Manager của project: thấy tất cả
    } else if (isEmployee || (isManager && !isProjectManager)) {
      // Employee hoặc manager của project khác: kiểm tra có liên quan không
      const [membership, assignment] = await Promise.all([
        ProjectMember.findOne({ project: task.project._id, user: req.user._id }),
        Assignment.findOne({ task: task._id, assignee: req.user._id }),
      ]);
      if (!membership && !assignment) {
        return res.status(403).json({ message: 'Bạn không có quyền xem công việc này' });
      }
    } else {
      return res.status(403).json({ message: 'Bạn không có quyền xem công việc này' });
    }

    const assignments = await Assignment.find({ task: req.params.id }).populate(
      'assignee',
      'firstName lastName email'
    );
    res.status(200).json({ message: 'Danh sách phân công', data: assignments });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Xóa công việc
 * DELETE /api/tasks/:id
 * Chỉ Manager của dự án hoặc Admin.
 */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'createdBy');
    if (!task) {
      return res.status(404).json({ message: 'Công việc không tồn tại' });
    }

    // Kiểm tra quyền
    if (
      !hasRole(req.user, 'admin') &&
      task.project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa công việc này' });
    }

    await Task.findByIdAndDelete(req.params.id);
    await Assignment.deleteMany({ task: req.params.id });

    res.status(200).json({ message: `Công việc "${task.name}" đã được xóa thành công` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};
