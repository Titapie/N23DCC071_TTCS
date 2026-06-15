import { api, tokenStore } from "../utils/api.js";

const userService = {
  // Danh sách người dùng cho giao diện quản trị
  getAllUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.role) queryParams.append("role", params.role);
    if (params.isActive !== undefined) queryParams.append("isActive", params.isActive);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit || 50);
    const res = await api.get(`/users?${queryParams.toString()}`);
    return { success: true, data: res.data || [], users: res.data || [], pagination: res.pagination };
  },

  // Thông tin hồ sơ người dùng hiện tại
  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res;
  },

  // Cập nhật hồ sơ người dùng hiện tại
  updateProfile: async (data) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
    };
    const res = await api.patch('/users/me', payload);
    return res;
  },

  // Dữ liệu gợi ý user cho dropdown/chọn thành viên (Manager chỉ thấy employee)
  getUsersLookup: async () => {
    const res = await api.get('/users');
    return { success: true, data: res.data || [], users: res.data || [] };
  },

  // Tạo user mới (Admin only)
  createUser: async (data) => {
    const res = await api.post('/users', data);
    return { success: true, data: res.data, message: res.message };
  },

  // Đổi role người dùng (Admin only)
  updateUserRole: async (userId, role, action = 'replace', replacementManagerId = null) => {
    const res = await api.patch(`/users/${userId}/role`, { role, action, replacementManagerId });
    return { success: true, data: res.data, message: res.message || "Cập nhật role thành công" };
  },

  // Cập nhật thông tin user (Admin only)
  updateUser: async (userId, data) => {
    const res = await api.patch(`/users/${userId}`, data);
    return { success: true, data: res.data, message: res.message };
  },

  // Cập nhật trạng thái tài khoản (Admin only)
  updateUserStatus: async (userId, isActive, replacementManagerId = null) => {
    const res = await api.patch(`/users/${userId}/status`, { isActive, replacementManagerId });
    return { success: true, data: res.data, message: res.message };
  },

  // Lấy ảnh hưởng của việc gỡ role/vô hiệu hóa (Admin only)
  getUserImpact: async (userId) => {
    const res = await api.get(`/users/${userId}/impact`);
    return { success: true, data: res.data };
  },

  // Xóa user (Admin only)
  deleteUser: async (userId) => {
    const res = await api.delete(`/users/${userId}`);
    return { success: true, message: res.message };
  },

  /**
   * Helper: Kiểm tra user có phải admin không
   */
  isAdmin: () => {
    try {
      const token = tokenStore.getAccessToken();
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'admin';
    } catch (error) {
      return false;
    }
  },

  /**
   * Helper: Lấy role hiện tại từ token
   */
  getCurrentRole: () => {
    try {
      const token = tokenStore.getAccessToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      return null;
    }
  },

  getFullName: (user) => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  },

  getUserInitials: (user) => {
    if (!user) return '';
    const f = (user.firstName || '').charAt(0);
    const l = (user.lastName || '').charAt(0);
    return `${f}${l}`.toUpperCase();
  },
};

export default userService;