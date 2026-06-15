// src/components/tasks/TaskList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TASK_STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, DARK_MODE_COLORS } from '../../utils/constants';
import { TASK_ROUTES } from '../../routes/taskRoutes';
import Button from '../common/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const TaskList = ({ tasks, loading, pagination, onPageChange }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    if (loading) {
        return <div className={`p-4 text-center ${DARK_MODE_COLORS.TEXT_LABEL} animate-fade-in`}>Đang tải...</div>;
    }

    const isNearDeadline = (deadline) => {
        if (!deadline) return false;
        const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        return days <= 3 && days >= 0;
    };

    return (
        <div className="animate-fade-in">
            <div className="overflow-x-auto">
                <table className={`min-w-full ${DARK_MODE_COLORS.BG_PRIMARY} border ${DARK_MODE_COLORS.BORDER_PRIMARY} rounded-lg overflow-hidden`}>
                    <thead className={DARK_MODE_COLORS.TABLE_HEADER}>
                    <tr>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-[15%]`}>Tên việc</th>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-[15%]`}>Dự án</th>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-[10%]`}>Vai trò</th>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-[20%]`}>Mô tả</th>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-auto`}>Trạng thái</th>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-auto`}>Ưu tiên</th>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-auto`}>Ngày bắt đầu</th>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-auto`}>Hạn cuối</th>
                        <th className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_TABLE_HEADER} border ${DARK_MODE_COLORS.BORDER_PRIMARY} text-left w-[12%]`}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {(!tasks || tasks.length === 0) ? (
                        <tr>
                            <td colSpan="9" className={`px-4 py-8 text-center ${DARK_MODE_COLORS.TEXT_SECONDARY} animate-fade-in`}>
                                Không có task phù hợp với bộ lọc
                            </td>
                        </tr>
                    ) : (
                        tasks.map((task) => {
                            const canEdit = user?.role === 'admin' || (user?.roles && user.roles.includes('admin')) || task.userRole === 'manager' || task.userRole === 'both';
                            const isAssigned = task.members?.some(m => m && (m._id === user?._id || m.id === user?._id));
                            return (
                                <tr key={task._id || task.id} className={`${DARK_MODE_COLORS.TABLE_ROW} transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 animate-slide-up`}>
                                    <td className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_PRIMARY} border ${DARK_MODE_COLORS.TABLE_BORDER}`}>{task.name}</td>
                                    <td className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_PRIMARY} border ${DARK_MODE_COLORS.TABLE_BORDER}`}>
                                        {task.project?.name || '-'}
                                    </td>
                                    <td className={`px-4 py-2 border ${DARK_MODE_COLORS.TABLE_BORDER}`}>
                                        {task.userRole === 'both' && (
                                            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full whitespace-nowrap">
                                                Quản lý + Được giao
                                            </span>
                                        )}
                                        {task.userRole === 'manager' && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
                                                Quản lý
                                            </span>
                                        )}
                                        {task.userRole === 'employee' && (
                                            isAssigned ? (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                                                    Được giao
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-medium rounded-full whitespace-nowrap">
                                                    Tham gia
                                                </span>
                                            )
                                        )}
                                    </td>
                                    <td className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_LABEL} border ${DARK_MODE_COLORS.TABLE_BORDER}`}>{task.description}</td>
                                    <td className={`px-4 py-2 border ${DARK_MODE_COLORS.TABLE_BORDER} text-sm ${STATUS_COLORS[task.status] || DARK_MODE_COLORS.BADGE_GRAY}`}>
                                        {TASK_STATUS_LABELS[task.status] || task.status}
                                    </td>
                                    <td className={`px-4 py-2 border ${DARK_MODE_COLORS.TABLE_BORDER} text-sm ${PRIORITY_COLORS[task.priority] || DARK_MODE_COLORS.BADGE_GRAY}`}>
                                        {PRIORITY_LABELS[task.priority] || task.priority}
                                    </td>
                                    <td className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_PRIMARY} border ${DARK_MODE_COLORS.TABLE_BORDER}`}>
                                        {task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : '-'}
                                    </td>
                                    <td className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_PRIMARY} border ${DARK_MODE_COLORS.TABLE_BORDER} ${isNearDeadline(task.dueDate) ? DARK_MODE_COLORS.NEAR_DEADLINE + ' font-bold' : ''}`}>
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '-'}
                                    </td>
                                    <td className={`px-4 py-2 border ${DARK_MODE_COLORS.TABLE_BORDER}`}>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => navigate(TASK_ROUTES.DETAIL(task._id || task.id))}
                                                className="transition-transform hover:scale-105"
                                            >
                                                Xem
                                            </Button>
                                            {canEdit && (
                                                <Button
                                                    onClick={() => navigate(TASK_ROUTES.EDIT(task._id || task.id))}
                                                    className="hover:bg-yellow-600 bg-yellow-500 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700 transition-transform hover:scale-105"
                                                >
                                                    Sửa
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && tasks.length > 0 && (
                <div className="mt-4 flex justify-center gap-2 animate-fade-in">
                    <button
                        onClick={() => onPageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className={`px-4 py-2 border ${DARK_MODE_COLORS.BORDER_INPUT} rounded disabled:opacity-50 ${DARK_MODE_COLORS.BG_HOVER} ${DARK_MODE_COLORS.BG_PRIMARY} ${DARK_MODE_COLORS.TEXT_PRIMARY} transition-all duration-200 hover:scale-110 disabled:hover:scale-100`}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className={`px-4 py-2 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
            {pagination.currentPage} / {pagination.totalPage}
          </span>
                    <button
                        onClick={() => onPageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= pagination.totalPage}
                        className={`px-4 py-2 border ${DARK_MODE_COLORS.BORDER_INPUT} rounded disabled:opacity-50 ${DARK_MODE_COLORS.BG_HOVER} ${DARK_MODE_COLORS.BG_PRIMARY} ${DARK_MODE_COLORS.TEXT_PRIMARY} transition-all duration-200 hover:scale-110 disabled:hover:scale-100`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskList;