/**
 * scripts/migrate-roles.js
 * Migration script: Thêm field `roles` array cho tất cả user chưa có.
 * Chạy 1 lần trước khi deploy backend mới.
 * Idempotent: chạy lần 2 không thay đổi gì.
 *
 * Cách chạy:
 *   node scripts/migrate-roles.js
 *
 * QUAN TRỌNG: Backup database trước khi chạy!
 *   mongodump --db <tên_db> --out ./backup_before_migration
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/task_management';

async function migrate() {
  console.log('🔗 Connecting to MongoDB:', MONGO_URI.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // Tìm tất cả user chưa có roles hoặc roles rỗng
  const usersToMigrate = await usersCollection
    .find({
      $or: [
        { roles: { $exists: false } },
        { roles: null },
        { roles: { $size: 0 } },
      ],
    })
    .toArray();

  console.log(`📋 Tìm thấy ${usersToMigrate.length} user cần migrate`);

  if (usersToMigrate.length === 0) {
    console.log('✅ Tất cả user đã có roles. Không cần migrate.');
    await mongoose.disconnect();
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersToMigrate) {
    try {
      const currentRole = user.role || 'employee';
      const newRoles = [currentRole];

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { roles: newRoles } }
      );

      console.log(`  ✓ ${user.email} (${currentRole}) → roles: [${newRoles.join(', ')}]`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ Lỗi với user ${user.email}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n📊 Kết quả migration:');
  console.log(`   ✅ Thành công: ${successCount}`);
  console.log(`   ❌ Lỗi: ${errorCount}`);

  // Kiểm tra lần cuối
  const remaining = await usersCollection.countDocuments({
    $or: [
      { roles: { $exists: false } },
      { roles: null },
      { roles: { $size: 0 } },
    ],
  });

  if (remaining > 0) {
    console.warn(`\n⚠️  Còn ${remaining} user chưa được migrate. Kiểm tra lỗi ở trên.`);
  } else {
    console.log('\n🎉 Migration hoàn thành! Tất cả user đều có field roles.');
  }

  // Thống kê phân phối
  const stats = await usersCollection.aggregate([
    { $group: { _id: '$roles', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();

  console.log('\n📈 Phân phối roles sau migration:');
  stats.forEach(s => {
    console.log(`   [${(s._id || []).join(', ')}]: ${s.count} user`);
  });

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
