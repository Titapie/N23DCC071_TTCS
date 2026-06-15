// src/components/tasks/TaskForm.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { UserPlus, Loader2, X } from 'lucide-react';
import { TASK_STATUS, PRIORITY, TASK_STATUS_LABELS, PRIORITY_LABELS, DARK_MODE_COLORS } from '../../utils/constants';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import DatePicker from '../common/DatePicker';
import TaskMemberPicker from './TaskMemberPicker';
import assignmentService from '../../services/assignmentService';
import projectService from '../../services/projectService';
import { ToastContext } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import { hasManagerRole, isAdmin } from '../../utils/roleUtils';
const calculateStatusFromStartDate = (startDateStr) => {
    if (!startDateStr) return '';
    const parts = startDateStr.split('-');
    if (parts.length !== 3) return '';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const start = new Date(year, month, day);
    start.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return start <= today ? TASK_STATUS.IN_PROGRESS : TASK_STATUS.TODO;
};

const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return '';
    }
};

const TaskForm = ({ initialData = {}, projects = [], onSubmit, onCancel }) => {
    const isEditMode = !!(initialData._id || initialData.id);

    const [formData, setFormData] = useState({
        name: initialData.name || '',
        description: initialData.description || '',
        status: initialData.status || (isEditMode ? TASK_STATUS.TODO : calculateStatusFromStartDate(initialData.startDate ? initialData.startDate.slice(0, 10) : '')),
        priority: initialData.priority || PRIORITY.MEDIUM,
        startDate: initialData.startDate ? initialData.startDate.slice(0, 10) : '',
        dueDate: initialData.dueDate ? initialData.dueDate.slice(0, 10) : '',
        project: initialData.project || ''
    });

    const [errors, setErrors] = useState({});
    const [showPicker, setShowPicker] = useState(false);

    const { showToast } = useContext(ToastContext);
    const { user: authUser } = useContext(AuthContext);

    const [assignments, setAssignments] = useState([]);
    const [loadingAssignees, setLoadingAssignees] = useState(false);
    const [removingId, setRemovingId] = useState(null);
    const [confirmRemove, setConfirmRemove] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [invalidAssigneesConfirm, setInvalidAssigneesConfirm] = useState(null);

    const taskId = initialData._id || initialData.id;
    const isManager = hasManagerRole(authUser) || isAdmin(authUser);

    const fetchAssignments = useCallback(async () => {
        if (!taskId) return;
        try {
            setLoadingAssignees(true);
            const res = await assignmentService.getTaskAssignments(taskId);
            setAssignments(res.data || []);
        } catch (err) {
            console.error('Lỗi khi tải danh sách phân công:', err);
            setAssignments([]);
        } finally {
            setLoadingAssignees(false);
        }
    }, [taskId]);

    useEffect(() => {
        if (taskId) {
            fetchAssignments();
        }
    }, [taskId, fetchAssignments]);

    useEffect(() => {
        const fetchProjectMembers = async () => {
            const projId = formData.project;
            if (!projId) return;
            try {
                const res = await projectService.getProjectMembers(projId);
                setProjectMembers(res.data || []);
            } catch (err) {
                console.error("Lỗi khi tải thành viên dự án:", err);
            }
        };
        fetchProjectMembers();
    }, [formData.project]);

    useEffect(() => {
        if (!formData.project && projects.length > 0 && !initialData._id && !initialData.id) {
            setFormData(prev => ({
                ...prev,
                project: projects[0]._id || projects[0].id
            }));
        }
    }, [projects, initialData, formData.project]);

    const handleRemoveAssignment = async () => {
        if (!confirmRemove) return;
        try {
            setRemovingId(confirmRemove.assignmentId);
            await assignmentService.deleteAssignment(confirmRemove.assignmentId);
            showToast(`Đã gỡ ${confirmRemove.name} khỏi công việc`, 'success');
            setConfirmRemove(null);
            await fetchAssignments();
        } catch (err) {
            showToast(err.message || 'Không thể gỡ thành viên', 'error');
        } finally {
            setRemovingId(null);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Tên task không được để trống';
        }
        if (!formData.status) {
            newErrors.status = isEditMode
                ? 'Trạng thái không được để trống'
                : 'Vui lòng chọn ngày bắt đầu để xác định trạng thái';
        }
        if (!formData.priority) {
            newErrors.priority = 'Ưu tiên không được để trống';
        }

        const selectedProject = projects.find(p => (p._id || p.id) === formData.project);
        const getMidnightDate = (dateVal) => {
            if (!dateVal) return null;
            let d;
            if (typeof dateVal === 'string' && dateVal.includes('-')) {
                const parts = dateVal.slice(0, 10).split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    d = new Date(year, month, day);
                }
            }
            if (!d) {
                d = new Date(dateVal);
            }
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const taskStart = getMidnightDate(formData.startDate);
        const taskDue = getMidnightDate(formData.dueDate);

        if (selectedProject) {
            const projStart = getMidnightDate(selectedProject.startDate);
            const projEnd = getMidnightDate(selectedProject.endDate);

            if (taskStart && projStart && taskStart < projStart) {
                newErrors.startDate = `Ngày bắt đầu công việc không được trước ngày bắt đầu dự án (${formatDateDisplay(selectedProject.startDate)}).`;
            }
            if (taskDue && projEnd && taskDue > projEnd) {
                newErrors.dueDate = `Ngày kết thúc công việc không được sau ngày kết thúc dự án (${formatDateDisplay(selectedProject.endDate)}).`;
            }
        }

        if (taskStart && taskDue && taskStart > taskDue) {
            newErrors.dueDate = 'Ngày kết thúc công việc không được trước ngày bắt đầu.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirmRemoveInvalidAssignees = async () => {
        if (!invalidAssigneesConfirm) return;
        try {
            for (const a of invalidAssigneesConfirm) {
                await assignmentService.deleteAssignment(a._id);
            }
            showToast(`Đã xóa các nhân viên không thuộc dự án khỏi phần giao việc`, 'success');
            setInvalidAssigneesConfirm(null);
            
            // Re-fetch assignments
            await fetchAssignments();
            
            // Proceed to submit
            if (validate()) {
                onSubmit({ ...formData });
            }
        } catch (err) {
            showToast(err.message || 'Lỗi khi xóa thành viên', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isEditMode && isManager && ['todo', 'in_progress', 'pending'].includes(formData.status) && projectMembers.length > 0) {
            const memberUserIds = projectMembers.map(m => (m.user?._id || m.user?.id || m.user).toString());
            const invalidAssignees = assignments.filter(assignee => {
                const u = assignee.assignee || {};
                const userId = (u._id || u.id || assignee.assignee)?.toString();
                const isEmployee = u.role === 'employee' || (u.roles && u.roles.includes('employee')) || (!u.role && !u.roles);
                return userId && isEmployee && !memberUserIds.includes(userId);
            });
            
            if (invalidAssignees.length > 0) {
                setInvalidAssigneesConfirm(invalidAssignees);
                return;
            }
        }

        if (validate()) {
            onSubmit({ ...formData });
        }
    };

    const handleChange = (field, value) => {
        let newFormData = { ...formData, [field]: value };
        if (field === 'startDate' && !isEditMode) {
            newFormData.status = calculateStatusFromStartDate(value);
        }
        setFormData(newFormData);

        const newErrors = { ...errors };
        if (errors[field]) {
            newErrors[field] = null;
        }
        if (field === 'startDate' && !isEditMode) {
            newErrors.status = null;
        }
        setErrors(newErrors);
    };

    const statusOptions = Object.values(TASK_STATUS)
        .map(status => ({
            value: status,
            label: TASK_STATUS_LABELS[status]
        }));

    const priorityOptions = Object.values(PRIORITY).map(priority => ({
        value: priority,
        label: PRIORITY_LABELS[priority] || priority
    }));

    const projectOptions = projects.map(project => ({
        value: project._id || project.id,
        label: project.name
    }));

    const selectedProjectInfo = projects.find(p => (p._id || p.id) === formData.project);

    return (
        <>
        {confirmRemove && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmRemove(null)} />
                <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full z-50">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Xác nhận gỡ</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-5">
                        Bạn có chắc muốn gỡ <strong>{confirmRemove.name}</strong> khỏi công việc này?
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={() => setConfirmRemove(null)}
                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleRemoveAssignment}
                            disabled={removingId !== null}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {removingId !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gỡ thành viên'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        {/* Header cố định */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700  top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {initialData?._id || initialData?.id ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
                    </h1>
                </div>
            </div>
        
        <div className={`min-h-screen ${DARK_MODE_COLORS.BG_SECONDARY} animate-fade-in`}>
            
            <div className="max-w-7xl mx-auto p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content - Left Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Header Preview */}
                            <div className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-2xl overflow-hidden shadow-sm animate-scale-in`}>
                                <div className={`aspect-video ${DARK_MODE_COLORS.BG_GRADIENT} flex items-center justify-center`}>
                                    <div className="text-white text-9xl font-bold opacity-30">
                                        {formData.name ? formData.name.charAt(0).toUpperCase() : 'T'}
                                    </div>
                                </div>
                            </div>

                            {/* Task Information */}
                            <div className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-2xl shadow-sm p-6 space-y-6`}>
                                <div>
                                    <h2 className={`text-xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-4`}>Thông tin cơ bản</h2>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                                                Tên việc *
                                            </label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                placeholder="Nhập tên việc..."
                                                className="transition-all duration-200 focus:scale-[1.01]"
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 dark:text-red-400 text-sm mt-1 animate-slide-down">{errors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                                                Mô tả
                                            </label>
                                            <Input
                                                multiline={true}
                                                rows={4}
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                placeholder="Mô tả công việc..."
                                                className="transition-all duration-200 focus:scale-[1.01]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Time Range */}
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-4">
                                        <h2 className={`text-xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Thời gian thực hiện</h2>
                                        {selectedProjectInfo && selectedProjectInfo.startDate && selectedProjectInfo.endDate && (
                                            <span className={`text-xs ${DARK_MODE_COLORS.TEXT_SECONDARY} italic`}>
                                                Thời gian thực hiện phải nằm trong khoảng từ {formatDateDisplay(selectedProjectInfo.startDate)} đến {formatDateDisplay(selectedProjectInfo.endDate)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                                                Ngày bắt đầu
                                            </label>
                                            <DatePicker
                                                value={formData.startDate}
                                                onChange={(e) => handleChange('startDate', e.target.value)}
                                                className="transition-all duration-200 focus:scale-[1.01]"
                                                hasError={!!errors.startDate}
                                            />
                                            {errors.startDate && (
                                                <p className="text-red-500 dark:text-red-400 text-sm mt-1 animate-slide-down">{errors.startDate}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                                                Ngày kết thúc
                                            </label>
                                            <DatePicker
                                                value={formData.dueDate}
                                                onChange={(e) => handleChange('dueDate', e.target.value)}
                                                className="transition-all duration-200 focus:scale-[1.01]"
                                                hasError={!!errors.dueDate}
                                            />
                                            {errors.dueDate && (
                                                <p className="text-red-500 dark:text-red-400 text-sm mt-1 animate-slide-down">{errors.dueDate}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Right Column (1/3) */}
                        <div className="lg:col-span-1">
                            <div className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-2xl shadow-sm p-6 sticky top-6 space-y-6`}>
                                <h3 className={`text-lg font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Phân loại</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                                            Trạng thái *
                                        </label>
                                        {!isEditMode ? (
                                            <div
                                                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200
                                                    ${formData.status 
                                                        ? 'bg-gray-100 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium' 
                                                        : 'bg-gray-50 dark:bg-slate-800 border-dashed border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500 italic'
                                                    }`}
                                            >
                                                {formData.status 
                                                    ? TASK_STATUS_LABELS[formData.status] 
                                                    : 'Trạng thái sẽ được tự động xác định sau khi chọn ngày bắt đầu'}
                                            </div>
                                        ) : (
                                            <Select
                                                value={formData.status}
                                                onChange={(e) => handleChange('status', e.target.value)}
                                                options={statusOptions}
                                                className="transition-all duration-200 focus:scale-[1.01]"
                                            />
                                        )}
                                        {errors.status && (
                                            <p className="text-red-500 dark:text-red-400 text-sm mt-1 animate-slide-down">{errors.status}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                                            Ưu tiên *
                                        </label>
                                        <Select
                                            value={formData.priority}
                                            onChange={(e) => handleChange('priority', e.target.value)}
                                            options={priorityOptions}
                                            className="transition-all duration-200 focus:scale-[1.01]"
                                        />
                                        {errors.priority && (
                                            <p className="text-red-500 dark:text-red-400 text-sm mt-1 animate-slide-down">{errors.priority}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                                            Dự án
                                        </label>
                                        {initialData._id || initialData.id ? (
                                            <div className={`px-3 py-2 ${DARK_MODE_COLORS.BG_INPUT} border ${DARK_MODE_COLORS.BORDER_INPUT} rounded-lg ${DARK_MODE_COLORS.TEXT_LABEL}`}>
                                                {initialData.project?.name || initialData.project_name || 'Không thuộc dự án nào'}
                                            </div>
                                        ) : (
                                            <Select
                                                value={formData.project}
                                                onChange={(e) => handleChange('project', e.target.value)}
                                                options={projectOptions}
                                                className="transition-all duration-200 focus:scale-[1.01]"
                                            />
                                        )}
                                    </div>

                                    {initialData._id || initialData.id ? (
                                        <div className="pt-2 space-y-4">
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPicker(true)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Giao việc
                                                </button>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`${DARK_MODE_COLORS.TEXT_SECONDARY} text-sm font-medium`}>
                                                        Thành viên được giao
                                                    </span>
                                                </div>

                                                {loadingAssignees ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                                    </div>
                                                ) : assignments.length > 0 ? (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                        {assignments.map((assignment) => {
                                                            const u = assignment.assignee || {};
                                                            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                                                            return (
                                                                <div
                                                                    key={assignment._id}
                                                                    className={`group flex items-center gap-2 px-2.5 py-2 ${DARK_MODE_COLORS.BADGE_GRAY} rounded-xl transition-all`}
                                                                >
                                                                    <div className="w-7 h-7 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                                                                        {(u.firstName || 'U').charAt(0)}{(u.lastName || '').charAt(0)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-medium ${DARK_MODE_COLORS.TEXT_PRIMARY} truncate`}>{name}</p>
                                                                        <p className={`text-xs ${DARK_MODE_COLORS.TEXT_TERTIARY} truncate`}>{u.email}</p>
                                                                    </div>
                                                                    {isManager && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setConfirmRemove({ assignmentId: assignment._id, name })}
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                                                                            title="Gỡ khỏi công việc"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className={`text-xs ${DARK_MODE_COLORS.TEXT_TERTIARY} py-2`}>Chưa có thành viên được giao</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="pt-2">
                                            <p className={`text-xs ${DARK_MODE_COLORS.TEXT_TERTIARY} italic`}>
                                                💡 Để giao việc cho thành viên, hãy lưu công việc trước rồi chọn "Giao việc".
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-6 space-y-3">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full transition-transform hover:scale-105 active:scale-95"
                                    >
                                        {initialData?._id || initialData?.id ? 'Cập nhật việc' : 'Tạo công việc'}
                                    </Button>
                                    
                                    {onCancel && (
                                        <Button
                                            type="button"
                                            onClick={onCancel}
                                            variant="outline"
                                            className="w-full transition-transform hover:scale-105 active:scale-95"
                                        >
                                            Hủy
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal cảnh báo và tự động xóa nhân viên không còn thuộc project */}
            {invalidAssigneesConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setInvalidAssigneesConfirm(null)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full z-50 border border-yellow-100 dark:border-yellow-900/30 animate-in zoom-in-95 duration-200">
                        <div className="mb-4">
                            <div className="p-2 w-fit rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-250 dark:border-yellow-900/30 mb-3">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Xác nhận cập nhật công việc</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                            Công việc này đang được giao cho{' '}
                            <strong>
                                {invalidAssigneesConfirm.map(a => `${a.assignee?.firstName || ''} ${a.assignee?.lastName || ''}`.trim() || a.assignee?.email).join(', ')}
                            </strong>
                            , người không còn là thành viên của dự án.
                            <br />
                            Xác nhận cập nhật sẽ <strong>xóa nhân viên này ra khỏi phần giao việc</strong>. Bạn có chắc chắn muốn tiếp tục?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setInvalidAssigneesConfirm(null)}
                                className="px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRemoveInvalidAssignees}
                                className="px-4 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-750 text-white text-sm font-bold transition-colors"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPicker && (
                <TaskMemberPicker
                    isOpen={showPicker}
                    onClose={() => setShowPicker(false)}
                    taskId={initialData._id || initialData.id}
                    projectId={initialData.project?._id || initialData.project?.id || initialData.project || formData.project}
                    onAssigned={fetchAssignments}
                />
            )}
        </div>
        </>
    );
};

export default TaskForm;