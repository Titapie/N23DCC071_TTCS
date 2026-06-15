// src/seed.js
// Script khởi tạo dữ liệu mẫu cho database task_management
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/user.model');
const Project = require('./models/project.model');
const Task = require('./models/task.model');
const ProjectMember = require('./models/projectMember.model');
const Assignment = require('./models/assignment.model');
const Notification = require('./models/notification.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_management';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅  MongoDB connected');

    // ── Xóa dữ liệu cũ ──────────────────────────────────────────────────────
    await Promise.all([
      User.deleteMany(),
      Project.deleteMany(),
      Task.deleteMany(),
      ProjectMember.deleteMany(),
      Assignment.deleteMany(),
      Notification.deleteMany(),
    ]);
    console.log('🗑️   Cleared old data');

    // ── Tạo Users ─────────────────────────────────────────────────────────────
    const hashedPw = await bcrypt.hash('123456', 10);

    const [admin, manager1, manager2, emp1, emp2, emp3] = await User.create([
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin.taskapp@gmail.com',
        password: hashedPw,
        role: 'admin',
      },
      {
        firstName: 'Nguyễn',
        lastName: 'Văn Hùng',
        email: 'hung.manager@gmail.com',
        password: hashedPw,
        role: 'manager',
      },
      {
        firstName: 'Trần',
        lastName: 'Thị Mai',
        email: 'mai.manager@gmail.com',
        password: hashedPw,
        role: 'manager',
      },
      {
        firstName: 'Lê',
        lastName: 'Văn An',
        email: 'an.employee@gmail.com',
        password: hashedPw,
        role: 'employee',
      },
      {
        firstName: 'Phạm',
        lastName: 'Thị Bình',
        email: 'binh.employee@gmail.com',
        password: hashedPw,
        role: 'employee',
      },
      {
        firstName: 'Hoàng',
        lastName: 'Văn Cường',
        email: 'cuong.employee@gmail.com',
        password: hashedPw,
        role: 'employee',
      },
    ]);
    console.log('👥  Created 6 users');

    // ── Tạo Projects ─────────────────────────────────────────────────────────
    const [project1, project2] = await Project.create([
      {
        name: 'Hệ thống quản lý nhân sự',
        description: 'Xây dựng phần mềm quản lý nhân sự nội bộ cho công ty',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-30'),
        progress: 40,
        createdBy: manager1._id,
      },
      {
        name: 'Website thương mại điện tử',
        description: 'Phát triển website bán hàng trực tuyến cho khách hàng',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-12-31'),
        progress: 15,
        createdBy: manager2._id,
      },
    ]);
    console.log('📁  Created 2 projects');

    // ── Tạo ProjectMembers ───────────────────────────────────────────────────
    await ProjectMember.create([
      { project: project1._id, user: emp1._id, role: 'lead', joinedAt: new Date('2026-01-05') },
      { project: project1._id, user: emp2._id, role: 'member', joinedAt: new Date('2026-01-05') },
      { project: project2._id, user: emp2._id, role: 'member', joinedAt: new Date('2026-03-05') },
      { project: project2._id, user: emp3._id, role: 'lead', joinedAt: new Date('2026-03-05') },
    ]);
    console.log('🤝  Created project members');

    // ── Tạo Tasks ─────────────────────────────────────────────────────────────
    const [task1, task2, task3, task4, task5] = await Task.create([
      {
        name: 'Thiết kế database',
        description: 'Phân tích yêu cầu và thiết kế schema database cho hệ thống nhân sự',
        status: 'done',
        priority: 'high',
        startDate: new Date('2026-01-10'),
        dueDate: new Date('2026-01-20'),
        project: project1._id,
        createdBy: manager1._id,
      },
      {
        name: 'Xây dựng API backend',
        description: 'Phát triển REST API cho module quản lý nhân viên',
        status: 'in_progress',
        priority: 'high',
        startDate: new Date('2026-01-21'),
        dueDate: new Date('2026-03-01'),
        project: project1._id,
        createdBy: manager1._id,
      },
      {
        name: 'Thiết kế giao diện người dùng',
        description: 'Thiết kế UI/UX cho hệ thống nhân sự theo Figma',
        status: 'in_progress',
        priority: 'medium',
        startDate: new Date('2026-01-21'),
        dueDate: new Date('2026-02-28'),
        project: project1._id,
        createdBy: manager1._id,
      },
      {
        name: 'Phân tích yêu cầu website',
        description: 'Thu thập và phân tích yêu cầu từ khách hàng cho website TMĐT',
        status: 'done',
        priority: 'high',
        startDate: new Date('2026-03-05'),
        dueDate: new Date('2026-03-15'),
        project: project2._id,
        createdBy: manager2._id,
      },
      {
        name: 'Phát triển trang chủ',
        description: 'Lập trình giao diện trang chủ và các trang sản phẩm',
        status: 'todo',
        priority: 'medium',
        startDate: new Date('2026-03-20'),
        dueDate: new Date('2026-05-31'),
        project: project2._id,
        createdBy: manager2._id,
      },
    ]);
    console.log('📋  Created 5 tasks');

    // ── Tạo Assignments (Phân công) ────────────────────────────────────────────
    await Assignment.create([
      { task: task1._id, assignee: emp1._id, assignedBy: manager1._id, assignedAt: new Date('2026-01-10') },
      { task: task2._id, assignee: emp1._id, assignedBy: manager1._id, assignedAt: new Date('2026-01-21') },
      { task: task2._id, assignee: emp2._id, assignedBy: manager1._id, assignedAt: new Date('2026-01-21') },
      { task: task3._id, assignee: emp2._id, assignedBy: manager1._id, assignedAt: new Date('2026-01-21') },
      { task: task4._id, assignee: emp3._id, assignedBy: manager2._id, assignedAt: new Date('2026-03-05') },
      { task: task5._id, assignee: emp3._id, assignedBy: manager2._id, assignedAt: new Date('2026-03-20') },
    ]);
    console.log('📌  Created assignments');

    // ── Tạo Notifications ─────────────────────────────────────────────────────
    await Notification.create([
      {
        title: 'Bạn được phân công công việc mới',
        message: `Bạn được giao công việc "Thiết kế database" trong dự án "Hệ thống quản lý nhân sự"`,
        user: emp1._id,
        type: 'assignment',
        refId: task1._id,
        refModel: 'Task',
        isRead: true,
      },
      {
        title: 'Bạn được phân công công việc mới',
        message: `Bạn được giao công việc "Xây dựng API backend" trong dự án "Hệ thống quản lý nhân sự"`,
        user: emp1._id,
        type: 'assignment',
        refId: task2._id,
        refModel: 'Task',
        isRead: false,
      },
      {
        title: 'Dự án mới được tạo',
        message: `Dự án "Website thương mại điện tử" đã được tạo và bạn là thành viên`,
        user: emp3._id,
        type: 'project',
        refId: project2._id,
        refModel: 'Project',
        isRead: false,
      },
    ]);
    console.log('🔔  Created notifications');

    // ── Tóm tắt ──────────────────────────────────────────────────────────────
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Seed hoàn thành! Tài khoản mẫu:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin   : admin.taskapp@gmail.com   / 123456');
    console.log('  Manager : hung.manager@gmail.com    / 123456');
    console.log('  Manager : mai.manager@gmail.com     / 123456');
    console.log('  Employee: an.employee@gmail.com     / 123456');
    console.log('  Employee: binh.employee@gmail.com   / 123456');
    console.log('  Employee: cuong.employee@gmail.com  / 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌  Seed thất bại:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
