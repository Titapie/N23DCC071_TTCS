const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Đây là App Password của Gmail
  },
});

exports.sendRegistrationOTPMail = async (email, otp) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Mã OTP kích hoạt tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Kích hoạt tài khoản</h2>
        <p>Chào bạn,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản Task Management. Vui lòng sử dụng mã OTP dưới đây để kích hoạt tài khoản của bạn:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937; margin: 20px 0; border-radius: 4px;">
          ${otp}
        </div>
        <p>Mã OTP này có hiệu lực trong <b>15 phút</b>. Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendForgotPasswordOTPMail = async (email, otp) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Mã OTP xác thực đặt lại mật khẩu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Xác thực mật khẩu</h2>
        <p>Chào bạn,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Task Management. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quy trình:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937; margin: 20px 0; border-radius: 4px;">
          ${otp}
        </div>
        <p>Mã OTP này có hiệu lực trong <b>10 phút</b>. Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendWelcomeMail = async (email, name) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Chào mừng bạn đến với Task Management App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Chào mừng ${name}!</h2>
        <p>Tài khoản của bạn đã được tạo và kích hoạt thành công.</p>
        <p>Chúc bạn có trải nghiệm tuyệt vời cùng Task Management App!</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

exports.sendProjectInvitationMail = async (email, userName, projectName) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `Bạn đã được thêm vào dự án: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Thông báo dự án mới</h2>
        <p>Chào ${userName},</p>
        <p>Bạn vừa được thêm vào dự án <b>${projectName}</b> trên hệ thống Task Management.</p>
        <p>Vui lòng đăng nhập vào ứng dụng để xem chi tiết và bắt đầu công việc.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi manager giao task cho nhân viên
 * @param {string} email - Email nhân viên
 * @param {string} userName - Tên nhân viên
 * @param {string} taskName - Tên task
 * @param {string} projectName - Tên dự án
 * @param {string} assignedByName - Tên người giao việc
 * @param {Date|null} dueDate - Hạn chót (có thể null)
 */
exports.sendTaskAssignmentMail = async (email, userName, taskName, projectName, assignedByName, dueDate) => {
  const dueDateStr = dueDate
    ? `<p>⏰ Hạn chót: <b>${new Date(dueDate).toLocaleString('vi-VN')}</b></p>`
    : '';

  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `Bạn vừa được giao việc: ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #4f46e5;">
        <h2 style="color: #4f46e5; text-align: center;">Công việc mới được giao</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p><b>${assignedByName}</b> vừa giao cho bạn công việc sau:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 16px; font-weight: bold;">📋 ${taskName}</p>
          <p style="margin: 8px 0 0; color: #6b7280;">Thuộc dự án: <b>${projectName}</b></p>
        </div>
        ${dueDateStr}
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và bắt đầu thực hiện công việc.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email thông báo khi manager sửa deadline dự án
 * @param {string} email - Email thành viên
 * @param {string} userName - Tên thành viên
 * @param {string} projectName - Tên dự án
 * @param {Date} oldEndDate - Hạn cũ
 * @param {Date} newEndDate - Hạn mới
 */
exports.sendProjectDeadlineChangedMail = async (email, userName, projectName, oldEndDate, newEndDate) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `Thay đổi hạn dự án: ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #f59e0b;">
        <h2 style="color: #f59e0b; text-align: center;">Thay đổi hạn chót dự án</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Dự án <b>${projectName}</b> mà bạn tham gia vừa được cập nhật hạn chót:</p>
        <div style="background-color: #fffbeb; padding: 15px; border-radius: 4px; margin: 16px 0; border: 1px solid #fde68a;">
          <p style="margin: 0; color: #92400e;">📅 Hạn cũ: <b>${new Date(oldEndDate).toLocaleDateString('vi-VN')}</b></p>
          <p style="margin: 8px 0 0; color: #b45309;">📅 Hạn mới: <b>${new Date(newEndDate).toLocaleDateString('vi-VN')}</b></p>
        </div>
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và điều chỉnh kế hoạch làm việc.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email nhắc nhở task sắp hết hạn (dùng bởi cron job)
 */
exports.sendTaskReminderMail = async (email, userName, taskName, projectName, dueDate) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `Nhắc nhở: Công việc sắp hết hạn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #f59e0b;">
        <h2 style="color: #f59e0b; text-align: center;">Nhắc nhở công việc</h2>
        <p>Chào ${userName},</p>
        <p>Công việc <b>${taskName}</b> thuộc dự án <b>${projectName}</b> của bạn sắp đến hạn chót.</p>
        <div style="background-color: #fffbeb; padding: 15px; text-align: center; font-size: 18px; color: #b45309; margin: 20px 0; border-radius: 4px; border: 1px solid #fde68a;">
          Hạn chót: ${new Date(dueDate).toLocaleString('vi-VN')}
        </div>
        <p>Vui lòng hoàn thành công việc và cập nhật tiến độ trên hệ thống.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi trạng thái task thay đổi (tạm hoãn / mở lại / khôi phục)
 * @param {string} email - Email nhân viên
 * @param {string} userName - Tên nhân viên
 * @param {string} taskName - Tên task
 * @param {string} projectName - Tên dự án
 * @param {string} newStatus - Trạng thái mới (tiếng Việt)
 * @param {string} managerName - Tên manager thực hiện
 */
