// components/stats/RecentTask.jsx
import React from 'react';
import { FiClock, FiUser, FiFolder, FiCheckCircle, FiActivity, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useRecentTasks } from '../../hooks/useTasks';
import {DARK_MODE_COLORS, TASK_STATUS_LABELS} from "../../utils/constants";

const RecentTask = ({ mode }) => {
    const { recentTasks, loading, error } = useRecentTasks(5, mode);

    const statusIcons = {
        initial: <FiClock className="text-gray-400 dark:text-gray-500" />,
        doing: <FiActivity className="text-blue-500 dark:text-blue-400" />,
        finish: <FiCheckCircle className="text-green-500 dark:text-green-400" />,
        pending: <FiClock className="text-yellow-500 dark:text-yellow-400" />,
        notFinish: <FiAlertCircle className="text-red-500 dark:text-red-400" />
    };

    const priorityConfig = {
        high: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-400', label: 'Cao' },
        medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-400', label: 'Trung bình' },
        low: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-400', label: 'Thấp' }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Ngày mai';
        if (diffDays === -1) return 'Hôm qua';
        if (diffDays < 0) return `${Math.abs(diffDays)} ngày trước`;
        return `Còn ${diffDays} ngày`;
    };

    const getStatusConfig = (status) => {
        const configs = {
            done: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-400' },
            in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-400' },
            pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-400' },
            todo: { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-800 dark:text-slate-300' },
            cancelled: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-400' }
        };
        return configs[status] || { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-800 dark:text-slate-300' };
    };

    if (loading) {
        return (
            <div className={`bg-white p-6 rounded-xl shadow-sm border ${DARK_MODE_COLORS.BG_CARD}`}>
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="min-w-[320px] h-48 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white p-6 rounded-xl shadow-sm border ${DARK_MODE_COLORS.BG_CARD}`}>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <FiAlertCircle />
                        <p>Lỗi: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-xl shadow-sm border ${DARK_MODE_COLORS.BG_PRIMARY}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Công việc gần đây</h3>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-full">
                        {recentTasks.length} task
                    </span>
                    <Link
                        to="/tasks"
                        className={`text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}
                    >
                        Xem tất cả
                        <FiChevronRight size={16} />
                    </Link>
                </div>
            </div>

            {recentTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <FiFolder className="mx-auto text-5xl mb-3 text-gray-300 dark:text-slate-600" />
                    <p>Chưa có công việc nào</p>
                </div>
            ) : (
                /* ✅ HORIZONTAL SCROLL CONTAINER */
                <div className="overflow-x-auto pb-4 -mx-2 px-2">
                    <div className="flex gap-4 min-w-min">
                        {recentTasks.map((task) => {
                            const priority = task.priority?.toLowerCase() || 'low';
                            const status = task.status?.toLowerCase() || 'todo';
                            const priorityStyle = priorityConfig[priority] || priorityConfig.low;
                            const statusStyle = getStatusConfig(status);

                            const memberNames = task.members && task.members.length > 0
                                ? task.members.map(m => `${m.firstName || ''} ${m.lastName || ''}`.trim()).join(', ')
                                : 'Chưa gán';

                            return (
                                /* ✅ TASK CARD - Fixed width for horizontal layout */
                                <div
                                    key={task._id || task.id}
                                    className={`${DARK_MODE_COLORS.BG_CARD} flex-shrink-0 w-80 p-5 border border-gray-200 dark:border-slate-600 rounded-xl hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all`}
                                >
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-4 ">
                                        <div className={`p-2.5 rounded-lg ${statusStyle.bg} flex-shrink-0`}>
                                            {statusIcons[status] || statusIcons.initial}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-semibold line-clamp-2 mb-2 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                                {task.name || 'Chưa có tên'}
                                            </h4>
                                            <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                                {TASK_STATUS_LABELS[status] || status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Project & Members */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FiFolder size={14} className={`flex-shrink-0 ${DARK_MODE_COLORS.TEXT_PRIMARY}`} />
                                            <span className={`truncate ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                                {task.project?.name || 'Chưa có dự án'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FiUser size={14} className={`flex-shrink-0 ${DARK_MODE_COLORS.TEXT_PRIMARY}`} />
                                            <span className={`truncate ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                                {memberNames}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-600">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${priorityStyle.bg} ${priorityStyle.text} inline-block w-fit`}>
                                                {priorityStyle.label}
                                            </span>
                                            {task.dueDate && (
                                                <span className={`text-xs ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                                    📅 {formatDate(task.dueDate)}
                                                </span>
                                            )}
                                        </div>

                                        <Link
                                            to={`/tasks/${task._id || task.id}`}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-600 transition"
                                        >
                                            <FiChevronRight size={20} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentTask;