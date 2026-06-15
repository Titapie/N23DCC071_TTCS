// src/components/task/TaskMemberPicker.jsx
// Modal giao việc cho thành viên task (Assignment)
// Chỉ hiển thị member thuộc project chứa task
// Gọi POST /api/assignments { taskId, assigneeId } để tạo phân công
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Check, UserPlus, Users, Loader2, ArrowRight } from 'lucide-react';
import { DARK_MODE_COLORS } from '../../utils/constants';
import userService from '../../services/userService';
import assignmentService from '../../services/assignmentService';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import { ToastContext } from '../../context/ToastContext';

/**
 * TaskMemberPicker — Modal giao việc cho thành viên task
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - taskId: string              — ID của task
 *  - projectId: string           — ID của project chứa task
 *  - currentAssignments: array   — [{_id, assignee:{_id,...}}] assignments hiện tại
 *  - onAssigned: () => void      — callback sau khi assign thành công (để refetch)
 */
const TaskMemberPicker = ({ isOpen, onClose, taskId, projectId, currentAssignments = [], onAssigned }) => {
    const { showToast } = useContext(ToastContext);
    const navigate = useNavigate();

    // employees: [{_id, firstName, lastName, email, role}]
    const [employees, setEmployees] = useState([]);
    // selectedUserIds: Set of user._id chờ được assign
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [projectMemberUserIds, setProjectMemberUserIds] = useState(new Set());
    const [fetchError, setFetchError] = useState(null);
    const overlayRef = useRef(null);

    // Normalize projectId thành string (tránh [object Object] khi ObjectId không được serialize)
    const projectIdStr = projectId ? String(projectId) : null;

    // State lưu IDs của user đã được assign vào task
    const [alreadyAssignedIds, setAlreadyAssignedIds] = useState(new Set());

    useEffect(() => {
        if (!isOpen) return;
        setSelectedUserIds(new Set());
        setSearch('');
        setFetchError(null);
        fetchEmployees();
        fetchProjectMembers();
        fetchAssignments();
    }, [isOpen, projectIdStr, taskId]);

    // Lấy danh sách tất cả nhân viên: GET /api/users?role=employee
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await userService.getAllUsers({ role: 'employee' });
            setEmployees(res.data || []);
            setFetchError(null);
        } catch (err) {
            console.error('[TaskMemberPicker] Error fetching employees:', err);
            setFetchError(err.message || 'Không thể tải danh sách nhân viên');
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách thành viên dự án
    const fetchProjectMembers = async () => {
        if (!projectIdStr) return;
        try {
            const res = await projectService.getProjectMembers(projectIdStr);
            const membersList = res.data || [];
            const memberIds = new Set(
                membersList
                    .map(m => m.user?._id || m.user?.id)
                    .filter(Boolean)
                    .map(id => String(id))
            );
            setProjectMemberUserIds(memberIds);
        } catch (err) {
            console.error('[TaskMemberPicker] Error fetching project members:', err);
        }
    };

    // Lấy danh sách phân công hiện tại của task
    const fetchAssignments = async () => {
        if (!taskId) return;
        try {
            const res = await taskService.getTaskAssignments(taskId);
            const list = res.data || [];
            const assignedIds = new Set(
                list.map(a => String(a.assignee?._id || a.assignee?.id || a.assignee || ''))
            );
            setAlreadyAssignedIds(assignedIds);
        } catch (err) {
            console.error('[TaskMemberPicker] Error fetching assignments:', err);
        }
    };

    if (!isOpen) return null;

    // Filter theo search, loại trừ user đã được assign vào task
    const filtered = employees.filter((u) => {
        if (!u) return false;
        const uid = String(u._id || u.id || '');
        if (alreadyAssignedIds.has(uid)) return false; // đã assign rồi
        const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const q = search.toLowerCase();
        return !q || name.includes(q) || email.includes(q);
    });

    const toggleUser = (uid) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(uid)) next.delete(uid);
            else next.add(uid);
            return next;
        });
    };

    // Giao việc: gọi POST /api/assignments { taskId, assigneeId } cho từng user đã chọn
    const handleSave = async () => {
        if (selectedUserIds.size === 0) {
            showToast('Vui lòng chọn ít nhất một thành viên', 'error');
            return;
        }
        setSaving(true);
        let successCount = 0;
        let errorMessages = [];

        for (const uid of selectedUserIds) {
            try {
                await assignmentService.createAssignment(taskId, uid);
                successCount++;
            } catch (err) {
                errorMessages.push(err.message || 'Lỗi không xác định');
            }
        }

        setSaving(false);

        if (successCount > 0) {
            showToast(`Đã giao việc cho ${successCount} thành viên thành công`, 'success');
            onAssigned(); // trigger refetch ở TaskDetail
            onClose(); // ẩn box Giao việc đi
        }
        if (errorMessages.length > 0) {
            showToast(errorMessages[0], 'error');
        }
    };

    const getInitials = (user) =>
        `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

    const selectedCount = selectedUserIds.size;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div
                className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden`}
                style={{ maxHeight: '85vh', animation: 'slideUp 0.2s ease-out' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className={`text-base font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Giao việc cho thành viên</h2>
                            <p className={`text-xs ${DARK_MODE_COLORS.TEXT_TERTIARY}`}>
                                {selectedCount > 0 ? `${selectedCount} người được chọn` : 'Chọn nhân viên để giao việc'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg ${DARK_MODE_COLORS.BG_HOVER} ${DARK_MODE_COLORS.TEXT_SECONDARY} transition-colors`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-700">
                    <div className={`flex items-center gap-2 px-3 py-2 ${DARK_MODE_COLORS.BG_INPUT} border ${DARK_MODE_COLORS.BORDER_INPUT} rounded-xl`}>
                        <Search className={`w-4 h-4 flex-shrink-0 ${DARK_MODE_COLORS.TEXT_TERTIARY}`} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên hoặc email..."
                            className={`flex-1 bg-transparent outline-none text-sm ${DARK_MODE_COLORS.TEXT_PRIMARY} ${DARK_MODE_COLORS.PLACEHOLDER}`}
                            autoFocus
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch('')}>
                                <X className={`w-3.5 h-3.5 ${DARK_MODE_COLORS.TEXT_TERTIARY}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* User list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className={`text-sm ${DARK_MODE_COLORS.TEXT_TERTIARY}`}>Đang tải danh sách nhân viên...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Users className={`w-10 h-10 text-red-400`} />
                            <p className="text-sm text-red-500 text-center font-medium">Lỗi tải danh sách nhân viên</p>
                            <p className="text-xs text-red-400 text-center">{fetchError}</p>
                            <button onClick={fetchEmployees} className="text-xs text-blue-500 underline mt-1">Thử lại</button>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                                <Users className={`w-7 h-7 text-amber-500`} />
                            </div>
                            <div className="text-center">
                                <p className={`text-sm font-semibold ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-1`}>
                                    Chưa có nhân viên nào trong hệ thống
                                </p>
                            </div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Users className={`w-10 h-10 ${DARK_MODE_COLORS.TEXT_TERTIARY}`} />
                            <p className={`text-sm ${DARK_MODE_COLORS.TEXT_TERTIARY}`}>
                                {search ? 'Không tìm thấy người dùng' : 'Tất cả thành viên đã được giao'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((u) => {
                            const uid = String(u._id || u.id || '');
                            const isSelected = selectedUserIds.has(uid);
                            const isAlreadyAssigned = alreadyAssignedIds.has(uid);
                            return (
                                <button
                                    type="button"
                                    key={uid}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!isAlreadyAssigned) toggleUser(uid);
                                    }}
                                    disabled={isAlreadyAssigned}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150
                                        ${isAlreadyAssigned
                                            ? 'opacity-65 cursor-not-allowed bg-gray-50/50 dark:bg-slate-800/20'
                                            : isSelected
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                                : `${DARK_MODE_COLORS.BG_HOVER} border border-transparent`
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                                        ${(isSelected || isAlreadyAssigned) ? 'bg-blue-500 text-white' : DARK_MODE_COLORS.AVATAR_MEMBER}`}
                                    >
                                        {getInitials(u)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 text-left min-w-0">
                                        <p className={`text-sm font-medium ${DARK_MODE_COLORS.TEXT_PRIMARY} flex items-center gap-2 truncate`}>
                                            <span className="truncate">{u.firstName} {u.lastName}</span>
                                            {projectMemberUserIds.has(uid) && (
                                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] font-bold rounded">
                                                    Thành viên dự án
                                                </span>
                                            )}
                                        </p>
                                        <p className={`text-xs ${DARK_MODE_COLORS.TEXT_TERTIARY} truncate`}>
                                            {u.email}
                                            {isAlreadyAssigned && (
                                                <span className="ml-2 text-green-500 dark:text-green-400">✓ Đã giao</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Checkbox */}
                                    <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all duration-150
                                        ${(isSelected || isAlreadyAssigned)
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-300 dark:border-slate-600'
                                        }`}
                                    >
                                        {(isSelected || isAlreadyAssigned) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Selected tags */}
                {selectedCount > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-700">
                        <p className={`text-xs font-medium ${DARK_MODE_COLORS.TEXT_SECONDARY} mb-2`}>Sẽ giao việc cho:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {employees
                                .filter(u => selectedUserIds.has(String(u?._id || u?.id || '')))
                                .map(u => {
                                    const uid = String(u._id || u.id || '');
                                    return (
                                        <span
                                            key={uid}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium"
                                        >
                                            {u.firstName} {u.lastName}
                                            <button type="button" onClick={() => toggleUser(uid)}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`flex-1 py-2.5 rounded-xl border ${DARK_MODE_COLORS.BORDER_INPUT} ${DARK_MODE_COLORS.TEXT_SECONDARY} text-sm font-medium transition-all hover:scale-[1.02] active:scale-95`}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || selectedCount === 0}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        {saving ? 'Đang lưu...' : `Giao việc (${selectedCount})`}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)   scale(1);    }
                }
            `}</style>
        </div>
    );
};

export default TaskMemberPicker;
