// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const mailService = require('../services/mail.service');

// ============================================================
// Helper: validate độ mạnh mật khẩu
// Rule: >=8 ký tự, có chữ hoa, chữ thường, chữ số
// ============================================================
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ hoa, gồm chữ hoa, chữ thường và số.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ thường, gồm chữ hoa, chữ thường và số.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Mật khẩu phải có ít nhất 1 chữ số, gồm chữ hoa, chữ thường và số.';
  }
  return null; // hợp lệ
};

// Helper: tạo access token (ngắn hạn - 15 phút)
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Helper: tạo refresh token (dài hạn - 7 ngày)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Đăng ký người dùng mới
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Validate mật khẩu
    const pwError = validatePassword(password);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo mã OTP 6 chữ số cho việc kích hoạt tài khoản
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'employee',
      isActive: false, // Tài khoản chưa kích hoạt
      otp,
      otpExpiry,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    // Gửi email OTP kích hoạt (không dùng await để tránh làm chết request nếu lỗi mail config)
    mailService.sendRegistrationOTPMail(email, otp).catch(err => {
      console.error('Lỗi gửi email OTP:', err.message);
      console.log('Gợi ý: Kiểm tra cấu hình MAIL_USER và MAIL_PASS trong file .env');
    });

    res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP kích hoạt tài khoản.',
      data: { email: userResponse.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Xác thực tài khoản sau khi đăng ký
 * POST /api/auth/verify-registration
 */
exports.verifyRegistration = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mã OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    if (user.isActive) {
      return res.status(400).json({ message: 'Tài khoản này đã được kích hoạt trước đó' });
    }

    // Kiểm tra OTP
    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    // Kích hoạt tài khoản
    user.isActive = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Gửi email chào mừng khi tài khoản được kích hoạt thành công
    mailService.sendWelcomeMail(user.email, user.firstName).catch(err => {
      console.error('Lỗi gửi email Welcome:', err.message);
    });

    res.status(200).json({ message: 'Kích hoạt tài khoản thành công! Bây giờ bạn có thể đăng nhập.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Đăng nhập - trả về accessToken và refreshToken
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email không tồn tại' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Sai mật khẩu' });
    }

    // Tạo cả 2 token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Lưu refresh token vào DB để có thể invalidate khi logout
    user.refreshToken = refreshToken;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(200).json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Làm mới accessToken bằng refreshToken
 * POST /api/auth/refresh
 */
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Vui lòng cung cấp refreshToken' });
  }

  try {
    // Xác minh refresh token hợp lệ
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Kiểm tra refresh token có khớp trong DB không (chống dùng token cũ sau logout)
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    // Cấp access token mới
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      message: 'Làm mới token thành công',
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token đã hết hạn, vui lòng đăng nhập lại' });
    }
    return res.status(401).json({ message: 'Refresh token không hợp lệ' });
  }
};

/**
 * Đăng xuất - xóa refresh token
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      // Xóa refresh token trong DB → token cũ sẽ không dùng được nữa
      await User.findOneAndUpdate(
        { refreshToken },
        { refreshToken: null }
      );
    }

    res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Lấy thông tin người dùng đang đăng nhập
 * GET /api/auth/me  (cần authenticate)
 */
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({ message: 'Thông tin người dùng', data: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Đổi mật khẩu
 * PATCH /api/auth/change-password  (cần authenticate)
 */
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' });
    }

    // Validate mật khẩu mới
    const pwError = validatePassword(newPassword);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }

    const user = await User.findById(req.user._id);

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    // Xóa refresh token để buộc đăng nhập lại trên tất cả thiết bị
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};

/**
 * Quên mật khẩu - gửi mã OTP qua email
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
    }

    // Tạo mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Gửi email (không await để tránh lỗi nếu config sai)
    mailService.sendForgotPasswordOTPMail(email, otp).catch(err => {
      console.error('❌ Lỗi gửi email ForgotPassword:', err.message);
    });

    res.status(200).json({
      message: 'Mã OTP đã được gửi về email của bạn'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Lỗi khi gửi email xác thực', error: error.message });
  }
};

/**
 * Đặt lại mật khẩu bằng mã OTP
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email, mã OTP và mật khẩu mới' });
    }

    // Validate mật khẩu mới
    const pwError = validatePassword(newPassword);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Kiểm tra OTP và hạn dùng
    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    // Cập nhật mật khẩu mới
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;
    user.refreshToken = null; // Invalidate sessions
    await user.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};