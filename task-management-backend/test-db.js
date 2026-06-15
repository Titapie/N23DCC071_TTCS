require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Project = require('./src/models/project.model');
const Task = require('./src/models/task.model');
const ProjectMember = require('./src/models/projectMember.model');
const Assignment = require('./src/models/assignment.model');
const { hasRole } = require('./src/middleware/auth.middleware');

// Import hàm buildUserContext từ controller (hoặc copy trực tiếp vào đây để test)
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
      console.log("Found unique project IDs for user:", allUniqueProjectIds);
      
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
      console.log(`Found ${dbTasks.length} tasks in DB for user.`);
      
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
    console.error('[buildUserContext] Error build context:', err);
    throw err;
  }

  return { projects, tasks };
};

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Lấy user bằng email cụ thể
    const user = await User.findOne({ email: "hoanganh142005@gmail.com" });
    if (!user) {
      console.error("User hoanganh142005@gmail.com not found.");
      return;
    }
    
    // In ra danh sách tất cả email để tham chiếu
    const allUsers = await User.find().select('email firstName lastName').lean();
    console.log("All users in database:");
    allUsers.forEach(u => console.log(`- ${u.email} (${u.firstName} ${u.lastName})`));
    
    console.log("\nTesting user:", user.firstName, user.lastName, "Email:", user.email, "Roles:", user.roles, "Role:", user.role);

    const context = await buildUserContext(user);
    console.log("Successfully built user context!");
    console.log(`Projects count: ${context.projects.length}`);
    console.log(`Tasks count: ${context.tasks.length}`);
  } catch (error) {
    console.error("TEST FAILED:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

test();
