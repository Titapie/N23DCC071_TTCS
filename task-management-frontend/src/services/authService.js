import { api, tokenStore } from "../utils/api";

export const authService = {
  /* ================= LOGIN ================= */
  async login(payload) {
    const response = await api.post('/auth/login', payload);
    if (response.success && response.data) {
      // Assuming backend returns { success, token, refreshToken, data: user }
      const accessToken = response.token || response.accessToken;
      const refreshToken = response.refreshToken;
      tokenStore.setTokens({ token: accessToken, refreshToken });
    }
    return response;
  },

  /* ================= REGISTER ================= */
  async register(payload) {
    // Transform payload to match backend schema if necessary
    const registerData = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
    };
    return await api.post('/auth/register', registerData);
  },

  /* ================= VERIFY REGISTRATION ================= */
  async verifyRegistration(payload) {
    // payload: { email, otp }
    return await api.post('/auth/verify-registration', payload);
  },

  /* ================= CURRENT USER ================= */
  async me() {
    return await api.get('/auth/me');
  },

  /* ================= LOGOUT ================= */
  async logout() {
    try {
      const refreshToken = tokenStore.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } finally {
      tokenStore.clear();
    }
  },

  /* ================= REFRESH ================= */
  async refresh(refreshToken) {
    return await api.post('/auth/refresh', { refreshToken });
  },

  /* ================= FORGOT PASSWORD ================= */
  async forgotPassword(payload) {
    // payload: { email }
    return await api.post('/auth/forgot-password', payload);
  },

  /* ================= RESET PASSWORD ================= */
  async resetPassword(payload) {
    // payload: { email, otp, newPassword, confirmPassword }
    return await api.post('/auth/reset-password', payload);
  },

  /* ================= CHANGE PASSWORD ================= */
  async changePassword(data) {
    const payload = {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    };
    return await api.patch('/auth/change-password', payload);
  },

  /* ================= UPDATE PROFILE ================= */
  async updateProfile(data) {
    // Backend thật: PATCH /api/users/me
    // Body: { firstName, lastName }
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
    };
    return await api.patch('/users/me', payload);
  },
};
