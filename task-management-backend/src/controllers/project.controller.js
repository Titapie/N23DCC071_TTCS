// src/controllers/project.controller.js
const Project = require('../models/project.model');
const ProjectMember = require('../models/projectMember.model');
const Task = require('../models/task.model');
const Assignment = require('../models/assignment.model');
const User = require('../models/user.model');
const mailService = require('../services/mail.service');
const { hasRole } = require('../middleware/auth.middleware');

// Helper: Kiểm tra user có được giao ít nhất 1 task trong dự án không
const isAssignedToProject = async (userId, projectId) => {
  const projectTasks = await Task.find({ project: projectId }).select('_id');
  const taskIds = projectTasks.map(t => t._id);
  const assignment = await Assignment.findOne({ task: { $in: taskIds }, assignee: userId });
  return !!assignment;
};

// Helper: Tính toán thống kê task động cho danh sách dự án
const attachProjectTaskStats = async (projects) => {
  if (!projects || projects.length === 0) return [];
  
  const projectIds = projects.map(p => p._id);
  
  // Truy vấn aggregation đếm số task theo dự án và status
  const taskStats = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: { project: "$project", status: "$status" },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const statsMap = {};
  projectIds.forEach(id => {
    statsMap[id.toString()] = {
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      not_finish_tasks: 0
    };
  });

  taskStats.forEach(stat => {
    if (!stat._id || !stat._id.project) return;
    const projId = stat._id.project.toString();
    const status = stat._id.status;
    const count = stat.count;

    if (statsMap[projId]) {
      statsMap[projId].total_tasks += count;
      if (status === 'done') {
        statsMap[projId].completed_tasks += count;
      } else if (status === 'in_progress') {
        statsMap[projId].in_progress_tasks += count;
      }
    }
  });

  projectIds.forEach(id => {
    const key = id.toString();
    statsMap[key].not_finish_tasks = statsMap[key].total_tasks - statsMap[key].completed_tasks;
  });

  return projects.map(p => {
    const pObj = typeof p.toObject === 'function' ? p.toObject() : p;
    const stats = statsMap[pObj._id.toString()] || {
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      not_finish_tasks: 0
    };
    return {
      ...pObj,
      total_tasks: stats.total_tasks,
      completed_tasks: stats.completed_tasks,
      in_progress_tasks: stats.in_progress_tasks,
      not_finish_tasks: stats.not_finish_tasks
    };
  });
};

/**
 * Tạo dự án mới
 * POST /api/projects
 * Chỉ Manager/Admin mới được tạo.
 */
