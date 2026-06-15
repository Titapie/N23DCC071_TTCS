// components/dashboard/TaskStatusChart.jsx
// Hiển thị phân bố trạng thái task theo 5 status thật của backend:
// todo, in_progress, pending, done, cancelled
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FiCircle, FiActivity, FiPauseCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useTaskStatusStats } from '../../hooks/useStats';
import { TASK_STATUS_LABELS, STATUS_CHART_COLORS, DARK_MODE_COLORS } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';

// 5 status thật từ backend task.model.js
const STATUS_CONFIG = [
    { key: 'todo',        label: TASK_STATUS_LABELS['todo'],        icon: FiCircle,       color: STATUS_CHART_COLORS.todo },
    { key: 'in_progress', label: TASK_STATUS_LABELS['in_progress'], icon: FiActivity,     color: STATUS_CHART_COLORS.in_progress },
    { key: 'pending',     label: TASK_STATUS_LABELS['pending'],     icon: FiPauseCircle,  color: STATUS_CHART_COLORS.pending },
    { key: 'done',        label: TASK_STATUS_LABELS['done'],        icon: FiCheckCircle,  color: STATUS_CHART_COLORS.done },
    { key: 'cancelled',   label: TASK_STATUS_LABELS['cancelled'],   icon: FiXCircle,      color: STATUS_CHART_COLORS.cancelled },
];

const TaskStatusChart = ({ mode }) => {
    const { data, loading, error } = useTaskStatusStats(mode);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (loading) {
        return (
            <div className={`p-6 rounded-xl shadow-sm border dark:border-slate-600 ${DARK_MODE_COLORS.BG_CARD} animate-pulse`}>
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-32 mb-8"></div>
                <div className="flex justify-center items-center h-48">
                    <div className="h-40 w-40 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-6 rounded-xl shadow-sm border dark:border-slate-600 ${DARK_MODE_COLORS.BG_CARD}`}>
                <p className="text-red-600 dark:text-red-400">Lỗi: {error}</p>
            </div>
        );
    }

    // data từ backend: { todo, in_progress, done, pending, cancelled, total }
    const chartData = STATUS_CONFIG.map(s => ({
        name: s.label,
        value: data?.[s.key] || 0,
        color: s.color,
        key: s.key,
        icon: s.icon,
    })).filter(item => item.value > 0);

    const totalTasks = data?.total || chartData.reduce((sum, item) => sum + item.value, 0);
    // Task đang trong tiến trình (không kể done và cancelled)
    const inProgress = (data?.todo || 0) + (data?.in_progress || 0) + (data?.pending || 0);

    return (
        <div className={`p-3 rounded-xl shadow-sm border dark:border-slate-600 ${DARK_MODE_COLORS.BG_CARD}`}>
            <h3 className={`text-lg font-semibold mb-2 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                Phân bố trạng thái công việc
            </h3>
            <p className="text-gray-400 dark:text-slate-400 text-sm mb-4">
                Tất cả 5 trạng thái: Chưa bắt đầu, Đang làm, Đang chờ, Hoàn thành, Đã hủy
            </p>

            {totalTasks === 0 ? (
                <div className="flex justify-center items-center h-48 text-gray-400 dark:text-gray-500">
                    <p>Chưa có dữ liệu task</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Tổng đang thực hiện */}
                    <div className="text-center">
                        <p className={`text-sm ${DARK_MODE_COLORS.TEXT_SECONDARY}`}>Task đang thực hiện:</p>
                        <p className={`text-3xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{inProgress}</p>
                    </div>

                    {/* Pie Chart */}
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1E293B' : 'white',
                                        border: isDark ? '1px solid #475569' : '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        color: isDark ? '#F8FAFC' : '#1E293B'
                                    }}
                                    itemStyle={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
                                    labelStyle={{ color: isDark ? '#94A3B8' : '#6B7280' }}
                                    formatter={(value, name) => [`${value} task`, name]}
                                />
                                <Legend wrapperStyle={{ color: isDark ? '#F8FAFC' : '#1E293B' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Danh sách chi tiết 5 status */}
                    <div className="space-y-2">
                        {STATUS_CONFIG.map(({ key, label, icon: Icon, color }) => {
                            const count = data?.[key] || 0;
                            const percent = totalTasks > 0 ? ((count / totalTasks) * 100).toFixed(1) : 0;
                            return (
                                <div key={key} className={`flex items-center justify-between p-2 rounded-lg ${DARK_MODE_COLORS.BG_PRIMARY}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                        <Icon style={{ color }} />
                                        <span className={`text-sm font-medium ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{label}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{count}</span>
                                        <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">({percent}%)</span>
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

export default TaskStatusChart;