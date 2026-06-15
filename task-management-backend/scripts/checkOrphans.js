// scripts/checkOrphans.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Project = require('../src/models/project.model');
const Task = require('../src/models/task.model');
const ProjectMember = require('../src/models/projectMember.model');
const Assignment = require('../src/models/assignment.model');

async function run() {
  const isApply = process.argv.includes('--apply') || process.env.CLEANUP_APPLY === 'true';

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected successfully.\n');

    // 1. Fetch all records from key collections
    const [users, projects, tasks, projectMembers, assignments] = await Promise.all([
      User.find().lean(),
      Project.find().lean(),
      Task.find().lean(),
      ProjectMember.find().lean(),
      Assignment.find().lean()
    ]);

    // Create lookup sets of valid IDs
    const userIds = new Set(users.map(u => u._id.toString()));
    const projectIds = new Set(projects.map(p => p._id.toString()));
    const taskIds = new Set(tasks.map(t => t._id.toString()));

    console.log('📊 COLLECTION STATISTICS:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Tasks: ${tasks.length}`);
    console.log(`   - ProjectMembers: ${projectMembers.length}`);
    console.log(`   - Assignments: ${assignments.length}\n`);

    // 2. Identify Orphans in ProjectMembers
    const orphanMembers = [];
    for (const pm of projectMembers) {
      const issues = [];
      const pid = pm.project ? pm.project.toString() : null;
      const uid = pm.user ? pm.user.toString() : null;

      if (!pid || !projectIds.has(pid)) {
        issues.push(`project (${pid}) does not exist`);
      }
      if (!uid || !userIds.has(uid)) {
        issues.push(`user (${uid}) does not exist`);
      }

      if (issues.length > 0) {
        orphanMembers.push({
          id: pm._id.toString(),
          record: pm,
          reasons: issues
        });
      }
    }

    // 3. Identify Orphans in Assignments
    const orphanAssignments = [];
    for (const a of assignments) {
      const issues = [];
      const tid = a.task ? a.task.toString() : null;
      const assigneeId = a.assignee ? a.assignee.toString() : null;
      const assignedById = a.assignedBy ? a.assignedBy.toString() : null;

      if (!tid || !taskIds.has(tid)) {
        issues.push(`task (${tid}) does not exist`);
      }
      if (!assigneeId || !userIds.has(assigneeId)) {
        issues.push(`assignee user (${assigneeId}) does not exist`);
      }
      if (!assignedById || !userIds.has(assignedById)) {
        issues.push(`assignedBy user (${assignedById}) does not exist`);
      }

      if (issues.length > 0) {
        orphanAssignments.push({
          id: a._id.toString(),
          record: a,
          reasons: issues
        });
      }
    }

    // 4. Identify Other Orphans (Tasks and Projects)
    const orphanTasks = [];
    for (const t of tasks) {
      const issues = [];
      const pid = t.project ? t.project.toString() : null;
      const creatorId = t.createdBy ? t.createdBy.toString() : null;

      if (!pid || !projectIds.has(pid)) {
        issues.push(`project (${pid}) does not exist`);
      }
      if (!creatorId || !userIds.has(creatorId)) {
        issues.push(`creator user (${creatorId}) does not exist`);
      }

      if (issues.length > 0) {
        orphanTasks.push({
          id: t._id.toString(),
          name: t.name,
          reasons: issues
        });
      }
    }

    const orphanProjects = [];
    for (const p of projects) {
      const issues = [];
      const creatorId = p.createdBy ? p.createdBy.toString() : null;

      if (!creatorId || !userIds.has(creatorId)) {
        issues.push(`createdBy manager user (${creatorId}) does not exist`);
      }

      if (issues.length > 0) {
        orphanProjects.push({
          id: p._id.toString(),
          name: p.name,
          reasons: issues
        });
      }
    }

    // 5. Output Report
    console.log('🔍 ORPHAN DATA REPORT:');
    console.log(`   - Orphan ProjectMembers: ${orphanMembers.length}`);
    console.log(`   - Orphan Assignments: ${orphanAssignments.length}`);
    console.log(`   - Tasks with orphan project/creator refs: ${orphanTasks.length}`);
    console.log(`   - Projects with orphan creator refs: ${orphanProjects.length}\n`);

    if (orphanMembers.length > 0) {
      console.log('⚠️ Orphan ProjectMembers details:');
      orphanMembers.forEach(item => {
        console.log(`   * Member ID: ${item.id} | Project ID: ${item.record.project} | User ID: ${item.record.user} | Reasons: ${item.reasons.join(', ')}`);
      });
    }

    if (orphanAssignments.length > 0) {
      console.log('\n⚠️ Orphan Assignments details:');
      orphanAssignments.forEach(item => {
        console.log(`   * Assignment ID: ${item.id} | Task ID: ${item.record.task} | Assignee ID: ${item.record.assignee} | Reasons: ${item.reasons.join(', ')}`);
      });
    }

    if (orphanTasks.length > 0) {
      console.log('\n⚠️ Tasks referencing non-existent projects or users:');
      orphanTasks.forEach(item => {
        console.log(`   * Task ID: ${item.id} ("${item.name}") | Reasons: ${item.reasons.join(', ')}`);
      });
    }

    if (orphanProjects.length > 0) {
      console.log('\n⚠️ Projects referencing non-existent creators:');
      orphanProjects.forEach(item => {
        console.log(`   * Project ID: ${item.id} ("${item.name}") | Reasons: ${item.reasons.join(', ')}`);
      });
    }

    console.log('\n----------------------------------------');
    if (isApply) {
      console.log('🚀 CLEANUP MODE: Active');
      
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        let pmDeletedCount = 0;
        let assignDeletedCount = 0;

        if (orphanMembers.length > 0) {
          const pmIdsToDelete = orphanMembers.map(item => item.id);
          const pmRes = await ProjectMember.deleteMany({ _id: { $in: pmIdsToDelete } }, { session });
          pmDeletedCount = pmRes.deletedCount;
          console.log(`   - Deleted ${pmDeletedCount} orphan ProjectMember records.`);
        }

        if (orphanAssignments.length > 0) {
          const assignIdsToDelete = orphanAssignments.map(item => item.id);
          const assignRes = await Assignment.deleteMany({ _id: { $in: assignIdsToDelete } }, { session });
          assignDeletedCount = assignRes.deletedCount;
          console.log(`   - Deleted ${assignDeletedCount} orphan Assignment records.`);
        }

        await session.commitTransaction();
        console.log('✅ Cleanup transaction committed successfully.');
      } catch (err) {
        await session.abortTransaction();
        console.error('❌ Cleanup transaction failed and was aborted:', err.message);
        throw err;
      } finally {
        session.endSession();
      }

      // Verification run
      console.log('\n🔄 Running verification scan...');
      const [finalPMs, finalAssigns] = await Promise.all([
        ProjectMember.find().lean(),
        Assignment.find().lean()
      ]);
      const remainingOrphanPMs = finalPMs.filter(pm => !projectIds.has(pm.project?.toString()) || !userIds.has(pm.user?.toString()));
      const remainingOrphanAssigns = finalAssigns.filter(a => !taskIds.has(a.task?.toString()) || !userIds.has(a.assignee?.toString()) || !userIds.has(a.assignedBy?.toString()));
      console.log(`   - Remaining Orphan ProjectMembers: ${remainingOrphanPMs.length}`);
      console.log(`   - Remaining Orphan Assignments: ${remainingOrphanAssigns.length}`);
      if (remainingOrphanPMs.length === 0 && remainingOrphanAssigns.length === 0) {
        console.log('🎉 Verification complete: No orphan memberships or assignments remain!');
      } else {
        console.log('⚠️ Warning: Some orphan records were not fully cleaned up.');
      }
    } else {
      console.log('💡 DRY-RUN MODE: No changes were made to the database.');
      console.log('💡 Run with `--apply` flag or CLEANUP_APPLY=true to perform the actual cleanup of memberships and assignments.');
    }
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

run();
