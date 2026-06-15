require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Project = require('./src/models/project.model');
const Task = require('./src/models/task.model');
const ProjectMember = require('./src/models/projectMember.model');
const Assignment = require('./src/models/assignment.model');
const { hasRole } = require('./src/middleware/auth.middleware');

// Real buildUserContext function copied directly
const buildUserContext = async (user) => {
  const userId = user._id;
  const isAdmin = hasRole(user, 'admin');
  const isManager = hasRole(user, 'manager');
  const isEmployee = hasRole(user, 'employee');

  let projects = [];
  let tasks = [];

  try {
    if (isAdmin) {
      const [allProjects, allTasks] = await Promise.all([
        Project.find().lean(),
        Task.find().populate('project', 'name').lean()
      ]);
      
      projects = allProjects.map(p => {
        if (!p || !p._id) return null;
        return {
          id: p._id.toString(),
          name: p.name || 'Không có tên',
          description: p.description || '',
          startDate: p.startDate,
          endDate: p.endDate,
          progress: p.progress || 0,
          userRole: 'admin'
        };
      }).filter(Boolean);

      tasks = allTasks.map(t => {
        if (!t || !t._id) return null;
        return {
          id: t._id.toString(),
          name: t.name || 'Không có tên',
          description: t.description || '',
          status: t.status || 'todo',
          priority: t.priority || 'medium',
          startDate: t.startDate,
          dueDate: t.dueDate,
          projectName: (t.project && t.project.name) ? t.project.name : 'Không có dự án',
          userRole: 'admin'
        };
      }).filter(Boolean);
    } else {
      let managerProjectIds = [];
      let employeeProjectIds = [];
      let employeeAssignedTaskIds = [];

      if (isManager) {
        const myProjects = await Project.find({ createdBy: userId }).select('_id').lean();
        managerProjectIds = myProjects.map(p => p._id ? p._id.toString() : null).filter(Boolean);
      }

      if (isEmployee) {
        const memberships = await ProjectMember.find({ user: userId }).select('project').lean();
        employeeProjectIds = memberships.map(m => m.project ? m.project.toString() : null).filter(Boolean);

        const myAssignments = await Assignment.find({ assignee: userId }).populate({
          path: 'task',
          select: 'project'
        }).lean();

        myAssignments.forEach(a => {
          if (a.task && a.task._id) {
            employeeAssignedTaskIds.push(a.task._id.toString());
            if (a.task.project) {
              employeeProjectIds.push(a.task.project.toString());
            }
          }
        });

        employeeProjectIds = Array.from(new Set(employeeProjectIds));
      }

      const allUniqueProjectIds = Array.from(new Set([...managerProjectIds, ...employeeProjectIds]));
      const dbProjects = await Project.find({ _id: { $in: allUniqueProjectIds } }).lean();

      projects = dbProjects.map(p => {
        if (!p || !p._id) return null;
        const pidStr = p._id.toString();
        const isCreator = managerProjectIds.includes(pidStr);
        const isMember = employeeProjectIds.includes(pidStr);
        
        let userRole = 'employee';
        if (isCreator && isMember) userRole = 'both';
        else if (isCreator) userRole = 'manager';
        
        return {
          id: pidStr,
          name: p.name || 'Không có tên',
          description: p.description || '',
          startDate: p.startDate,
          endDate: p.endDate,
          progress: p.progress || 0,
          userRole
        };
      }).filter(Boolean);

      const taskFilter = {
        $or: [
          { project: { $in: managerProjectIds } },
          { project: { $in: employeeProjectIds } },
          { _id: { $in: employeeAssignedTaskIds } }
        ]
      };

      const dbTasks = await Task.find(taskFilter).populate('project', 'name createdBy').lean();
      const taskIds = dbTasks.map(t => t._id);
      const assignments = await Assignment.find({ task: { $in: taskIds } }).select('task assignee').lean();

      tasks = dbTasks.map(t => {
        if (!t || !t._id) return null;
        const tidStr = t._id.toString();
        const isProjectManager = t.project && t.project._id && managerProjectIds.includes(t.project._id.toString());
        const isAssigned = assignments.some(a => a.task && a.assignee && a.task.toString() === tidStr && a.assignee.toString() === userId.toString());

        let userRole = 'employee';
        if (isProjectManager && isAssigned) userRole = 'both';
        else if (isProjectManager) userRole = 'manager';

        return {
          id: tidStr,
          name: t.name || 'Không có tên',
          description: t.description || '',
          status: t.status || 'todo',
          priority: t.priority || 'medium',
          startDate: t.startDate,
          dueDate: t.dueDate,
          projectName: (t.project && t.project.name) ? t.project.name : 'Không có dự án',
          userRole
        };
      }).filter(Boolean);
    }
  } catch (err) {
    console.error('Error in buildUserContext:', err);
  }

  return {
    currentDate: "2026-05-28T08:00:00+07:00",
    currentUser: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      roles: user.roles && user.roles.length > 0 ? user.roles : [user.role]
    },
    projects,
    tasks
  };
};

async function printContexts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("=== DB CONTEXT EXTRACTION START ===");
    
    // 1. Employee Context
    const emp = await User.findOne({ email: "binh.employee@gmail.com" });
    if (emp) {
      const empCtx = await buildUserContext(emp);
      console.log("\n--- CONTEXT FOR EMPLOYEE (binh.employee@gmail.com) ---");
      console.log(JSON.stringify(empCtx, null, 2));
    }

    // 2. Manager Context
    const mgr = await User.findOne({ email: "hung.manager@gmail.com" });
    if (mgr) {
      const mgrCtx = await buildUserContext(mgr);
      console.log("\n--- CONTEXT FOR MANAGER (hung.manager@gmail.com) ---");
      console.log(JSON.stringify(mgrCtx, null, 2));
    }

    // 3. Admin Context
    const adm = await User.findOne({ email: "admin@gmail.com" });
    if (adm) {
      const admCtx = await buildUserContext(adm);
      console.log("\n--- CONTEXT FOR ADMIN (admin@gmail.com) ---");
      // Mẫu che bớt danh sách nếu dài nhưng in ra cấu trúc
      console.log(JSON.stringify(admCtx, null, 2));
    }

    console.log("\n=== DB CONTEXT EXTRACTION END ===");
  } catch (err) {
    console.error("Failed to print contexts:", err);
  } finally {
    await mongoose.disconnect();
  }
}

printContexts();
