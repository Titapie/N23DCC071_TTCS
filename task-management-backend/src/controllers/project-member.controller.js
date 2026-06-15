// src/controllers/project-member.controller.js
const ProjectMember = require('../models/projectMember.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const mailService = require('../services/mail.service');

/**
 * Thêm thành viên vào dự án
 * POST /api/project-members
 * Chỉ Manager của dự án hoặc Admin mới được phép.
 */
exports.addMember = async (req, res) => {
  const { projectId, userId, role } = req.body;

  try {
    if (!projectId || !userId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp projectId và userId' });
    }

    const [project, user] = await Promise.all([
      Project.findById(projectId),
      User.findById(userId),
    ]);

    if (!project) return res.status(404).json({ message: 'Dự án không tồn tại' });
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    // Kiểm tra quyền: chỉ manager của dự án hoặc admin mới được thêm thành viên
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền thêm thành viên vào dự án này' });
    }

    const existing = await ProjectMember.findOne({ project: projectId, user: userId });
    if (existing) {
      return res.status(409).json({ message: 'Người dùng đã là thành viên của dự án này' });
    }

    const member = await ProjectMember.create({
      project: projectId,
      user: userId,
      role: role || 'member',
    });

    const populated = await member.populate('user', 'firstName lastName email');

    // Gửi email thông báo (không tạo notification trong DB)
    mailService.sendProjectInvitationMail(user.email, user.firstName, project.name).catch(err => {
      console.error('Lỗi gửi email mời vào dự án:', err.message);
    });

    res.status(201).json({ message: 'Thêm thành viên thành công', data: populated });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Xóa thành viên khỏi dự án
 * DELETE /api/project-members/:id
 * Chỉ Manager của dự án hoặc Admin mới được phép.
 */
exports.removeMember = async (req, res) => {
  try {
    // Tìm bản ghi member để lấy projectId, kiểm tra quyền
    const member = await ProjectMember.findById(req.params.id).populate('project');
    if (!member) {
      return res.status(404).json({ message: 'Bản ghi thành viên không tồn tại' });
    }

    const project = member.project;
    if (
      req.user.role !== 'admin' &&
      project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa thành viên khỏi dự án này' });
    }

    await ProjectMember.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Đã xóa thành viên khỏi dự án' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Cập nhật vai trò thành viên
 * PATCH /api/project-members/:id
 * Chỉ Manager của dự án hoặc Admin mới được phép.
 */
exports.updateMemberRole = async (req, res) => {
  const { role } = req.body;
  try {
    const member = await ProjectMember.findById(req.params.id).populate('project');
    if (!member) {
      return res.status(404).json({ message: 'Bản ghi thành viên không tồn tại' });
    }

    const project = member.project;
    if (
      req.user.role !== 'admin' &&
      project.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật vai trò thành viên trong dự án này' });
    }

    member.role = role;
    await member.save();
    await member.populate('user', 'firstName lastName email');

    res.status(200).json({ message: 'Cập nhật vai trò thành công', data: member });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};
