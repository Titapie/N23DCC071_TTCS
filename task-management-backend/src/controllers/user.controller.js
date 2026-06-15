const User = require('../models/user.model');
const ProjectMember = require('../models/projectMember.model');
const Assignment = require('../models/assignment.model');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const mailService = require('../services/mail.service');
const bcrypt = require('bcryptjs');
const { hasRole } = require('../middleware/auth.middleware');

/**
 * Helper: Tính `role` string từ `roles` array (dùng rule ưu tiên).
 * admin > manager > employee
 */
const deriveRoleString = (roles) => {
  if (!roles || roles.length === 0) return 'employee';
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('manager')) return 'manager';
  return 'employee';
};

/**
 * Lấy danh sách người dùng
 * GET /api/users
 * - Admin: xem tất cả user
 * - Manager: xem danh sách employee (để thêm vào dự án)
 *
 * Hỗ trợ multi-role: query ?role=employee sẽ tìm cả user có roles=['employee','manager']
 * vì họ vẫn là employee.
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 50, isActive } = req.query;
    let filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Xử lý filter theo role — hỗ trợ cả role string cũ và roles array mới
    if (role) {
      // Tìm user có role string === role HOẶC roles array chứa role
      filter.$or = [{ role }, { roles: role }];
    }

    // Manager chỉ được xem danh sách employee/manager (không thấy admin)
    if (hasRole(req.user, 'manager') && !hasRole(req.user, 'admin')) {
      // Nếu manager cố tình query role=admin, chặn lại
      if (role === 'admin') {
        return res.status(403).json({ message: 'Manager không có quyền xem danh sách admin' });
      }
      // Mặc định chỉ xem non-admin: user không có role='admin' VÀ không có 'admin' trong roles
      const adminFilter = {
        role: { $ne: 'admin' },
        roles: { $nin: ['admin'] },
      };

      if (role) {
        // Kết hợp: phải thỏa filter role VÀ không phải admin
        filter = { ...adminFilter, $or: [{ role }, { roles: role }] };
      } else {
        filter = { ...filter, ...adminFilter };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      message: 'Danh sách người dùng',
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Tạo người dùng mới
 * POST /api/users
 * Chỉ Admin.
 */
exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Validate mật khẩu
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const validRole = ['employee', 'manager', 'admin'].includes(role) ? role : 'employee';
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: validRole,
      roles: [validRole],
      isActive: true,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    // Gửi email thông tin đăng nhập tự động
    mailService.sendNewAccountCreatedMail(
      email,
      `${firstName} ${lastName}`,
      password,
      validRole
    ).catch(err => {
      console.error(`Lỗi gửi email thông báo tài khoản mới cho ${email}:`, err.message);
    });

    res.status(201).json({ message: 'Tạo người dùng thành công và đã gửi email thông báo', data: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Cập nhật role người dùng
 * PATCH /api/users/:id/role
 * Chỉ Admin.
 *
 * Body:
 *   { role: 'employee'|'manager'|'admin', action: 'grant'|'revoke'|'replace' }
 *
 * Hành vi theo action:
 *   grant:   Cấp thêm role. Chỉ dùng cho 'employee'/'manager', không cho 'admin'.
 *            Sau khi grant: roles=[...cũ, role], đồng bộ lại role string.
 *   revoke:  Gỡ bỏ role. Chỉ dùng cho 'employee'/'manager'.
 *            Sau khi revoke: roles=[...còn lại], đồng bộ lại role string.
 *            Không cho revoke nếu còn lại 0 role.
 *   replace: Thay thế hoàn toàn (default). Dùng để set 'admin' hoặc reset về 1 role.
 *            Nếu role='admin': roles=['admin'], xóa mọi role khác.
 *
 * Quy tắc bất biến:
 *   - Admin không thể gộp với employee/manager.
 *   - Kết quả hợp lệ: ['employee'], ['manager'], ['employee','manager'], ['admin']
 */
exports.updateRole = async (req, res) => {
  try {
    const { role, action = 'replace', replacementManagerId } = req.body;

    if (!['employee', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role không hợp lệ. Chọn: employee, manager, admin' });
    }
    if (!['grant', 'revoke', 'replace'].includes(action)) {
      return res.status(400).json({ message: 'Action không hợp lệ. Chọn: grant, revoke, replace' });
    }

    // Không cho grant admin (phải dùng replace)
    if (action === 'grant' && role === 'admin') {
      return res.status(400).json({
        message: 'Không thể cấp thêm role admin. Dùng action=replace để chuyển thành admin.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    // Không cho admin tự sửa role của chính mình
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Không thể tự thay đổi role của chính mình' });
    }

    // Đảm bảo user có roles array (migration fallback)
    if (!user.roles || user.roles.length === 0) {
      user.roles = [user.role || 'employee'];
    }

    let newRoles = [...user.roles];

    if (action === 'replace') {
      // Thay thế hoàn toàn
      if (role === 'admin') {
        newRoles = ['admin'];
      } else {
        newRoles = [role];
      }
    } else if (action === 'grant') {
      if (user.roles.includes('admin')) {
        return res.status(400).json({
          message: 'Không thể cấp thêm role cho tài khoản admin. Dùng action=replace để thay đổi.',
        });
      }
      if (!newRoles.includes(role)) {
        newRoles.push(role);
      } else {
        return res.status(400).json({ message: `User đã có role ${role} rồi.` });
      }
    } else if (action === 'revoke') {
      if (!newRoles.includes(role)) {
        return res.status(400).json({ message: `User không có role ${role} để gỡ bỏ.` });
      }
      newRoles = newRoles.filter(r => r !== role);
      if (newRoles.length === 0) {
        newRoles = ['employee'];
      }
    }

    // Validate kết quả cuối cùng: admin không được gộp với employee/manager
    if (newRoles.includes('admin') && (newRoles.includes('employee') || newRoles.includes('manager'))) {
      return res.status(400).json({
        message: 'Không hợp lệ: admin không thể kết hợp với employee hoặc manager.',
      });
    }

    // Kiểm tra xem user có bị mất vai trò manager hay không
    const lostManagerRole = user.roles.includes('manager') && !newRoles.includes('manager');
    const managedProjectsCount = await Project.countDocuments({ createdBy: req.params.id });

    let replacementManager = null;
    if (lostManagerRole && managedProjectsCount > 0) {
      if (!replacementManagerId) {
        return res.status(400).json({ message: 'Bắt buộc chọn Manager thay thế để bàn giao các dự án đang quản lý' });
      }
      replacementManager = await User.findOne({ _id: replacementManagerId, roles: 'manager', isActive: true });
      if (!replacementManager) {
        return res.status(400).json({ message: 'Manager thay thế không hợp lệ hoặc đang bị vô hiệu hóa' });
      }
      if (replacementManagerId.toString() === req.params.id) {
        return res.status(400).json({ message: 'Không thể chuyển giao dự án cho chính người bị gỡ role' });
      }
    }

    // Kiểm tra xem user có bị mất vai trò employee hay không
    const lostEmployeeRole = user.roles.includes('employee') && !newRoles.includes('employee');
    let affectedProjectsCount = 0;
    let affectedTasksCount = 0;

    if (lostEmployeeRole) {
      affectedProjectsCount = await ProjectMember.countDocuments({ user: req.params.id });
      affectedTasksCount = await Assignment.countDocuments({ assignee: req.params.id });
    }

    // --- Thực hiện cập nhật dữ liệu an toàn ---
    
    // 1. Nếu mất vai trò manager: chuyển giao dự án và công việc
    if (lostManagerRole && managedProjectsCount > 0) {
      await Project.updateMany({ createdBy: req.params.id }, { createdBy: replacementManagerId });
      await Task.updateMany({ createdBy: req.params.id }, { createdBy: replacementManagerId });
    }

    // 2. Nếu mất vai trò employee: dọn dẹp phân công và thành viên dự án
    if (lostEmployeeRole) {
      await ProjectMember.deleteMany({ user: req.params.id });
      await Assignment.deleteMany({ assignee: req.params.id });
    }

    // 3. Cập nhật roles trên User
    const newRoleString = deriveRoleString(newRoles);
    user.roles = newRoles;
    user.role = newRoleString;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    // --- Gửi email thông báo ---
    const userName = `${user.firstName} ${user.lastName}`;

    if (lostManagerRole) {
      const replacementName = replacementManager ? `${replacementManager.firstName} ${replacementManager.lastName}` : 'Manager khác';
      // Gửi mail cho manager cũ
      mailService.sendManagerRoleRevokedMail(user.email, userName, replacementName, managedProjectsCount).catch(err => {
        console.error(`Lỗi gửi mail gỡ role manager cho ${user.email}:`, err.message);
      });
      // Gửi mail cho manager mới
      if (replacementManager) {
        mailService.sendManagerRoleAssignedMail(replacementManager.email, replacementName, userName, managedProjectsCount).catch(err => {
          console.error(`Lỗi gửi mail bàn giao cho ${replacementManager.email}:`, err.message);
        });
      }
    }

    if (lostEmployeeRole) {
      const stillHasManager = newRoles.includes('manager');
      mailService.sendEmployeeRoleRevokedMail(user.email, userName, affectedProjectsCount, affectedTasksCount, stillHasManager).catch(err => {
        console.error(`Lỗi gửi mail gỡ role employee cho ${user.email}:`, err.message);
      });
    }

    const actionLabel = action === 'grant' ? 'Cấp thêm' : action === 'revoke' ? 'Gỡ bỏ' : 'Thay đổi';
    res.status(200).json({
      message: `${actionLabel} role thành công. Roles hiện tại: [${newRoles.join(', ')}]`,
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Cập nhật thông tin cá nhân của bản thân
 * PATCH /api/users/me
 * Tất cả user đã đăng nhập.
 */
exports.updateMe = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json({ message: 'Cập nhật thành công', data: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Cập nhật thông tin người dùng theo ID (chỉ Admin)
 * PATCH /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json({ message: 'Cập nhật thành công', data: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Cập nhật trạng thái tài khoản (Admin only)
 * PATCH /api/users/:id/status
 */
exports.updateStatus = async (req, res) => {
  try {
    const { isActive, replacementManagerId } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    // Admin không thể tự khóa chính mình
    if (req.params.id === req.user._id.toString() && isActive === false) {
      return res.status(400).json({ message: 'Không thể tự vô hiệu hóa tài khoản của chính mình' });
    }

    const wasActive = user.isActive;
    const hasEmployeeRole = user.roles.includes('employee');
    const hasManagerRole = user.roles.includes('manager');

    let replacementManager = null;
    let managedProjectsCount = 0;

    if (isActive === false) {
      // 1. Xử lý phần manager
      if (hasManagerRole) {
        managedProjectsCount = await Project.countDocuments({ createdBy: req.params.id });
        if (managedProjectsCount > 0) {
          if (!replacementManagerId) {
            return res.status(400).json({ message: 'Bắt buộc chọn Manager thay thế để bàn giao các dự án đang quản lý' });
          }
          replacementManager = await User.findOne({ _id: replacementManagerId, roles: 'manager', isActive: true });
          if (!replacementManager) {
            return res.status(400).json({ message: 'Manager thay thế không hợp lệ hoặc đang bị vô hiệu hóa' });
          }
          if (replacementManagerId.toString() === req.params.id) {
            return res.status(400).json({ message: 'Không thể chuyển giao dự án cho chính người bị vô hiệu hóa' });
          }
        }
      }

      // --- Tiến hành cập nhật dữ liệu an toàn ---
      
      // 1. Chuyển giao dự án/task nếu có role manager
      if (hasManagerRole && managedProjectsCount > 0) {
        await Project.updateMany({ createdBy: req.params.id }, { createdBy: replacementManagerId });
        await Task.updateMany({ createdBy: req.params.id }, { createdBy: replacementManagerId });
      }

      // 2. Loại khỏi dự án/task nếu có role employee
      if (hasEmployeeRole) {
        await ProjectMember.deleteMany({ user: req.params.id });
        await Assignment.deleteMany({ assignee: req.params.id });
      }
    }

    // Cập nhật trạng thái
    user.isActive = isActive;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    // --- Gửi email thông báo ---
    const userName = `${user.firstName} ${user.lastName}`;
    
    if (isActive === false && wasActive === true) {
      const replacementName = replacementManager ? `${replacementManager.firstName} ${replacementManager.lastName}` : 'Manager khác';

      // Mail cho tài khoản bị khóa
      mailService.sendAccountDeactivatedMail(user.email, userName, hasEmployeeRole, hasManagerRole, replacementName, managedProjectsCount).catch(err => {
        console.error(`Lỗi gửi mail vô hiệu hóa tài khoản cho ${user.email}:`, err.message);
      });

      // Mail cho manager nhận bàn giao
      if (hasManagerRole && managedProjectsCount > 0 && replacementManager) {
        mailService.sendManagerRoleAssignedMail(replacementManager.email, replacementName, userName, managedProjectsCount).catch(err => {
          console.error(`Lỗi gửi mail bàn giao quản trị cho ${replacementManager.email}:`, err.message);
        });
      }
    } else if (isActive === true && wasActive === false) {
      // Mail cho tài khoản được kích hoạt lại
      mailService.sendAccountActivatedMail(user.email, userName).catch(err => {
        console.error(`Lỗi gửi mail kích hoạt tài khoản cho ${user.email}:`, err.message);
      });
    }

    res.status(200).json({
      message: `Tài khoản đã được ${isActive ? 'kích hoạt' : 'vô hiệu hóa'}`,
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Xóa người dùng (Chỉ Admin)
 * DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    // Admin không thể xóa chính mình
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản đang đăng nhập' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Xóa dữ liệu liên quan đến người dùng
    await ProjectMember.deleteMany({ user: req.params.id });
    await Assignment.deleteMany({ assignee: req.params.id });

    res.status(200).json({ message: `Người dùng "${user.email}" đã được xóa` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy thông tin ảnh hưởng của người dùng đối với các dự án và task (chỉ Admin)
 * GET /api/users/:id/impact
 */
exports.getUserImpact = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // 1. Ảnh hưởng vai trò Employee:
    const employeeProjectsCount = await ProjectMember.countDocuments({ user: userId });
    const employeeTasksCount = await Assignment.countDocuments({ assignee: userId });

    // 2. Ảnh hưởng vai trò Manager:
    // Tìm các dự án do user quản lý
    const managedProjects = await Project.find({ createdBy: userId }).select('_id');
    const managedProjectIds = managedProjects.map(p => p._id);
    const managerProjectsCount = managedProjectIds.length;
    const managerTasksCount = await Task.countDocuments({ project: { $in: managedProjectIds } });

    res.status(200).json({
      success: true,
      data: {
        employee: {
          projectsCount: employeeProjectsCount,
          tasksCount: employeeTasksCount,
        },
        manager: {
          projectsCount: managerProjectsCount,
          tasksCount: managerTasksCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};
