// ProjectDetail.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import projectService from '../../services/projectService';
import ProjectForm from './ProjectForm';
import { jwtDecode } from 'jwt-decode';
import { tokenStore } from "../../utils/api.js";
import taskService from "../../services/taskService.js";
import userService from '../../services/userService';
import {DARK_MODE_COLORS} from "../../utils/constants.js";
import { ToastContext } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // States
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [taskFilter, setTaskFilter] = useState('all');
    const [taskSearch, setTaskSearch] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [showActions, setShowActions] = useState(false);

    // States for member deletion & handover
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingMember, setDeletingMember] = useState(null); // { membershipId, userId, name }
    const [unfinishedTasksCount, setUnfinishedTasksCount] = useState(0);
    const [eligibleEmployees, setEligibleEmployees] = useState([]);
    const [handoverEmployeeId, setHandoverEmployeeId] = useState('');
    const [loadingTasksCount, setLoadingTasksCount] = useState(false);
    const [submittingDelete, setSubmittingDelete] = useState(false);

    const { showToast } = useContext(ToastContext);
    const { user: authUser } = useContext(AuthContext);

    // User state (từ token)
    const [currentUser, setCurrentUser] = useState({ id: null, role: null, email: '' });

    // States for Edit Form
    const [showEditForm, setShowEditForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Decode token to get user info
    useEffect(() => {
        const getUserFromToken = () => {
            try {
                const token = tokenStore.getAccessToken();
                if (token) {
                    const decoded = jwtDecode(token);
                    setCurrentUser({
                        id: decoded.userId || decoded.id || decoded.sub,
                        role: decoded.role || 'user',
                        Email: decoded.Email || decoded.email || ''
                    });
                }
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        };
        getUserFromToken();
    }, []);

    // Fetch members từ API thật: GET /api/projects/:id/members
    const fetchMembers = useCallback(async () => {
        try {
            const res = await projectService.getProjectMembers(id);
            setMembers(res.data || []);
        } catch {
            setMembers([]);
        }
    }, [id]);

    // Fetch project details and tasks
    const fetchProjectDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const projectResponse = await projectService.getProject(id);
            if (projectResponse.success) {
                const projectData = projectResponse.project || projectResponse.data;
                setProject(projectData);
            }

            // Fix: dùng params.project (đúng key của taskService)
            try {
                const tasksResponse = await taskService.getTasks({ project: id, limit: 100 });
                setTasks(tasksResponse.tasks || tasksResponse.data || []);
            } catch {
                setTasks([]);
            }

            await fetchMembers();
        } catch (err) {
            setError(err.message || 'Không thể tải thông tin dự án');
        } finally {
            setLoading(false);
        }
    }, [id, fetchMembers]);

    useEffect(() => {
        if (id) fetchProjectDetail();
    }, [id]);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa xác định';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const projectCreatorId = String(
        (project?.createdBy?._id || project?.createdBy) || ''
    );

    // Check permissions dựa trên role thật từ AuthContext
    const getPermissions = () => {
        const role = authUser?.role;
        const isAdmin = role === 'admin';
        // project.createdBy._id là ObjectId → cần toString()
        const myId = String(authUser?._id || authUser?.id || '');
        const isProjectManager = isAdmin || (role === 'manager' && myId && myId === projectCreatorId);
        return {
            canEdit: isProjectManager,
            canDelete: isProjectManager,
            canAddMembers: isProjectManager,
            canManageMembers: isProjectManager,
            canView: true
        };
    };

    const permissions = getPermissions();

    // Calculate completion rate
    const getCompletionRate = () => {
        if (!project) return 0;
        const total = parseInt(project.total_tasks) ||
            parseInt(project.totalTasks) ||
            tasks.length || 0;
        const completed = parseInt(project.completed_tasks) ||
            parseInt(project.completedTasks) ||
            tasks.filter(t => t.status === 'done').length || 0;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    // Get progress color
    const getProgressColor = (rate) => {
        if (rate >= 80) return 'bg-green-500';
        if (rate >= 50) return 'bg-blue-500';
        if (rate >= 30) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Check if overdue — dùng endDate (field thật trong Project model)
    const isOverdue = () => {
        if (!project?.endDate) return false;
        return new Date(project.endDate) < new Date() && getCompletionRate() < 100;
    };

    // Get manager name — dùng createdBy (field thật trong Project model)
    const getManagerName = () => {
        if (!project) return 'Chưa có';
        const cb = project.createdBy;
        if (cb && typeof cb === 'object') {
            return `${cb.firstName || ''} ${cb.lastName || ''}`.trim() || cb.email || 'Chưa có';
        }
        return 'Chưa có';
    };

    // Filter tasks
    const getFilteredTasks = () => {
        let filtered = tasks;

        if (taskFilter !== 'all') {
            filtered = filtered.filter(task => {
                if (taskFilter === 'done') return task.status === 'done';
                if (taskFilter === 'in_progress') return task.status === 'in_progress';
                if (taskFilter === 'pending') return task.status === 'pending';
                if (taskFilter === 'todo') return task.status === 'todo';
                if (taskFilter === 'cancelled') return task.status === 'cancelled';
                return true;
            });
        }

        if (taskSearch) {
            filtered = filtered.filter(task =>
                task.name?.toLowerCase().includes(taskSearch.toLowerCase()) ||
                task.description?.toLowerCase().includes(taskSearch.toLowerCase())
            );
        }

        return filtered;
    };

    // Get task status badge
    const getStatusBadge = (status) => {
        const badges = {
            done: { bg: 'bg-green-100', text: 'text-green-700', label: 'Hoàn thành' },
            in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đang thực hiện' },
            todo: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Chưa bắt đầu' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Chờ xử lý' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy' }
        };
        const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
        return (
            <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-xs font-medium rounded-full`}>
                {badge.label}
            </span>
        );
    };

    // Get priority badge
    const getPriorityBadge = (priority) => {
        const badges = {
            high: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cao' },
            medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Trung bình' },
            low: { bg: 'bg-green-100', text: 'text-green-700', label: 'Thấp' }
        };
        const badge = badges[priority] || { bg: 'bg-gray-100', text: 'text-gray-700', label: priority };
        return (
            <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs font-medium rounded`}>
                {badge.label}
            </span>
        );
    };

    // Handlers
    const handleDeleteMemberClick = async (membership) => {
        const u = membership.user || {};
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
        const userId = u._id || u.id;
        
        setDeletingMember({
            membershipId: membership._id,
            userId: userId,
            name: name
        });
        setLoadingTasksCount(true);
        setHandoverEmployeeId('');
        setShowDeleteModal(true);
        
        try {
            const res = await projectService.getMemberUnfinishedTasks(id, userId);
            const count = res.unfinishedTaskCount || 0;
            setUnfinishedTasksCount(count);
            
            if (count > 0) {
                const userRes = await userService.getAllUsers({ role: 'employee', isActive: true, limit: 1000 });
                const employees = userRes.data || userRes.users || [];
                const filteredEmployees = employees.filter(emp => String(emp._id || emp.id) !== String(userId));
                setEligibleEmployees(filteredEmployees);
            }
        } catch (err) {
            console.error('Lỗi khi kiểm tra công việc chưa hoàn thành:', err);
            showToast(err.message || 'Lỗi khi kiểm tra công việc chưa hoàn thành của thành viên', 'error');
        } finally {
            setLoadingTasksCount(false);
        }
    };

    const handleConfirmDeleteMember = async () => {
        if (!deletingMember) return;
        
        if (unfinishedTasksCount > 0 && !handoverEmployeeId) {
            showToast('Vui lòng chọn người nhận bàn giao công việc', 'error');
            return;
        }
        
        try {
            setSubmittingDelete(true);
            await projectService.removeMemberFromProject(
                id, 
                deletingMember.userId, 
                unfinishedTasksCount > 0 ? handoverEmployeeId : null
            );
            showToast('Xóa thành viên khỏi dự án thành công!', 'success');
            setShowDeleteModal(false);
            setDeletingMember(null);
            
            await fetchMembers();
            const projectResponse = await projectService.getProject(id);
            if (projectResponse.success) {
                const projectData = projectResponse.project || projectResponse.data;
                setProject(projectData);
            }
            try {
                const tasksResponse = await taskService.getTasks({ project: id, limit: 100 });
                setTasks(tasksResponse.tasks || tasksResponse.data || []);
            } catch {
                setTasks([]);
            }
        } catch (err) {
            showToast(err.message || 'Không thể xóa thành viên khỏi dự án', 'error');
        } finally {
            setSubmittingDelete(false);
        }
    };

    const handleEdit = () => setShowEditForm(true);

    const handleDelete = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa dự án này?')) return;
        try {
            setDeletingId(id);
            await projectService.deleteProject(id);
            showToast('Xóa dự án thành công!', 'success');
            navigate('/projects');
        } catch (err) {
            showToast(err.message || 'Không thể xóa dự án', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleFormSubmit = async (data) => {
        try {
            setIsSubmitting(true);
            await projectService.updateProject(id, data);
            showToast('Cập nhật dự án thành công!', 'success');
            setShowEditForm(false);
            await fetchProjectDetail();
        } catch (err) {
            showToast(err.message || 'Có lỗi xảy ra khi cập nhật dự án', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddMembers = () => navigate(`/projects/${id}/add-members`);
    const handleCreateTask = () => navigate(`/tasks/create`);
    const handleTaskClick = (taskId) => navigate(`/tasks/${taskId}`);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <LucideIcons.Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                        <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 animate-pulse"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Đang tải thông tin dự án...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LucideIcons.AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error || 'Không tìm thấy dự án'}</p>
                    <button
                        onClick={() => navigate('/projects')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const completionRate = getCompletionRate();
    const filteredTasks = getFilteredTasks();

    // Render Edit Form Modal
    if (showEditForm) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="max-w-2xl w-full">
                    <ProjectForm
                        project={project}
                        mode="edit"
                        onSubmit={handleFormSubmit}
                        onCancel={() => setShowEditForm(false)}
                        isLoading={isSubmitting}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ">
            
            <div className={`w-full mx-auto px-6 py-8 ${DARK_MODE_COLORS.BG_SECONDARY}`}>
                {/* Overdue Alert */}
                {isOverdue() && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-sm">
                        <div className="flex items-start gap-3">
                            <LucideIcons.AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-red-800">Dự án đã quá hạn!</p>
                                <p className="text-sm text-red-600 mt-1">
                                    Hạn chót: {formatDate(project.endDate)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Section */}
                <div className={` rounded-2xl shadow-lg p-8 mb-6 border border-gray-100 ${DARK_MODE_COLORS.BG_CARD}`}>
                    <div className="flex items-start justify-between ">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div>
                                    <h1 className={`text-4xl font-bold  mb-2 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{project.name}</h1>
                                    <div className={`flex items-center gap-2 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                        <LucideIcons.Users className="w-4 h-4" />
                                        <span className="text-sm">Manager: {getManagerName()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium  ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Tiến độ hoàn thành</span>
                                    <span className={`text-2xl font-bold bg-black bg-clip-text text-transparent ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                        {completionRate}%
                                    </span>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner ">
                                    <div
                                        className={`h-full ${getProgressColor(completionRate)} rounded-full transition-all duration-500 shadow-sm`}
                                        style={{ width: `${completionRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {authUser?.role !== 'employee' && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowActions(!showActions)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <LucideIcons.MoreVertical className="w-5 h-5 text-gray-600" />
                                </button>

                                {showActions && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                                        {permissions.canEdit && (
                                            <button
                                                onClick={handleEdit}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <LucideIcons.Edit className="w-4 h-4" />
                                                Chỉnh sửa
                                            </button>
                                        )}
                                        {permissions.canAddMembers && (
                                            <button
                                                onClick={handleAddMembers}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <LucideIcons.UserPlus className="w-4 h-4" />
                                                Thêm thành viên
                                            </button>
                                        )}
                                        {permissions.canDelete && (
                                            <>
                                                <div className="border-t border-gray-200 my-1"></div>
                                                <button
                                                    onClick={handleDelete}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    disabled={deletingId === id}
                                                >
                                                    {deletingId === id ? (
                                                        <LucideIcons.Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <LucideIcons.Trash2 className="w-4 h-4" />
                                                    )}
                                                    Xóa dự án
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 ">
                    <div className={`rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all ${DARK_MODE_COLORS.BG_CARD}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <LucideIcons.ListTodo className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <p className={`text-3xl font-bold mb-1 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                            {project.total_tasks || project.totalTasks || tasks.length || 0}
                        </p>
                        <p className={`text-sm text-gray-600 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Tổng tasks đang tham gia</p>
                    </div>

                        <div className={`rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all ${DARK_MODE_COLORS.BG_CARD}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <LucideIcons.CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                        <p className={`text-3xl font-bold  mb-1 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                            {project.completed_tasks || project.completedTasks || tasks.filter(t => t.status === 'done').length || 0}
                        </p>
                        <p className={`text-sm ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Hoàn thành</p>
                    </div>

                    <div className={`rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all ${DARK_MODE_COLORS.BG_CARD}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <LucideIcons.Target className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <p className={`text-3xl font-bold mb-1 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                            {project.in_progress_tasks || project.inProgressTasks || tasks.filter(t => t.status === 'in_progress').length || 0}
                        </p>
                        <p className={`text-sm ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Đang thực hiện</p>
                    </div>

                    <div className={"rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all dark:bg-slate-700"}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <LucideIcons.AlertCircle className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                        <p className={`text-3xl font-bold mb-1 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                            {project.not_finish_tasks || project.notFinishTasks || tasks.filter(t => t.status === 'cancelled').length || 0}
                        </p>
                        <p className={`text-sm ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Chưa hoàn thành</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className={`rounded-2xl shadow-lg border border-gray-100 ${DARK_MODE_COLORS.BG_CARD}`}>
                    <div className="border-b border-gray-200">
                        <div className="flex gap-1 p-2">
                            <button onClick={() => setActiveTab('overview')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                                    activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                                }`}>
                                <LucideIcons.BarChart3 className="w-4 h-4" />
                                Tổng quan
                            </button>
                            <button onClick={() => setActiveTab('members')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                                    activeTab === 'members' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                                }`}>
                                <LucideIcons.Users className="w-4 h-4" />
                                Thành viên ({members.length})
                            </button>
                            <button onClick={() => setActiveTab('tasks')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                                    activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                                }`}>
                                <LucideIcons.ListTodo className="w-4 h-4" />
                                Công việc ({tasks.length})
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'overview' ? (
                            <div className="space-y-6">
                                {/* Project Information */}
                                <div className="bg-gray-100 rounded-xl p-6 border border-gray-200 dark:bg-slate-500">
                                    <h3 className={`text-lg font-semibold mb-4 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Thông tin dự án</h3>
                                    <div className="space-y-4">
                                        {project.description && (
                                            <div>
                                                <p className={`text-sm font-medium mb-2 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Mô tả</p>
                                                <p className="text-gray-800 bg-white rounded-lg p-4 dark:bg-slate-300">{project.description}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white rounded-lg p-4 dark:bg-slate-300">
                                                <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                                                    <LucideIcons.Calendar className="w-4 h-4" />
                                                    Ngày bắt đầu
                                                </p>
                                                <p className="text-gray-800 font-semibold">{formatDate(project.startDate)}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 dark:bg-slate-300">
                                                <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                                                    <LucideIcons.Calendar className="w-4 h-4" />
                                                    Ngày kết thúc
                                                </p>
                                                {/* endDate là field thật trong Project model */}
                                                <p className="text-gray-800 font-semibold">{formatDate(project.endDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'members' ? (
                            /* === Tab Thành viên === */
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-lg font-semibold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                        Thành viên dự án ({members.length})
                                    </h3>
                                    {permissions.canAddMembers && (
                                        <button
                                            onClick={handleAddMembers}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                                        >
                                            <LucideIcons.UserPlus className="w-4 h-4" />
                                            Thêm thành viên
                                        </button>
                                    )}
                                </div>
                                {members.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-slate-600 rounded-xl border-2 border-dashed border-gray-300">
                                        <LucideIcons.Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className={`font-medium ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Chưa có thành viên</p>
                                        <p className="text-sm text-gray-500 mt-1">Manager có thể thêm thành viên vào dự án</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* members từ API: [{_id, project, user:{_id,firstName,lastName,email}, role, joinedAt}] */}
                                        {members.map((membership) => {
                                            const u = membership.user || {};
                                            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                                            const isOwner = String(u._id || u.id) === projectCreatorId;
                                            return (
                                                <div key={membership._id}
                                                    className="bg-white dark:bg-slate-600 rounded-xl p-4 border border-gray-200 dark:border-slate-500 hover:shadow-md transition-all flex justify-between items-center">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                            {(u.firstName || 'U').charAt(0)}{(u.lastName || '').charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-semibold truncate ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{name || 'Unknown'}</p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                    {permissions.canManageMembers && !isOwner && (
                                                        <button
                                                            onClick={() => handleDeleteMemberClick(membership)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors ml-2 flex-shrink-0"
                                                            title="Xóa thành viên khỏi dự án"
                                                        >
                                                            <LucideIcons.Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'tasks' ? (
                            <div className="space-y-6">
                                {/* Task Filters */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <LucideIcons.Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 " />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm task..."
                                            value={taskSearch}
                                            onChange={(e) => setTaskSearch(e.target.value)}
                                            className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${DARK_MODE_COLORS.BG_INPUT}`}
                                        />
                                    </div>

                                    <div className="flex gap-3 ">
                                        <select
                                            value={taskFilter}
                                            onChange={(e) => setTaskFilter(e.target.value)}
                                            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm min-w-[180px]"
                                        >
                                            <option value="all">Tất cả trạng thái</option>
                                            <option value="pending">Chờ xử lý</option>
                                            <option value="in_progress">Đang thực hiện</option>
                                            <option value="todo">Chưa bắt đầu</option>
                                            <option value="done">Hoàn thành</option>
                                            <option value="cancelled">Đã hủy</option>
                                        </select>

                                        {authUser?.role !== 'employee' && (
                                            <button
                                                onClick={handleCreateTask}
                                                className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-blue-500  transition-all shadow-md hover:shadow-lg"
                                            >
                                                <LucideIcons.Plus className="w-4 h-4" />
                                                Tạo Task
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tasks List */}
                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                                            <LucideIcons.ListTodo className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <p className="text-gray-600 font-medium mb-2">
                                            {taskSearch || taskFilter !== 'all'
                                                ? 'Không tìm thấy task phù hợp'
                                                : 'Chưa có task nào'}
                                        </p>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {taskSearch || taskFilter !== 'all'
                                                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                                : 'Bắt đầu bằng cách tạo task đầu tiên'}
                                        </p>
                                        {!taskSearch && taskFilter === 'all' && authUser?.role !== 'employee' && (
                                            <button
                                                onClick={handleCreateTask}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                                            >
                                                <LucideIcons.Plus className="w-4 h-4" />
                                                Tạo Task đầu tiên
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredTasks.map((task) => (
                                            <div
                                                key={task._id || task.id}
                                                onClick={() => handleTaskClick(task._id || task.id)}
                                                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group dark:bg-slate-500"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-semibold mb-2 text-lg transition-colors ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                                            {task.name}
                                                        </h4>
                                                        {task.description && (
                                                            <p className={`text-sm line-clamp-2 leading-relaxed ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="ml-4 flex flex-col items-end gap-2">
                                                        {getStatusBadge(task.status)}
                                                        {task.priority && getPriorityBadge(task.priority)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                    <div className="flex items-center gap-4">
                                                        {task.dueDate && (
                                                            <div className={`flex items-center gap-2 text-sm ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                                                <LucideIcons.Calendar className="w-4 h-4" />
                                                                <span>Hạn: {formatDate(task.dueDate)}</span>
                                                            </div>
                                                        )}
                                                        {task.members && task.members.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <LucideIcons.Users className={`w-4 h-4 ${DARK_MODE_COLORS.TEXT_PRIMARY}`} />
                                                                <div className="flex -space-x-2">
                                                                    {task.members.slice(0, 3).map((member) => (
                                                                        <div
                                                                            key={member._id || member.id}
                                                                            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white shadow-sm"
                                                                            title={`${member.firstName || ''} ${member.lastName || ''}`}
                                                                        >
                                                                            {(member.firstName || 'U').charAt(0)}{(member.lastName || '').charAt(0)}
                                                                        </div>
                                                                    ))}
                                                                    {task.members.length > 3 && (
                                                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white shadow-sm">
                                                                            +{task.members.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ): null}
                    </div>
                </div>
            </div>

            {/* Modal Xóa thành viên & Bàn giao */}
            {showDeleteModal && deletingMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className={`max-w-md w-full rounded-2xl shadow-xl p-6 border ${DARK_MODE_COLORS.BG_CARD} ${DARK_MODE_COLORS.BORDER_PRIMARY}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <LucideIcons.UserMinus className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className={`text-xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                Xóa thành viên khỏi dự án
                            </h3>
                        </div>

                        {loadingTasksCount ? (
                            <div className="py-6 text-center">
                                <LucideIcons.Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                                <p className={`text-sm ${DARK_MODE_COLORS.TEXT_SECONDARY}`}>Đang kiểm tra các công việc chưa hoàn thành...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className={`text-sm ${DARK_MODE_COLORS.TEXT_SECONDARY}`}>
                                    Bạn có chắc chắn muốn xóa thành viên <strong className={DARK_MODE_COLORS.TEXT_PRIMARY}>{deletingMember.name}</strong> khỏi dự án này? Họ sẽ không còn quyền truy cập vào các công việc và thông tin thuộc dự án.
                                </p>

                                {unfinishedTasksCount > 0 ? (
                                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 p-4 rounded-r-lg space-y-2">
                                        <div className="flex gap-2">
                                            <LucideIcons.AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                                                Cần bàn giao công việc!
                                            </p>
                                        </div>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                            Thành viên này đang có <strong>{unfinishedTasksCount}</strong> công việc chưa hoàn thành. Bạn bắt buộc phải chọn một nhân viên khác để bàn giao các công việc này.
                                        </p>
                                        
                                        <div className="mt-3">
                                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${DARK_MODE_COLORS.TEXT_LABEL}`}>
                                                Người nhận bàn giao *
                                            </label>
                                            {eligibleEmployees.length === 0 ? (
                                                <p className="text-xs text-red-500">
                                                    Không có nhân viên (employee) nào khác trong hệ thống để nhận bàn giao. Hãy tạo hoặc kích hoạt một employee khác trước.
                                                </p>
                                            ) : (
                                                <select
                                                    value={handoverEmployeeId}
                                                    onChange={(e) => setHandoverEmployeeId(e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${DARK_MODE_COLORS.BG_INPUT} ${DARK_MODE_COLORS.BORDER_INPUT} ${DARK_MODE_COLORS.TEXT_PRIMARY}`}
                                                >
                                                    <option value="">-- Chọn nhân viên nhận bàn giao --</option>
                                                    {eligibleEmployees.map((emp) => (
                                                        <option key={emp._id || emp.id} value={emp._id || emp.id}>
                                                            {emp.firstName} {emp.lastName} ({emp.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 dark:bg-green-950/10 border-l-4 border-green-500 p-4 rounded-r-lg flex gap-2">
                                        <LucideIcons.CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        <p className="text-xs text-green-700 dark:text-green-400">
                                            Thành viên này không có công việc chưa hoàn thành nào trong dự án này. Bạn có thể xóa trực tiếp.
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-600">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeletingMember(null);
                                        }}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors ${DARK_MODE_COLORS.TEXT_SECONDARY}`}
                                        disabled={submittingDelete}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmDeleteMember}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={
                                            submittingDelete || 
                                            loadingTasksCount || 
                                            (unfinishedTasksCount > 0 && (!handoverEmployeeId || eligibleEmployees.length === 0))
                                        }
                                    >
                                        {submittingDelete ? (
                                            <>
                                                <LucideIcons.Loader2 className="w-4 h-4 animate-spin" />
                                                Đang xóa...
                                            </>
                                        ) : (
                                            'Xác nhận xóa'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;