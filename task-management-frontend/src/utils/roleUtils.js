/**
 * src/utils/roleUtils.js
 * Helper functions cho phân quyền multi-role ở frontend.
 *
 * Quy tắc:
 *   - Ưu tiên kiểm tra `roles` array (mới), fallback sang `role` string (cũ/JWT)
 *   - Admin KHÔNG được gộp với employee/manager
 *   - Các tổ hợp hợp lệ: ['employee'], ['manager'], ['employee','manager'], ['admin']
 */

/**
 * Kiểm tra user có role nào đó không.
 * @param {Object|null} user - User object từ AuthContext
 * @param {string} roleName - 'employee' | 'manager' | 'admin'
 * @returns {boolean}
 */
export const hasRole = (user, roleName) => {
  if (!user) return false;
  if (user.roles && user.roles.length > 0) return user.roles.includes(roleName);
  return user.role === roleName;
};

/**
 * Kiểm tra user là admin.
 */
export const isAdmin = (user) => hasRole(user, 'admin');

/**
 * Kiểm tra user có vai trò manager (không phải admin).
 * User có roles=['employee','manager'] cũng trả về true.
 */
export const hasManagerRole = (user) => hasRole(user, 'manager') && !isAdmin(user);

/**
 * Kiểm tra user có vai trò employee (không phải admin).
 * User có roles=['employee','manager'] cũng trả về true.
 */
export const hasEmployeeRole = (user) => hasRole(user, 'employee') && !isAdmin(user);

/**
 * Kiểm tra user có thể tạo/quản lý project và task không.
 * Chỉ manager (hoặc admin — theo thiết kế hệ thống hiện tại) mới được.
 */
export const canManageProjects = (user) => hasManagerRole(user) || isAdmin(user);

/**
 * Kiểm tra user có thể tạo task không.
 */
export const canCreateTask = (user) => hasManagerRole(user) || isAdmin(user);

/**
 * Kiểm tra user có phải là manager của project cụ thể không.
 * So sánh user._id với project.createdBy.
 * @param {Object|null} user
 * @param {Object|null} project - Project object (có thể có createdBy là ObjectId hoặc populated)
 * @returns {boolean}
 */
export const isManagerOfProject = (user, project) => {
  if (!user || !project) return false;
  const myId = String(user._id || user.id || '');
  const creatorId = String(project.createdBy?._id || project.createdBy || '');
  return hasManagerRole(user) && myId && myId === creatorId;
};

/**
 * Kiểm tra user có quyền trên project cụ thể (manager của project hoặc admin).
 * @param {Object|null} user
 * @param {Object|null} project
 * @returns {boolean}
 */
export const canManageThisProject = (user, project) => {
  return isAdmin(user) || isManagerOfProject(user, project);
};

/**
 * Lấy nhãn role hiển thị cho user.
 * @param {Object|null} user
 * @returns {string}
 */
export const getRoleDisplay = (user) => {
  if (!user) return '';
  if (isAdmin(user)) return 'Admin';
  const isM = hasManagerRole(user);
  const isE = hasEmployeeRole(user);
  if (isM && isE) return 'Manager + Nhân viên';
  if (isM) return 'Manager';
  if (isE) return 'Nhân viên';
  return user.role || '';
};

/**
 * Lấy màu badge cho role.
 * @param {Object|null} user
 * @returns {string} - Tailwind/CSS class string
 */
export const getRoleBadgeColor = (user) => {
  if (isAdmin(user)) return 'bg-purple-100 text-purple-700';
  if (hasManagerRole(user) && hasEmployeeRole(user)) return 'bg-teal-100 text-teal-700';
  if (hasManagerRole(user)) return 'bg-blue-100 text-blue-700';
  if (hasEmployeeRole(user)) return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
};
