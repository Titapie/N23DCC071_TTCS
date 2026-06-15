import React, { useState, useEffect } from 'react';
import {
    Users, Search, RefreshCw, Shield, User, Loader2, AlertCircle,
    X, Save, UserCog, UserCheck, Mail, Calendar, ChevronDown,
    Filter, Crown, UserX, PlusCircle, Trash2
} from 'lucide-react';
import userService from '../../services/userService';
import { useTheme } from '../../context/ThemeContext';

const ROLES = ['employee', 'manager', 'admin'];

const ROLE_LABELS = {
    admin: 'Admin',
    manager: 'Manager',
    employee: 'Nhân viên',
};

const ROLE_COLORS = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    employee: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

const ROLE_ICONS = {
    admin: Crown,
    manager: UserCog,
    employee: User,
};

const getUserRoles = (user) => {
    if (!user) return ['employee'];
    if (user.roles && user.roles.length > 0) return user.roles;
    return [user.role || 'employee'];
};

const ROLE_DESCRIPTIONS = {
    admin: 'Toàn quyền quản lý hệ thống, quản trị người dùng và cấu hình dự án.',
    manager: 'Được phép tạo dự án, phân công công việc và quản lý thành viên.',
    employee: 'Thành viên thực hiện công việc được giao trong dự án.',
};

const isRoleSelectable = (role, action, userRoles) => {
    if (action === 'replace') {
        return true;
    }
    if (action === 'grant') {
        return role !== 'admin' && !userRoles.includes(role);
    }
    if (action === 'revoke') {
        return userRoles.includes(role);
    }
    return true;
};