exports.createProject = async (req, res) => {
  const { name, description, startDate, endDate } = req.body;

  try {
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin dự án' });
    }

    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Dự án đã được tạo thành công', data: project });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy danh sách dự án
 * GET /api/projects
 * - Admin: xem tất cả dự án
 * - Manager: xem dự án mình tạo
 * - Employee: xem dự án mình tham gia
 * - Employee + Manager: UNION của cả hai, gắn field userRole vào từng project
 *
 * Response mỗi project có thêm field `userRole`:
 *   'manager'  — user là người tạo project
 *   'employee' — user là member của project
 *   'both'     — user vừa tạo vừa là member
 */
exports.getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');

    let projects = [];
    let total = 0;

    if (isAdmin) {
      // Admin xem tất cả
      [projects, total] = await Promise.all([
        Project.find()
          .populate('createdBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Project.countDocuments(),
      ]);
      projects = projects.map(p => {
        const pObj = p.toObject();
        pObj.userRole = 'admin';
        return pObj;
      });
    } else if (isManager && isEmployee) {
      // Đa role: UNION project mình tạo + project mình là member chính thức
      const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
      const employeeProjectIds = memberships.map(m => m.project.toString());

      // Lấy project với $or: mình tạo HOẶC mình là member/được giao task
      const myId = req.user._id;
      const filter = {
        $or: [
          { createdBy: myId },
          { _id: { $in: employeeProjectIds } },
        ],
      };

      [projects, total] = await Promise.all([
        Project.find(filter)
          .populate('createdBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Project.countDocuments(filter),
      ]);

      // Gắn userRole vào mỗi project
      projects = projects.map(p => {
        const pObj = p.toObject();
        const isCreator = p.createdBy._id.toString() === myId.toString();
        const isMemberOrAssigned = employeeProjectIds.includes(p._id.toString());
        if (isCreator && isMemberOrAssigned) pObj.userRole = 'both';
        else if (isCreator) pObj.userRole = 'manager';
        else pObj.userRole = 'employee';
        return pObj;
      });

      projects = await attachProjectTaskStats(projects);
      return res.status(200).json({
        message: 'Danh sách dự án',
        data: projects,
        pagination: { total, page: Number(page), limit: Number(limit) },
      });
    } else if (isManager) {
      // Chỉ manager: xem dự án mình tạo
      const filter = { createdBy: req.user._id };
      [projects, total] = await Promise.all([
        Project.find(filter)
          .populate('createdBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Project.countDocuments(filter),
      ]);
      projects = projects.map(p => {
        const pObj = p.toObject();
        pObj.userRole = 'manager';
        return pObj;
      });
    } else {
      // Chỉ employee: xem dự án mình tham gia chính thức
      const memberships = await ProjectMember.find({ user: req.user._id }).select('project');
      const employeeProjectIds = memberships.map(m => m.project.toString());

      const filter = { _id: { $in: employeeProjectIds } };
      [projects, total] = await Promise.all([
        Project.find(filter)
          .populate('createdBy', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Project.countDocuments(filter),
      ]);
      projects = projects.map(p => {
        const pObj = p.toObject();
        pObj.userRole = 'employee';
        return pObj;
      });
    }

    projects = await attachProjectTaskStats(projects);
    res.status(200).json({
      message: 'Danh sách dự án',
      data: projects,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy thông tin chi tiết dự án
 * GET /api/projects/:id
 * - Admin: xem tất cả
 * - Manager: chỉ xem dự án mình quản lý
 * - Employee: chỉ xem dự án mình tham gia
 * - Đa role: được xem nếu thỏa 1 trong 2 điều kiện
 */
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'createdBy',
      'firstName lastName email'
    );
    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');
    const myId = req.user._id.toString();

    if (isAdmin) {
      // Admin bypass
      return res.status(200).json({ message: 'Thông tin dự án', data: project });
    }

    const isCreator = project.createdBy._id.toString() === myId;

    if (isManager && isCreator) {
      return res.status(200).json({ message: 'Thông tin dự án', data: project });
    }

    if (isEmployee || (isManager && !isCreator)) {
      const membership = await ProjectMember.findOne({
        project: req.params.id,
        user: req.user._id,
      });
      if (membership) {
        return res.status(200).json({ message: 'Thông tin dự án', data: project });
      }
    }

    return res.status(403).json({ message: 'Bạn không có quyền xem dự án này' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Cập nhật dự án
 * PUT /api/projects/:id
 * Chỉ Manager của dự án hoặc Admin.
 * Nếu endDate thay đổi → gửi email cho tất cả thành viên.
 */
exports.updateProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, progress } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    // Kiểm tra quyền: chỉ manager của dự án (createdBy) hoặc admin
    if (!hasRole(req.user, 'admin') && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa dự án này' });
    }

    // Validate startDate vs endDate mới
    const effectiveStartDate = startDate !== undefined ? new Date(startDate) : project.startDate;
    const effectiveEndDate = endDate !== undefined ? new Date(endDate) : project.endDate;

    if (effectiveStartDate && effectiveEndDate && effectiveStartDate > effectiveEndDate) {
      return res.status(400).json({
        message: 'Ngày bắt đầu dự án không được sau ngày kết thúc.',
      });
    }

    // Nếu endDate bị rút ngắn, kiểm tra các task đang có dueDate vượt quá endDate mới
    const oldEndDate = project.endDate;
    const endDateChanged =
      endDate !== undefined &&
      new Date(endDate).toDateString() !== new Date(oldEndDate).toDateString();

    if (endDateChanged && effectiveEndDate < new Date(oldEndDate)) {
      // endDate bị rút ngắn → kiểm tra task vi phạm
      const violatingTasks = await Task.find({
        project: project._id,
        dueDate: { $gt: effectiveEndDate },
        status: { $nin: ['done', 'cancelled'] },
      }).select('name dueDate status');

      if (violatingTasks.length > 0) {
        return res.status(400).json({
          message: `Không thể rút ngắn deadline dự án. Có ${violatingTasks.length} công việc đang có deadline vượt quá ngày kết thúc mới (${effectiveEndDate.toLocaleDateString('vi-VN')}). Vui lòng cập nhật các công việc đó trước.`,
          code: 'TASKS_EXCEED_NEW_PROJECT_DEADLINE',
          violatingTasks: violatingTasks.map((t) => ({
            _id: t._id,
            name: t.name,
            dueDate: t.dueDate,
            status: t.status,
          })),
        });
      }
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (progress !== undefined) project.progress = progress;

    await project.save();

    // Nếu deadline thay đổi → gửi email cho toàn bộ thành viên
    if (endDateChanged) {
      const members = await ProjectMember.find({ project: project._id }).populate(
        'user',
        'firstName lastName email'
      );

      for (const member of members) {
        const user = member.user;
        if (!user) continue;
        mailService
          .sendProjectDeadlineChangedMail(
            user.email,
            user.firstName,
            project.name,
            oldEndDate,
            project.endDate
          )
          .catch((err) => {
            console.error(`Lỗi gửi email thay đổi deadline cho ${user.email}:`, err.message);
          });
      }
    }

    res.status(200).json({ message: 'Dự án đã được cập nhật', data: project });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Xóa dự án
 * DELETE /api/projects/:id
 * Chỉ Manager của dự án hoặc Admin.
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    // Kiểm tra quyền
    if (!hasRole(req.user, 'admin') && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa dự án này' });
    }

    // Lấy danh sách thành viên dự án trước khi xóa để gửi email thông báo
    const members = await ProjectMember.find({ project: req.params.id }).populate('user', 'firstName lastName email');

    await Project.findByIdAndDelete(req.params.id);

    // Xóa dữ liệu liên quan
    await ProjectMember.deleteMany({ project: req.params.id });

    const tasks = await Task.find({ project: req.params.id });
    const taskIds = tasks.map((t) => t._id);
    await Assignment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: req.params.id });

    // Gửi email thông báo xóa dự án cho các thành viên
    const deletedByName = `${req.user.firstName} ${req.user.lastName}`;
    for (const member of members) {
      const user = member.user;
      if (!user || !user.email) continue;
      
      // Không gửi email cho chính người thực hiện hành động xóa
      if (user._id.toString() === req.user._id.toString()) continue;

      mailService.sendProjectDeletedMail(
        user.email,
        user.firstName,
        project.name,
        deletedByName
      ).catch(err => {
        console.error(`[ProjectController] Lỗi gửi email thông báo xóa dự án cho ${user.email}:`, err.message);
      });
    }

    res.status(200).json({ message: `Dự án "${project.name}" đã được xóa thành công` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy danh sách công việc của dự án
 * GET /api/projects/:id/tasks
 * Manager của dự án, Employee là thành viên, Admin đều được xem.
 * Hỗ trợ đa role: thỏa 1 trong 2 điều kiện là được.
 */
exports.getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const isEmployee = hasRole(req.user, 'employee');
    const myId = req.user._id.toString();
    const isCreator = project.createdBy.toString() === myId;

    let taskFilter = { project: req.params.id };

    if (!isAdmin) {
      // Manager của project: OK
      if (isManager && isCreator) {
        // Cho phép — tiếp tục xem toàn bộ task
      } else {
        // Phải là ProjectMember mới được quyền xem dự án/task
        const membership = await ProjectMember.findOne({
          project: req.params.id,
          user: req.user._id,
        });
        if (!membership) {
          return res.status(403).json({ message: 'Bạn không có quyền xem các công việc của dự án này. Bạn phải là thành viên của dự án.' });
        }
      }
    }

    const tasks = await Task.find(taskFilter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const taskIds = tasks.map((t) => t._id);
    const assignments = await Assignment.find({ task: { $in: taskIds } }).populate(
      'assignee',
      'firstName lastName email avatar'
    );

    const tasksWithMembers = tasks.map((t) => {
      const taskObj = t.toObject();
      taskObj.members = assignments
        .filter((a) => a.task.toString() === taskObj._id.toString())
        .map((a) => a.assignee);
      return taskObj;
    });

    res.status(200).json({
      message: `Danh sách công việc của dự án "${project.name}"`,
      data: tasksWithMembers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy danh sách thành viên của dự án
 * GET /api/projects/:id/members
 * Hỗ trợ đa role: thỏa 1 trong 2 điều kiện là được.
 */
exports.getProjectMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');
    const myId = req.user._id.toString();
    const isCreator = project.createdBy.toString() === myId;

    if (!isAdmin) {
      // Manager của project: OK
      if (isManager && isCreator) {
        // Cho phép
      } else {
        // Kiểm tra membership hoặc được giao task
        const membership = await ProjectMember.findOne({
          project: req.params.id,
          user: req.user._id,
        });
        if (!membership) {
          const hasTask = await isAssignedToProject(req.user._id, req.params.id);
          if (!hasTask) {
            return res.status(403).json({ message: 'Bạn không phải thành viên của dự án này' });
          }
        }
      }
    }

    // 1. Lấy thành viên từ bảng ProjectMember
    const projectMembers = await ProjectMember.find({ project: req.params.id }).populate(
      'user',
      'firstName lastName email role roles'
    );

    const allMembers = projectMembers.map(m => ({
      _id: m._id,
      project: m.project,
      user: m.user,
      role: m.role,
      joinedAt: m.joinedAt,
      source: 'member', // được thêm trực tiếp vào dự án
    }));

    res.status(200).json({ message: 'Danh sách thành viên dự án', data: allMembers });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy danh sách task chưa kết thúc của thành viên trong dự án
 * GET /api/projects/:projectId/members/:employeeId/unfinished-tasks
 */
exports.getMemberUnfinishedTasks = async (req, res) => {
  const { projectId, employeeId } = req.params;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Thành viên không tồn tại' });
    }

    const tasks = await Task.find({ project: projectId }).lean();
    const taskIds = tasks.map(t => t._id);

    const assignments = await Assignment.find({
      task: { $in: taskIds },
      assignee: employeeId
    }).populate('task');

    const unfinished = assignments.filter(a =>
      a.task && ['todo', 'in_progress', 'pending'].includes(a.task.status)
    );

    res.status(200).json({
      success: true,
      unfinishedTaskCount: unfinished.length,
      tasks: unfinished.map(a => ({
        _id: a.task._id,
        name: a.task.name,
        status: a.task.status,
        dueDate: a.task.dueDate
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Xóa thành viên khỏi dự án kèm bàn giao task chưa kết thúc
 * DELETE /api/projects/:projectId/members/:employeeId
 */
exports.removeMemberFromProject = async (req, res) => {
  const { projectId, employeeId } = req.params;
  const { handoverEmployeeId } = req.body;

  try {
    // 1. Kiểm tra project tồn tại
    const project = req.project || await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Dự án không tồn tại' });
    }

    // 2. Kiểm tra Employee X tồn tại
    const employeeX = await User.findById(employeeId);
    if (!employeeX) {
      return res.status(404).json({ message: 'Thành viên cần xóa không tồn tại' });
    }

    // 3. Không cho phép xóa Project Owner/Creator
    if (project.createdBy.toString() === employeeId) {
      return res.status(400).json({ message: 'Không thể xóa Project Manager/Creator chính của dự án' });
    }

    // 4. Kiểm tra X có phải ProjectMember của dự án không
    const membershipX = await ProjectMember.findOne({ project: projectId, user: employeeId });
    if (!membershipX) {
      return res.status(400).json({ message: 'Thành viên này không thuộc dự án' });
    }

    // 5. Tìm các assignments của Employee X trong dự án
    const projectTasks = await Task.find({ project: projectId }).lean();
    const taskIds = projectTasks.map(t => t._id);

    const assignmentsX = await Assignment.find({
      task: { $in: taskIds },
      assignee: employeeId
    }).populate('task');

    // Chia nhóm assignments
    const unfinishedAssignments = assignmentsX.filter(a =>
      a.task && ['todo', 'in_progress', 'pending'].includes(a.task.status)
    );
    const finishedAssignments = assignmentsX.filter(a =>
      a.task && ['done', 'cancelled'].includes(a.task.status)
    );

    // 6. Nếu có task chưa kết thúc, bắt buộc phải chọn handoverEmployeeId
    if (unfinishedAssignments.length > 0) {
      if (!handoverEmployeeId) {
        return res.status(400).json({
          message: 'Thành viên này đang có công việc chưa kết thúc, cần chọn người bàn giao.',
          code: 'HANDOVER_REQUIRED',
          unfinishedTaskCount: unfinishedAssignments.length
        });
      }

      // Kiểm tra người nhận bàn giao Y
      const employeeY = await User.findById(handoverEmployeeId);
      if (!employeeY) {
        return res.status(400).json({ message: 'Người nhận bàn giao không tồn tại' });
      }

      const isYEmployee = employeeY.roles.includes('employee') || employeeY.role === 'employee';
      if (!isYEmployee) {
        return res.status(400).json({ message: 'Người nhận bàn giao phải có vai trò là nhân viên' });
      }

      if (handoverEmployeeId === employeeId) {
        return res.status(400).json({ message: 'Người nhận bàn giao không thể trùng với người bị xóa' });
      }
    }

    // 7. Thực hiện xóa & bàn giao (Transaction / Sequential)
    const mongoose = require('mongoose');
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }

    try {
      let reassignedTaskCount = 0;

      if (unfinishedAssignments.length > 0) {
        // Tự động thêm Y vào ProjectMember nếu chưa có
        const membershipY = await ProjectMember.findOne({ project: projectId, user: handoverEmployeeId }).session(session);
        if (!membershipY) {
          await ProjectMember.create([{
            project: projectId,
            user: handoverEmployeeId,
            role: 'member',
            joinedAt: new Date()
          }], { session });
        }

        // Chuyển giao các assignment chưa kết thúc sang Y
        for (const a of unfinishedAssignments) {
          const existingYAssignment = await Assignment.findOne({ task: a.task._id, assignee: handoverEmployeeId }).session(session);
          if (existingYAssignment) {
            await Assignment.findByIdAndDelete(a._id).session(session);
          } else {
            a.assignee = handoverEmployeeId;
            a.assignedBy = req.user._id;
            a.assignedAt = new Date();
            await a.save({ session });
          }
          reassignedTaskCount++;
        }
      }

      // Xóa X khỏi ProjectMember của dự án
      await ProjectMember.deleteOne({ project: projectId, user: employeeId }).session(session);

      if (session) {
        await session.commitTransaction();
        session.endSession();
      }

      res.status(200).json({
        success: true,
        message: 'Xóa thành viên khỏi dự án thành công',
        data: {
          projectId,
          removedEmployeeId: employeeId,
          handoverEmployeeId: handoverEmployeeId || null,
          reassignedTaskCount,
          historyAssignmentKeptCount: finishedAssignments.length
        }
      });
    } catch (err) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};