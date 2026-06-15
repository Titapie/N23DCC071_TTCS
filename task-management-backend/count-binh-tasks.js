require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Project = require('./src/models/project.model');
const Task = require('./src/models/task.model');
const ProjectMember = require('./src/models/projectMember.model');
const Assignment = require('./src/models/assignment.model');

async function checkBinhData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const binh = await User.findOne({ email: "binh.employee@gmail.com" });
    if (!binh) {
      console.log("User Binh not found!");
      return;
    }

    console.log(`User ID: ${binh._id}`);

    // Check Project Memberships
    const memberships = await ProjectMember.find({ user: binh._id }).populate('project').lean();
    console.log(`\n--- MEMBERSHIPS FOUND (${memberships.length}) ---`);
    memberships.forEach(m => {
      console.log(`- Project ID: ${m.project._id}, Project Name: ${m.project.name}`);
    });

    // Check Assignments
    const assignments = await Assignment.find({ assignee: binh._id }).populate({
      path: 'task',
      populate: { path: 'project' }
    }).lean();
    
    console.log(`\n--- ASSIGNMENTS FOUND (${assignments.length}) ---`);
    assignments.forEach(a => {
      if (a.task) {
        console.log(`- Task ID: ${a.task._id}, Task Name: ${a.task.name}, Project Name: ${a.task.project ? a.task.project.name : 'null'}`);
      } else {
        console.log(`- Assignment contains null task (ID: ${a._id})`);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkBinhData();