const AdminUsersPage = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal đổi role
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [roleAction, setRoleAction] = useState('replace'); // 'replace' | 'grant' | 'revoke'
    const [newRole, setNewRole] = useState('');
    const [savingRole, setSavingRole] = useState(false);

    // Modal tạo user
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'employee' });
    const [creating, setCreating] = useState(false);

    // Toggle trạng thái tài khoản
    const [togglingId, setTogglingId] = useState(null);

    // States check ảnh hưởng và vô hiệu hóa
    const [impactLoading, setImpactLoading] = useState(false);
    const [impactData, setImpactData] = useState(null);
    const [replacementManagerId, setReplacementManagerId] = useState('');

    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivateUser, setDeactivateUser] = useState(null);
    const [deactivateReplacementId, setDeactivateReplacementId] = useState('');
    const [deactivateImpact, setDeactivateImpact] = useState(null);
    const [deactivateLoading, setDeactivateLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userService.getAllUsers({ limit: 100 });
            if (response.success) setUsers(response.data || []);
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const getFilteredUsers = () => {
        let filtered = users;
        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => getUserRoles(u).includes(roleFilter));
        }
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                u.firstName?.toLowerCase().includes(q) ||
                u.lastName?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q)
            );
        }
        return filtered;
    };

    /* ── Role Modal ── */
    const handleOpenRoleModal = async (user) => {
        setSelectedUser(user);
        const roles = getUserRoles(user);
        setNewRole(roles[0] || 'employee');
        setRoleAction('replace');
        setReplacementManagerId('');
        setImpactData(null);
        setShowRoleModal(true);
        try {
            setImpactLoading(true);
            const res = await userService.getUserImpact(user._id);
            if (res.success) {
                setImpactData(res.data);
            }
        } catch (err) {
            console.error("Lỗi lấy thông tin ảnh hưởng:", err.message);
        } finally {
            setImpactLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowRoleModal(false);
        setSelectedUser(null);
        setNewRole('');
        setRoleAction('replace');
        setReplacementManagerId('');
        setImpactData(null);
    };

    const handleSetRoleAction = (action) => {
        setRoleAction(action);
        if (!selectedUser) return;
        const userRoles = getUserRoles(selectedUser);
        if (newRole && isRoleSelectable(newRole, action, userRoles)) {
            return;
        }
        const selectable = ROLES.find(r => isRoleSelectable(r, action, userRoles));
        if (selectable) {
            setNewRole(selectable);
        } else {
            setNewRole('');
        }
    };

    const getTargetRoles = () => {
        if (!selectedUser) return [];
        const currentRoles = getUserRoles(selectedUser);
        let targetRoles = [...currentRoles];
        if (roleAction === 'replace') {
            if (newRole === 'admin') {
                targetRoles = ['admin'];
            } else {
                targetRoles = [newRole];
            }
        } else if (roleAction === 'grant') {
            if (!targetRoles.includes(newRole)) {
                targetRoles.push(newRole);
            }
        } else if (roleAction === 'revoke') {
            targetRoles = targetRoles.filter(r => r !== newRole);
            if (targetRoles.length === 0) {
                targetRoles = ['employee'];
            }
        }
        return targetRoles;
    };

    const handleSaveRole = async () => {
        if (!selectedUser || !newRole) return;

        const targetRoles = getTargetRoles();
        const isLosingManager = getUserRoles(selectedUser).includes('manager') && !targetRoles.includes('manager');
        const managedProjectsCount = impactData?.manager?.projectsCount || 0;

        if (isLosingManager && managedProjectsCount > 0 && !replacementManagerId) {
            alert('Vui lòng chọn Manager thay thế để bàn giao các dự án!');
            return;
        }

        // Cảnh báo khi thay thế bằng admin
        if (roleAction === 'replace' && newRole === 'admin') {
            const confirmAdmin = window.confirm(
                'Chuyển thành Admin sẽ xóa bỏ mọi role khác. Bạn có chắc chắn không?'
            );
            if (!confirmAdmin) return;
        }

        try {
            setSavingRole(true);
            const response = await userService.updateUserRole(selectedUser._id, newRole, roleAction, replacementManagerId || null);
            if (response.success) {
                fetchUsers();
                handleCloseModal();
                alert('Cập nhật role thành công!');
            }
        } catch (err) {
            alert(err.message || 'Không thể cập nhật role');
        } finally {
            setSavingRole(false);
        }
    };

    /* ── Toggle isActive ── */
    const handleToggleStatus = async (user) => {
        if (user.isActive) {
            // Muốn vô hiệu hóa -> mở Modal
            setDeactivateUser(user);
            setDeactivateReplacementId('');
            setDeactivateImpact(null);
            setShowDeactivateModal(true);
            try {
                setDeactivateLoading(true);
                const res = await userService.getUserImpact(user._id);
                if (res.success) {
                    setDeactivateImpact(res.data);
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin ảnh hưởng:", err.message);
            } finally {
                setDeactivateLoading(false);
            }
        } else {
            // Kích hoạt -> chạy trực tiếp
            try {
                setTogglingId(user._id);
                const response = await userService.updateUserStatus(user._id, true);
                if (response.success) {
                    setUsers(users.map(u => u._id === user._id ? { ...u, isActive: true } : u));
                    alert('Kích hoạt tài khoản thành công!');
                }
            } catch (err) {
                alert(err.message || 'Không thể kích hoạt tài khoản');
            } finally {
                setTogglingId(null);
            }
        }
    };

    const handleConfirmDeactivate = async () => {
        if (!deactivateUser) return;
        
        const hasManagerRole = getUserRoles(deactivateUser).includes('manager');
        const managedProjectsCount = deactivateImpact?.manager?.projectsCount || 0;

        if (hasManagerRole && managedProjectsCount > 0 && !deactivateReplacementId) {
            alert('Vui lòng chọn Manager thay thế để bàn giao các dự án!');
            return;
        }

        try {
            setTogglingId(deactivateUser._id);
            setShowDeactivateModal(false);
            const response = await userService.updateUserStatus(
                deactivateUser._id, 
                false, 
                deactivateReplacementId || null
            );
            if (response.success) {
                fetchUsers();
                alert('Vô hiệu hóa tài khoản thành công!');
            }
        } catch (err) {
            alert(err.message || 'Không thể vô hiệu hóa tài khoản');
        } finally {
            setTogglingId(null);
            setDeactivateUser(null);
        }
    };

    /* ── Delete User ── */
    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Xóa tài khoản ${user.firstName} ${user.lastName}?`)) return;
        try {
            await userService.deleteUser(user._id);
            setUsers(users.filter(u => u._id !== user._id));
            alert('Đã xóa tài khoản.');
        } catch (err) {
            alert(err.message || 'Không thể xóa tài khoản');
        }
    };

    /* ── Create User ── */
    const handleCreateUser = async () => {
        // Validate mật khẩu trước khi gửi
        if (createForm.password.length < 8 || !/[A-Z]/.test(createForm.password) || !/[a-z]/.test(createForm.password) || !/[0-9]/.test(createForm.password)) {
            alert('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.');
            return;
        }

        try {
            setCreating(true);
            const response = await userService.createUser(createForm);
            if (response.success) {
                alert('Tạo tài khoản và gửi email thông tin đăng nhập thành công!');
                setShowCreateModal(false);
                setCreateForm({ firstName: '', lastName: '', email: '', password: '', role: 'employee' });
                fetchUsers();
            }
        } catch (err) {
            alert(err.message || 'Không thể tạo tài khoản');
        } finally {
            setCreating(false);
        }
    };

    const stats = {
        total: users.length,
        admins: users.filter(u => getUserRoles(u).includes('admin')).length,
        managers: users.filter(u => getUserRoles(u).includes('manager')).length,
        employees: users.filter(u => getUserRoles(u).includes('employee')).length,
    };

    const filteredUsers = getFilteredUsers();

    const getRoleBadge = (user) => {
        const roles = getUserRoles(user);
        return (
            <div className="flex flex-wrap gap-1">
                {roles.map(role => {
                    const Icon = ROLE_ICONS[role] || User;
                    const colorClass = ROLE_COLORS[role] || 'bg-gray-100 text-gray-700';
                    return (
                        <span key={role} className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {ROLE_LABELS[role] || role}
                        </span>
                    );
                })}
            </div>
        );
    };

    const getUserAvatar = (user) => {
        const initials = userService.getUserInitials(user);
        return (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {initials}
            </div>
        );
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '-';

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400">Đang tải danh sách users...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-8 max-w-md w-full text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Có lỗi xảy ra</h2>
                <p className="text-gray-600 dark:text-slate-400 mb-6">{error}</p>
                <button onClick={fetchUsers} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Thử lại</button>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-gray-50 dark:bg-slate-900 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">Quản lý Users</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1">Quản lý thông tin và phân quyền người dùng</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowCreateModal(true)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <PlusCircle className="w-4 h-4 mr-2" /> Tạo user
                            </button>
                            <button onClick={fetchUsers}
                                className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Tổng Users', value: stats.total, icon: Users, color: 'border-blue-500', iconColor: 'text-blue-500 dark:text-blue-400' },
                            { label: 'Admin', value: stats.admins, icon: Crown, color: 'border-purple-500', iconColor: 'text-purple-500 dark:text-purple-400' },
                            { label: 'Manager', value: stats.managers, icon: UserCog, color: 'border-blue-400', iconColor: 'text-blue-400 dark:text-blue-350' },
                            { label: 'Nhân viên', value: stats.employees, icon: User, color: 'border-green-500', iconColor: 'text-green-500 dark:text-green-400' },
                        ].map(({ label, value, icon: Icon, color, iconColor }) => (
                            <div key={label} className={`bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-4 border-l-4 ${color}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">{label}</p>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                                    </div>
                                    <Icon className={`w-10 h-10 ${iconColor}`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search & Filter */}
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input type="text" placeholder="Tìm kiếm theo tên hoặc email..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                    className="pl-10 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-slate-700">
                                    <option value="all">Tất cả roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="employee">Nhân viên</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {filteredUsers.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-12 text-center">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Không tìm thấy user</h3>
                        <p className="text-gray-600 dark:text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-indigo-600 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {filteredUsers.map(user => (
                                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {getUserAvatar(user)}
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{userService.getFullName(user)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-700 dark:text-slate-300">
                                                    <Mail className="w-4 h-4 text-gray-400 mr-2" />{user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    disabled={togglingId === user._id}
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                        user.isActive
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/30'
                                                    }`}>
                                                    {togglingId === user._id
                                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                                        : user.isActive
                                                            ? <><UserCheck className="w-3 h-3 mr-1" />Hoạt động</>
                                                            : <><UserX className="w-3 h-3 mr-1" />Bị khóa</>
                                                    }
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500 dark:text-slate-400">
                                                    <Calendar className="w-4 h-4 mr-2" />{formatDate(user.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleOpenRoleModal(user)}
                                                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                                                        <Shield className="w-3 h-3 mr-1" /> Đổi Role
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user)}
                                                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center">
                                                        <Trash2 className="w-3 h-3 mr-1" /> Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Change Role Modal */}
            {showRoleModal && selectedUser && (() => {
                const currentRoles = getUserRoles(selectedUser);
                const targetRoles = getTargetRoles();
                const isUnchanged = currentRoles.length === targetRoles.length && currentRoles.every(r => targetRoles.includes(r));
                const isLosingEmployee = currentRoles.includes('employee') && !targetRoles.includes('employee');
                const isLosingManager = currentRoles.includes('manager') && !targetRoles.includes('manager');
                const managedProjectsCount = impactData?.manager?.projectsCount || 0;
                const saveDisabled = savingRole || isUnchanged || (isLosingManager && managedProjectsCount > 0 && !replacementManagerId);

                return (
                    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl max-w-md w-full flex flex-col" style={{maxHeight: '90vh'}}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 flex-shrink-0">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl mr-3">
                                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Thay đổi vai trò</h2>
                                </div>
                                <button onClick={handleCloseModal} disabled={savingRole} className="p-2 bg-transparent dark:bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-5">
                                {/* Profile Card */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/20 border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-inner">
                                    <div className="flex items-center gap-3.5">
                                        <div className="relative flex-shrink-0">
                                            {getUserAvatar(selectedUser)}
                                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-950 dark:text-white truncate text-base">{userService.getFullName(selectedUser)}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Vai trò hiện tại:</span>
                                        {getRoleBadge(selectedUser)}
                                    </div>
                                </div>

                                {/* Action segment */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Hành động</label>
                                    <div className="flex p-1 bg-gray-100 dark:bg-slate-900/60 rounded-xl border border-gray-200/50 dark:border-slate-700/40 mb-3">
                                        {[
                                            { v: 'replace', l: 'Thay thế' },
                                            { v: 'grant', l: 'Cấp thêm' },
                                            { v: 'revoke', l: 'Gỡ bỏ' }
                                        ].map(({ v, l }) => {
                                            const isActive = roleAction === v;
                                            return (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => handleSetRoleAction(v)}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                                                        isActive
                                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-600'
                                                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-950 dark:hover:text-white bg-transparent border-0'
                                                    }`}
                                                >
                                                    {l}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {roleAction === 'grant' && (
                                        <p className="text-[11px] text-blue-700 dark:text-blue-350 bg-blue-50/60 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100/50 dark:border-blue-900/30 leading-relaxed">
                                            Cấp thêm vai trò mới mà không xóa vai trò cũ. (Không áp dụng cho Admin).
                                        </p>
                                    )}
                                    {roleAction === 'revoke' && (
                                        <p className="text-[11px] text-orange-700 dark:text-orange-350 bg-orange-50/60 dark:bg-orange-950/20 p-2.5 rounded-lg border border-orange-100/50 dark:border-orange-900/30 leading-relaxed">
                                            Gỡ bỏ vai trò khỏi tài khoản. Nếu gỡ vai trò cuối cùng, tài khoản sẽ mặc định chuyển về vai trò <b>Nhân viên</b>.
                                        </p>
                                    )}
                                </div>

                                {/* Role selection cards */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">Chọn vai trò</label>
                                    <div className="space-y-2.5">
                                        {ROLES.map(role => {
                                            const Icon = ROLE_ICONS[role];
                                            const hasThisRole = currentRoles.includes(role);
                                            const selectable = isRoleSelectable(role, roleAction, currentRoles);
                                            const isSelected = newRole === role;

                                            let badge = null;
                                            if (hasThisRole) {
                                                badge = (
                                                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full border border-green-200/40 dark:border-green-900/30 flex-shrink-0">
                                                        Hiện có
                                                    </span>
                                                );
                                            }

                                            return (
                                                <label
                                                    key={role}
                                                    className={`flex items-start p-3 border border-2 rounded-xl cursor-pointer transition-all duration-200 relative ${
                                                        !selectable
                                                            ? 'opacity-40 bg-gray-50/50 dark:bg-slate-800/20 border-gray-200 dark:border-slate-700/50 cursor-not-allowed select-none'
                                                            : isSelected
                                                            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/15 shadow-sm ring-1 ring-blue-500/20'
                                                            : 'border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-gray-300 dark:hover:border-slate-650 hover:bg-gray-50/20 dark:hover:bg-slate-700/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center h-5 mt-0.5">
                                                        <input
                                                            type="radio"
                                                            name="role"
                                                            value={role}
                                                            checked={isSelected}
                                                            disabled={!selectable || savingRole}
                                                            onChange={e => setNewRole(e.target.value)}
                                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-605 cursor-pointer disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-slate-400'}`} />
                                                            <span className="font-bold text-sm text-gray-900 dark:text-white leading-none">
                                                                {ROLE_LABELS[role]}
                                                            </span>
                                                            {badge}
                                                        </div>
                                                        <p className="text-[11px] text-gray-505 dark:text-slate-400 leading-relaxed font-medium">
                                                            {ROLE_DESCRIPTIONS[role]}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Impacts & warnings */}
                                {impactLoading ? (
                                    <div className="flex items-center justify-center py-4 bg-gray-50/50 dark:bg-slate-900/10 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 mt-4">
                                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                                        <span className="text-gray-500 dark:text-slate-400 text-xs font-semibold">Đang tính toán ảnh hưởng...</span>
                                    </div>
                                ) : impactData ? (
                                    <div className="space-y-3 mt-4 animate-fadeIn">
                                        {isLosingEmployee && (
                                            <div className="p-4 bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl text-xs leading-relaxed text-orange-800 dark:text-orange-350 shadow-sm">
                                                <p className="font-bold text-sm mb-1.5 flex items-center gap-1.5 text-orange-700 dark:text-orange-400">
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> Cảnh báo gỡ vai trò Nhân viên
                                                </p>
                                                <p className="mb-2">Tài khoản này sẽ bị loại khỏi các hoạt động:</p>
                                                <ul className="list-disc pl-5 space-y-1 font-semibold">
                                                    <li>Tham gia <b>{impactData.employee.projectsCount}</b> dự án.</li>
                                                    <li>Được giao <b>{impactData.employee.tasksCount}</b> công việc trực tiếp.</li>
                                                </ul>
                                                {!targetRoles.includes('manager') && (
                                                    <p className="mt-2 text-[10px] opacity-80 border-t border-orange-200/50 dark:border-orange-900/35 pt-1.5">
                                                        Người dùng sẽ không còn quyền tham gia vào các dự án/task dưới vai trò nhân viên.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {isLosingManager && impactData.manager.projectsCount > 0 && (
                                            <div className="space-y-3 p-4 bg-red-50/70 dark:bg-red-950/25 border border-red-200 dark:border-red-900/30 rounded-xl shadow-sm">
                                                <p className="font-bold text-sm flex items-center gap-1.5 text-red-700 dark:text-red-400">
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> Cảnh báo gỡ vai trò Quản lý
                                                </p>
                                                <p className="text-xs text-red-805 dark:text-red-350 leading-relaxed font-semibold">
                                                    Người dùng đang quản lý <b>{impactData.manager.projectsCount}</b> dự án với <b>{impactData.manager.tasksCount}</b> công việc trực thuộc.
                                                </p>
                                                <div className="border-t border-red-200/60 dark:border-red-900/35 pt-3">
                                                    <label className="block text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400 mb-1.5">
                                                        Chọn Manager thay thế *
                                                    </label>
                                                    <select 
                                                        value={replacementManagerId} 
                                                        onChange={e => setReplacementManagerId(e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-950 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none shadow-sm"
                                                    >
                                                        <option value="">-- Chọn Manager thay thế --</option>
                                                        {users
                                                            .filter(u => getUserRoles(u).includes('manager') && u.isActive && u._id !== selectedUser._id)
                                                            .map(u => (
                                                                <option key={u._id} value={u._id}>{userService.getFullName(u)} ({u.email})</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {!isUnchanged && (
                                    <div className="p-3 bg-yellow-50/70 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl mt-4">
                                        <div className="flex items-start gap-2.5">
                                            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-[11px] text-yellow-800 dark:text-yellow-355 leading-relaxed font-semibold">
                                                Thay đổi vai trò sẽ ảnh hưởng trực tiếp đến quyền truy cập và dữ liệu của người dùng này. Vui lòng kiểm tra kỹ trước khi lưu.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-slate-700/30 border-t dark:border-slate-700 rounded-b-2xl flex-shrink-0">
                                <button 
                                    onClick={handleCloseModal} 
                                    disabled={savingRole}
                                    className="px-5 py-2 text-sm font-semibold bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-650 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleSaveRole} 
                                    disabled={saveDisabled}
                                    className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 disabled:scale-100"
                                >
                                    {savingRole ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>
                                    ) : (
                                        <><Save className="w-4 h-4 mr-2" />Lưu thay đổi</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Deactivate User Modal */}
            {showDeactivateModal && deactivateUser && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl max-w-md w-full flex flex-col" style={{maxHeight: '90vh'}}>
                        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 flex-shrink-0">
                            <h2 className="text-xl font-bold text-red-650 dark:text-red-400">Vô hiệu hóa tài khoản</h2>
                            <button onClick={() => setShowDeactivateModal(false)} className="p-2 bg-transparent dark:bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border dark:border-slate-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {getUserAvatar(deactivateUser)}
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{userService.getFullName(deactivateUser)}</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">{deactivateUser.email}</p>
                                    </div>
                                </div>
                            </div>

                            {deactivateLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-6 h-6 text-red-500 animate-spin mr-2" />
                                    <span className="text-gray-500 dark:text-slate-400 text-sm">Đang tải thông tin ảnh hưởng...</span>
                                </div>
                            ) : (
                                deactivateImpact && (
                                    <>
                                        {/* Employee Warning */}
                                        {getUserRoles(deactivateUser).includes('employee') && (
                                            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-850/30 rounded-lg text-sm text-orange-800 dark:text-orange-300">
                                                <p className="font-bold mb-1">⚠️ Ảnh hưởng vai trò Nhân viên:</p>
                                                <p>Tài khoản sẽ bị loại khỏi:</p>
                                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                                    <li><b>{deactivateImpact.employee.projectsCount}</b> dự án đang tham gia.</li>
                                                    <li><b>{deactivateImpact.employee.tasksCount}</b> công việc đang được phân công.</li>
                                                </ul>
                                            </div>
                                        )}

                                        {/* Manager Warning */}
                                        {getUserRoles(deactivateUser).includes('manager') && deactivateImpact.manager.projectsCount > 0 && (
                                            <div className="space-y-3">
                                                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-sm text-red-800 dark:text-red-300">
                                                    <p className="font-bold mb-1">⚠️ Ảnh hưởng vai trò Quản lý:</p>
                                                    <p>Tài khoản đang quản lý <b>{deactivateImpact.manager.projectsCount}</b> dự án với <b>{deactivateImpact.manager.tasksCount}</b> công việc.</p>
                                                    <p className="mt-1 font-semibold">Bắt buộc phải chọn Manager thay thế dưới đây để bàn giao quyền quản lý:</p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-350 mb-1">Chọn Manager thay thế *</label>
                                                    <select 
                                                        value={deactivateReplacementId} 
                                                        onChange={e => setDeactivateReplacementId(e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">-- Chọn Manager --</option>
                                                        {users
                                                            .filter(u => getUserRoles(u).includes('manager') && u.isActive && u._id !== deactivateUser._id)
                                                            .map(u => (
                                                                <option key={u._id} value={u._id}>{userService.getFullName(u)} ({u.email})</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            Lưu ý: Hành động vô hiệu hóa tài khoản sẽ chặn quyền đăng nhập của người dùng. Dữ liệu công việc cũ không bị xóa.
                                        </p>
                                    </>
                                )
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700 rounded-b-lg flex-shrink-0">
                            <button onClick={() => setShowDeactivateModal(false)}
                                className="px-5 py-2 bg-transparent dark:bg-transparent border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">Hủy</button>
                            <button 
                                onClick={handleConfirmDeactivate} 
                                disabled={deactivateLoading || (getUserRoles(deactivateUser).includes('manager') && (deactivateImpact?.manager?.projectsCount || 0) > 0 && !deactivateReplacementId)}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Xác nhận vô hiệu hóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tạo tài khoản mới</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 bg-transparent dark:bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Họ', key: 'firstName', type: 'text' },
                                { label: 'Tên', key: 'lastName', type: 'text' },
                                { label: 'Email', key: 'email', type: 'email' },
                                { label: 'Mật khẩu', key: 'password', type: 'password' },
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-350 mb-1">{label}</label>
                                    <input type={type} value={createForm[key]}
                                        onChange={e => setCreateForm({ ...createForm, [key]: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500" />
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-350 mb-1">Role</label>
                                <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                                    <option value="employee">Nhân viên</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700 rounded-b-lg">
                            <button onClick={() => setShowCreateModal(false)}
                                className="px-5 py-2 bg-transparent dark:bg-transparent border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">Hủy</button>
                            <button onClick={handleCreateUser} disabled={creating}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50">
                                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo...</> : <><PlusCircle className="w-4 h-4 mr-2" />Tạo tài khoản</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;