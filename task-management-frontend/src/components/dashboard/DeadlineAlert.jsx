// components/stats/DeadlineAlert.jsx
import React from 'react';
import { FiAlertCircle, FiClock, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useDeadlineTasks } from '../../hooks/useTasks';
import {DARK_MODE_COLORS} from "../../utils/constants.js";

const DeadlineAlert = ({ mode }) => {
    const { upcomingTasks, overdueTasks, loading, error } = useDeadlineTasks(mode);

    const priorityColors = {
        high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
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
        if (diffDays < 0) return `Quá ${Math.abs(diffDays)} ngày`;
        return `Còn ${diffDays} ngày`;
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            high: 'Cao',
            medium: 'Trung bình',
            low: 'Thấp'
        };
        return labels[priority] || priority;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className={`bg-white p-6 rounded-xl shadow-sm border ${DARK_MODE_COLORS.BG_CARD}`}>
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
                        <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-6">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <FiAlertCircle />
                    <p>Lỗi: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 ">
            <Link
                to="/tasks"
                className="block p-4 bg-indigo-600 text-white rounded-xl text-base shadow-sm hover:bg-blue-500 hover:text-white transition text-center"
            >
                <div className="flex items-center justify-center gap-2">
                    <span className="font-medium">Xem tất cả công việc</span>
                </div>
            </Link>
            {/* Task sắp đến hạn */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border ${DARK_MODE_COLORS.BG_CARD}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FiCalendar className="text-blue-500" />
                        <h3 className={`text-lg font-semibold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Sắp đến hạn (3 ngày)</h3>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full">
                        {upcomingTasks.length} task
                    </span>
                </div>

                {upcomingTasks.length === 0 ? (
                    <p className={` text-center py-4 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Không có task sắp đến hạn</p>
                ) : (
                    <div className="space-y-3  rounded-lg">
                        {upcomingTasks.map((task) => (
                            <div key={task._id || task.id} className="flex items-center bg-yellow-50 dark:bg-yellow-950/10 justify-between p-3 rounded-lg border border-transparent dark:border-yellow-900/20">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${priorityColors[task.priority?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                                        <FiClock />
                                    </div>
                                    <div>
                                        <p className={`font-medium text-gray-800 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{task.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block">
                                            {formatDate(task.dueDate)}
                                        </span>
                                        <span className={`text-xs ${priorityColors[task.priority?.toLowerCase()] || 'text-gray-600'}`}>
                                            {getPriorityLabel(task.priority?.toLowerCase())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Task quá hạn */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border border-red-100 ${DARK_MODE_COLORS.BG_CARD}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FiAlertCircle className="text-red-500" />
                        <h3 className={`text-lg font-semibold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Quá hạn</h3>
                    </div>
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-full">
                        {overdueTasks.length} task
                    </span>
                </div>

                {overdueTasks.length === 0 ? (
                    <p className="text-green-600 text-center py-4">🎉 Không có task quá hạn!</p>
                ) : (
                    <div className="space-y-3">
                        {overdueTasks.map((task) => (
                            <div key={task._id || task.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/10 rounded-lg border border-transparent dark:border-red-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                        <FiAlertCircle />
                                    </div>
                                    <div>
                                        <p className={`font-medium text-gray-800 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{task.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-red-600 dark:text-red-400 block">
                                            {formatDate(task.dueDate)}
                                        </span>
                                        <span className="text-xs text-red-500 dark:text-red-400">
                                            {getPriorityLabel(task.priority?.toLowerCase())}
                                        </span>
                                    </div>
                                    <Link
                                        to={`/tasks/${task._id || task.id}`}
                                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
                                    >
                                        Xử lý
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default DeadlineAlert;