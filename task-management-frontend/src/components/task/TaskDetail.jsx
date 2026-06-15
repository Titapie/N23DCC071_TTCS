// src/components/task/TaskDetail.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Clock, Users, CheckCircle2, X, Trash2, Loader2, UserPlus } from 'lucide-react';
import { TASK_STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, DARK_MODE_COLORS } from '../../utils/constants';
import assignmentService from '../../services/assignmentService';
import { ToastContext } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import { hasManagerRole, isAdmin } from '../../utils/roleUtils';

const TaskDetail = ({ task, onEdit, onDelete }) => {
    if (!task) return null;

    const { showToast } = useContext(ToastContext);
    const { user: authUser } = useContext(AuthContext);

    // assignments: [{_id, task, assignee:{_id,firstName,lastName,email}, assignedBy, assignedAt}]
    const [assignments, setAssignments] = useState([]);
    const [loadingAssignees, setLoadingAssignees] = useState(true);


    const taskId = task._id || task.id;
    // Hỗ trợ multi-role: dùng roleUtils để kiểm tra quyền (roles array + role string)
    const isManager = hasManagerRole(authUser) || isAdmin(authUser);

    // Fetch assignments từ API thật: GET /api/tasks/:taskId/assignments
    const fetchAssignments = useCallback(async () => {
        try {
            setLoadingAssignees(true);
            const res = await assignmentService.getTaskAssignments(taskId);
            setAssignments(res.data || []);
        } catch {
            setAssignments([]);
        } finally {
            setLoadingAssignees(false);
        }
    }, [taskId]);

    useEffect(() => {
        if (taskId) fetchAssignments();
    }, [taskId, fetchAssignments]);

    const calculateDuration = () => {
        if (task.startDate && task.dueDate) {
            const days = Math.ceil((new Date(task.dueDate) - new Date(task.startDate)) / (1000 * 60 * 60 * 24));
            return `${days} ngày`;
        }
        return 'Chưa xác định';
    };



    const assessmentItems = [
        "Hiểu rõ yêu cầu của task",
        "Nắm vững các công cụ cần thiết",
        "Thực hiện đúng quy trình",
        "Hoàn thành đúng tiến độ"
    ];

    const duration = calculateDuration();

    return (
        <div className={`min-h-screen ${DARK_MODE_COLORS.BG_SECONDARY} animate-fade-in`}>


            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-2xl overflow-hidden shadow-sm animate-scale-in`}>
                            <div className={`aspect-video ${DARK_MODE_COLORS.BG_GRADIENT} flex items-center justify-center`}>
                                <div className="text-white text-9xl font-bold opacity-30">
                                    {task.name ? task.name.charAt(0).toUpperCase() : 'T'}
                                </div>
                            </div>
                        </div>

                        <div className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-2xl shadow-sm p-6`}>
                            <h1 className={`text-3xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-3`}>{task.name}</h1>
                            
                            <div className={`flex items-center gap-4 text-sm ${DARK_MODE_COLORS.TEXT_SECONDARY} mb-4`}>
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-all hover:scale-105">
                                    {task.project?.name || 'Không thuộc dự án nào'}
                                </span>
                            </div>

                            <div className={`flex items-center gap-6 text-sm ${DARK_MODE_COLORS.TEXT_SECONDARY} mb-6 pb-6 border-b ${DARK_MODE_COLORS.BORDER_SECONDARY}`}>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{assignments.length} Thành viên tham gia</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{duration}</span>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className={`text-xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-3`}>Mô tả công việc</h2>
                                <p className={`${DARK_MODE_COLORS.TEXT_SECONDARY} leading-relaxed`}>
                                    {task.description || 'Không có mô tả'}
                                </p>
                            </div>

                            <div>
                                <h2 className={`text-xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-4`}>Tiêu chí đánh giá</h2>
                                <div className="space-y-3">
                                    {assessmentItems.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                            </div>
                                            <span className={DARK_MODE_COLORS.TEXT_LABEL}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isManager && (
                                <div className="flex gap-3 mt-8 pt-6">
                                    <button
                                        onClick={onEdit}
                                        className={`px-6 py-2.5 ${DARK_MODE_COLORS.BTN_PRIMARY} text-white rounded-lg font-medium transition-transform hover:scale-105 active:scale-95`}
                                    >
                                        Giao việc/Sửa
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        className={`px-6 py-2.5 ${DARK_MODE_COLORS.BTN_DANGER} text-white rounded-lg font-medium transition-transform hover:scale-105 active:scale-95`}
                                    >
                                        Xóa
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-2xl shadow-sm p-6 sticky top-6`}>
                            <h3 className={`text-lg font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-4`}>Thông tin chi tiết</h3>
                            
                            <div className="space-y-4 text-sm">
                                <div>
                                    <span className={`${DARK_MODE_COLORS.TEXT_SECONDARY} block mb-1`}>Trạng thái</span>
                                    <span className={`inline-block px-3 py-1 rounded-lg font-medium ${STATUS_COLORS[task.status]} transition-all hover:scale-105`}>
                                        {TASK_STATUS_LABELS[task.status]}
                                    </span>
                                </div>

                                <div>
                                    <span className={`${DARK_MODE_COLORS.TEXT_SECONDARY} block mb-1`}>Ưu tiên</span>
                                    <span className={`inline-block px-3 py-1 rounded-lg font-medium ${PRIORITY_COLORS[task.priority]} transition-all hover:scale-105`}>
                                        {PRIORITY_LABELS[task.priority]}
                                    </span>
                                </div>

                                {task.project?.name && (
                                    <div>
                                        <span className={`${DARK_MODE_COLORS.TEXT_SECONDARY} block mb-1`}>Dự án</span>
                                        <span className={`${DARK_MODE_COLORS.TEXT_PRIMARY} font-medium`}>{task.project.name}</span>
                                    </div>
                                )}

                                {task.createdBy && (
                                    <div>
                                        <span className={`${DARK_MODE_COLORS.TEXT_SECONDARY} block mb-1`}>Người tạo</span>
                                        <span className={`${DARK_MODE_COLORS.TEXT_PRIMARY} font-medium`}>
                                            {task.createdBy.firstName} {task.createdBy.lastName}
                                        </span>
                                    </div>
                                )}

                                {(task.startDate || task.dueDate) && (
                                    <div>
                                        <span className={`${DARK_MODE_COLORS.TEXT_SECONDARY} block mb-1`}>Thời gian</span>
                                        <div className={`flex items-center gap-2 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                            {task.startDate && (
                                                <span>{new Date(task.startDate).toLocaleDateString('vi-VN')}</span>
                                            )}
                                            {task.startDate && task.dueDate && (
                                                <span className={DARK_MODE_COLORS.TEXT_TERTIARY}>-</span>
                                            )}
                                            {task.dueDate && (
                                                <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
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
                                        <div className="space-y-2">
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

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className={`text-xs ${DARK_MODE_COLORS.TEXT_TERTIARY} py-2`}>Chưa có thành viên được giao</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;
