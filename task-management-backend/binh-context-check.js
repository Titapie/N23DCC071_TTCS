require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const { hasRole } = require('./src/middleware/auth.middleware');
const Project = require('./src/models/project.model');
const Task = require('./src/models/task.model');
const ProjectMember = require('./src/models/projectMember.model');
const Assignment = require('./src/models/assignment.model');

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
      projects = allProjects;
      tasks = allTasks;
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

      projects = dbProjects;

      const taskFilter = {
        $or: [
          { project: { $in: managerProjectIds } },
          { project: { $in: employeeProjectIds } },
          { _id: { $in: employeeAssignedTaskIds } }
        ]
      };

      const dbTasks = await Task.find(taskFilter).populate('project', 'name createdBy').lean();
      tasks = dbTasks;
    }
  } catch (err) {
    console.error(err);
  }

  return { projects, tasks };
};

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const binh = await User.findOne({ email: "binh.employee@gmail.com" });
  const context = await buildUserContext(binh);
  console.log(`Binh projects count: ${context.projects.length}`);
  console.log(`Binh tasks count: ${context.tasks.length}`);
  console.log("Binh projects:", context.projects.map(p => p.name));
  console.log("Binh tasks:", context.tasks.map(t => t.name));
  await mongoose.disconnect();
}

test();
