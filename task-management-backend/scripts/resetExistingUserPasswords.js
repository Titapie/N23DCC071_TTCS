/**
 * scripts/resetExistingUserPasswords.js
 *
 * Mục đích: Reset password của TẤT CẢ user hiện có trong database
 *           thành mật khẩu mặc định: Anh12345@
 *
 * Lưu ý:
 *  - Không xóa bất kỳ user, project, task, assignment, member nào.
 *  - Không seed dữ liệu mới.
 *  - Chỉ cập nhật field `password`.
 *  - Password được hash bằng bcryptjs (salt rounds = 10) — đúng như backend.
 *
 * Cách chạy: npm run reset:passwords
 */

require('dotenv').config(); // Load biến môi trường từ .env
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import đúng User model thật của dự án
const User = require('../src/models/user.model');

const DEFAULT_PASSWORD = 'Anh12345@';
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Lỗi: Không tìm thấy biến MONGO_URI trong file .env');
  process.exit(1);
}

async function resetPasswords() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Đếm số user hiện có (không lọc, lấy tất cả)
    const totalUsers = await User.countDocuments();
    console.log(`📋 Số user hiện có trong database: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('⚠️  Không có user nào trong database. Không có gì để cập nhật.');
      return;
    }

    // Hash mật khẩu mặc định (đúng theo cách backend dùng: bcryptjs, salt = 10)
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Cập nhật CHỈ field password cho TẤT CẢ user
    // updateMany không kích hoạt pre-save middleware (nhưng User model không có middleware này)
    // nên hash thủ công trước là đúng
    const result = await User.updateMany(
      {}, // match tất cả user
      { $set: { password: hashedPassword } } // chỉ set lại password
    );

    console.log(`✅ Đã cập nhật mật khẩu cho ${result.modifiedCount} / ${totalUsers} user.`);
    console.log('🎉 Hoàn thành! Tất cả user có thể đăng nhập bằng mật khẩu: Anh12345@');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình reset password:', error.message);
    process.exit(1);
  } finally {
    // Đóng kết nối sau khi hoàn thành
    await mongoose.disconnect();
    console.log('🔌 Đã đóng kết nối MongoDB.');
  }
}

resetPasswords();