exports.sendTaskStatusChangedMail = async (email, userName, taskName, projectName, newStatus, managerName) => {
  const colorMap = {
    'Đang chờ': '#f59e0b',
    'Đang làm': '#3b82f6',
    'Đã hoàn thành': '#10b981',
    'Đã hủy': '#ef4444',
    'Chưa bắt đầu': '#6b7280',
  };
  const color = colorMap[newStatus] || '#4f46e5';

  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `Cập nhật trạng thái công việc: ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid ${color};">
        <h2 style="color: ${color}; text-align: center;">Cập nhật trạng thái công việc</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Công việc <b>${taskName}</b> thuộc dự án <b>${projectName}</b> vừa được cập nhật trạng thái bởi <b>${managerName}</b>.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 16px 0; text-align: center;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${color};">📋 ${newStatus}</p>
        </div>
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi task bị hủy
 * @param {string} email - Email nhân viên
 * @param {string} userName - Tên nhân viên
 * @param {string} taskName - Tên task
 * @param {string} projectName - Tên dự án
 * @param {string} managerName - Tên manager
 */
exports.sendTaskCancelledMail = async (email, userName, taskName, projectName, managerName) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `Công việc đã bị hủy: ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #ef4444;">
        <h2 style="color: #ef4444; text-align: center;">Thông báo hủy công việc</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Công việc <b>${taskName}</b> thuộc dự án <b>${projectName}</b> đã bị hủy bởi manager <b>${managerName}</b>.</p>
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ trực tiếp với manager của dự án.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi employee xin làm lại task → gửi tới manager
 * @param {string} managerEmail - Email manager
 * @param {string} managerName - Tên manager
 * @param {string} employeeName - Tên nhân viên xin làm lại
 * @param {string} taskName - Tên task
 * @param {string} projectName - Tên dự án
 */
exports.sendEmployeeRedoRequestMail = async (managerEmail, managerName, employeeName, taskName, projectName) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: managerEmail,
    subject: `Yêu cầu làm lại công việc: ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #8b5cf6;">
        <h2 style="color: #8b5cf6; text-align: center;">Yêu cầu làm lại công việc</h2>
        <p>Chào <b>${managerName}</b>,</p>
        <p>Nhân viên <b>${employeeName}</b> muốn làm lại công việc <b>${taskName}</b> thuộc dự án <b>${projectName}</b>.</p>
        <div style="background-color: #f5f3ff; padding: 15px; border-radius: 4px; margin: 16px 0; border: 1px solid #ddd6fe;">
          <p style="margin: 0; color: #5b21b6;">📋 Công việc: <b>${taskName}</b></p>
          <p style="margin: 8px 0 0; color: #5b21b6;">📁 Dự án: <b>${projectName}</b></p>
          <p style="margin: 8px 0 0; color: #5b21b6;">👤 Nhân viên: <b>${employeeName}</b></p>
        </div>
        <p>Vui lòng đăng nhập vào hệ thống để xem xét và cập nhật trạng thái công việc nếu phù hợp.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi deadline task thay đổi
 * @param {string} email - Email nhân viên
 * @param {string} userName - Tên nhân viên
 * @param {string} taskName - Tên task
 * @param {string} projectName - Tên dự án
 * @param {Date|null} oldDueDate - Deadline cũ
 * @param {Date} newDueDate - Deadline mới
 */
exports.sendTaskDeadlineChangedMail = async (email, userName, taskName, projectName, oldDueDate, newDueDate) => {
  const oldStr = oldDueDate
    ? `<p style="margin: 0; color: #92400e;">📅 Deadline cũ: <b>${new Date(oldDueDate).toLocaleDateString('vi-VN')}</b></p>`
    : '';

  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `Thay đổi deadline công việc: ${taskName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #f59e0b;">
        <h2 style="color: #f59e0b; text-align: center;">Thay đổi deadline công việc</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Deadline của công việc <b>${taskName}</b> trong dự án <b>${projectName}</b> đã được cập nhật:</p>
        <div style="background-color: #fffbeb; padding: 15px; border-radius: 4px; margin: 16px 0; border: 1px solid #fde68a;">
          ${oldStr}
          <p style="margin: ${oldDueDate ? '8px' : '0'} 0 0; color: #b45309;">📅 Deadline mới: <b>${new Date(newDueDate).toLocaleDateString('vi-VN')}</b></p>
        </div>
        <p>Vui lòng điều chỉnh kế hoạch làm việc của bạn cho phù hợp.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi admin tạo tài khoản mới cho người dùng
 */
exports.sendNewAccountCreatedMail = async (email, userName, plainPassword, role) => {
  const roleLabels = {
    admin: 'Admin',
    manager: 'Manager',
    employee: 'Nhân viên',
  };
  const roleName = roleLabels[role] || role;

  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Tài khoản của bạn đã được tạo trên hệ thống',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #4f46e5;">
        <h2 style="color: #4f46e5; text-align: center;">Tài khoản mới được tạo</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Tài khoản của bạn đã được tạo thành công bởi Quản trị viên hệ thống.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0;">📧 Email đăng nhập: <b>${email}</b></p>
          <p style="margin: 8px 0 0;">🔑 Mật khẩu tạm thời: <b>${plainPassword}</b></p>
          <p style="margin: 8px 0 0;">💼 Vai trò: <b>${roleName}</b></p>
        </div>
        <p style="color: #ef4444; font-weight: bold; margin: 20px 0;">
          ⚠️ Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu để đảm bảo an toàn tài khoản.
        </p>
        <p>Vui lòng đăng nhập vào ứng dụng để bắt đầu sử dụng dịch vụ.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi user bị gỡ role employee
 */
exports.sendEmployeeRoleRevokedMail = async (email, userName, projectsCount, tasksCount, stillHasManagerRole) => {
  const detailStr = stillHasManagerRole 
    ? '<p>Quyền hạn <b>Manager</b> của bạn vẫn được giữ nguyên và các dự án/công việc bạn đang quản lý không bị ảnh hưởng.</p>' 
    : '';

  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Thông báo: Thay đổi vai trò trên hệ thống',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #ef4444;">
        <h2 style="color: #ef4444; text-align: center;">Thay đổi vai trò thành viên</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Quản trị viên đã gỡ vai trò <b>Nhân viên (Employee)</b> khỏi tài khoản của bạn.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; margin: 16px 0; border: 1px solid #fee2e2; color: #991b1b;">
          <p style="margin: 0; font-weight: bold;">Các thay đổi liên quan:</p>
          <ul style="margin: 8px 0 0; padding-left: 20px;">
            <li>Bạn đã bị loại khỏi các dự án tham gia (${projectsCount} dự án).</li>
            <li>Bạn không còn được phân công thực hiện các công việc (${tasksCount} công việc).</li>
          </ul>
        </div>
        ${detailStr}
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ với Quản trị viên.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi user bị gỡ role manager
 */
exports.sendManagerRoleRevokedMail = async (email, userName, replacementManagerName, projectsCount) => {
  const projectsTransferStr = projectsCount > 0
    ? `<p>Toàn bộ <b>${projectsCount} dự án</b> mà bạn đang quản lý đã được chuyển giao quyền quản trị sang cho: <b>${replacementManagerName}</b>.</p>`
    : '';

  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Thông báo: Thay đổi vai trò quản lý',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #ef4444;">
        <h2 style="color: #ef4444; text-align: center;">Thay đổi vai trò quản lý</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Quản trị viên đã gỡ vai trò <b>Quản lý (Manager)</b> khỏi tài khoản của bạn.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; margin: 16px 0; border: 1px solid #fee2e2; color: #991b1b;">
          ${projectsTransferStr}
          <p style="margin: 8px 0 0;">Quyền lợi và dữ liệu vai trò Nhân viên (nếu có) của bạn vẫn được giữ nguyên.</p>
        </div>
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ với Quản trị viên.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email cho manager mới nhận bàn giao dự án
 */
exports.sendManagerRoleAssignedMail = async (email, userName, oldManagerName, projectsCount) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Thông báo: Tiếp nhận bàn giao quản lý dự án',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #10b981;">
        <h2 style="color: #10b981; text-align: center;">Tiếp nhận bàn giao quản lý</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Bạn vừa được Quản trị viên phân công quản lý thay cho <b>${oldManagerName}</b> đối với:</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 4px; margin: 16px 0; border: 1px solid #dcfce7; color: #166534;">
          <p style="margin: 0; font-weight: bold;">📁 Số lượng dự án được bàn giao: <b>${projectsCount} dự án</b></p>
        </div>
        <p>Vui lòng đăng nhập vào ứng dụng để kiểm tra danh sách dự án và quản lý công việc.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi tài khoản bị vô hiệu hóa
 */
exports.sendAccountDeactivatedMail = async (email, userName, hasEmployeeRole, hasManagerRole, replacementManagerName, projectsCount) => {
  let details = '';
  if (hasEmployeeRole && hasManagerRole) {
    details = `
      <li>Tài khoản của bạn đã bị loại khỏi các dự án đang tham gia và các task được phân công.</li>
      <li>Toàn bộ ${projectsCount} dự án bạn đang quản lý đã được chuyển giao cho <b>${replacementManagerName}</b>.</li>
    `;
  } else if (hasManagerRole) {
    details = `
      <li>Toàn bộ ${projectsCount} dự án bạn đang quản lý đã được chuyển giao cho <b>${replacementManagerName}</b>.</li>
    `;
  } else if (hasEmployeeRole) {
    details = `
      <li>Tài khoản của bạn đã bị loại khỏi các dự án đang tham gia và các task được phân công.</li>
    `;
  }

  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Thông báo: Vô hiệu hóa tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #ef4444;">
        <h2 style="color: #ef4444; text-align: center;">Tài khoản bị vô hiệu hóa</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Tài khoản của bạn vừa bị vô hiệu hóa bởi Quản trị viên.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 4px; margin: 16px 0; border: 1px solid #fee2e2; color: #991b1b;">
          <p style="margin: 0; font-weight: bold;">Các thay đổi đã thực hiện:</p>
          <ul style="margin: 8px 0 0; padding-left: 20px;">
            ${details}
            <li>Bạn sẽ không thể đăng nhập vào hệ thống kể từ thời điểm này.</li>
          </ul>
        </div>
        <p>Nếu đây là nhầm lẫn hoặc bạn cần hỗ trợ, vui lòng liên hệ với Quản trị viên.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email khi tài khoản được kích hoạt trở lại
 */
exports.sendAccountActivatedMail = async (email, userName) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Thông báo: Tài khoản của bạn đã được kích hoạt lại',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #10b981;">
        <h2 style="color: #10b981; text-align: center;">Tài khoản đã được kích hoạt</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Tài khoản của bạn trên hệ thống Task Management đã được kích hoạt hoạt động trở lại bởi Quản trị viên.</p>
        <p>Hiện tại bạn đã có thể đăng nhập và tiếp tục công việc của mình.</p>
        <p style="margin-top: 20px;">Chúc bạn một ngày làm việc hiệu quả!</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Gửi email thông báo cho thành viên khi dự án bị xóa
 * @param {string} email - Email thành viên
 * @param {string} userName - Tên thành viên
 * @param {string} projectName - Tên dự án bị xóa
 * @param {string} deletedByName - Tên người thực hiện xóa dự án
 */
exports.sendProjectDeletedMail = async (email, userName, projectName, deletedByName) => {
  const mailOptions = {
    from: `"Task Management App" <${process.env.MAIL_USER}>`,
    to: email,
    subject: `Thông báo: Dự án ${projectName} đã bị xóa`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; border-top: 5px solid #ef4444;">
        <h2 style="color: #ef4444; text-align: center;">Dự án đã bị xóa</h2>
        <p>Chào <b>${userName}</b>,</p>
        <p>Chúng tôi xin thông báo rằng dự án <b>${projectName}</b> mà bạn tham gia đã bị xóa khỏi hệ thống bởi <b>${deletedByName}</b>.</p>
        <p>Mọi công việc, phân công và dữ liệu liên quan thuộc dự án này cũng đã được gỡ bỏ.</p>
        <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};


