import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Bar,
    AreaChart,
    Legend,
    Area,
} from 'recharts';
import statsService from '../../services/statsService';
import userService from '../../services/userService';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import {CHART_COLORS} from "../../utils/constants.js";
import { useTheme } from '../../context/ThemeContext';
const AdminStats = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [overview, setOverview] = useState(null);
    const [userPerformance, setUserPerformance] = useState([]);
    const [taskStatus, setTaskStatus] = useState(null);
    const [projectSummary, setProjectSummary] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    // Fetch all stats
    const fetchAllStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Overview (role-aware: admin/manager/employee)
            const overviewData = await statsService.getOverview();
            setOverview(overviewData);

            // Task status stats: { todo, in_progress, done, pending, cancelled, total }
            const taskStatusData = await statsService.getTaskStatusStats();
            setTaskStatus(taskStatusData);

            // Project summary - dùng /statistics/projects (có totalTasks, doneTasks, endDate)
            const projectSummaryData = await statsService.getProjectSummary();
            setProjectSummary(projectSummaryData);
            // allProjects dùng raw projects từ summary (đã có totalTasks/doneTasks/completionRate/endDate)
            setAllProjects(projectSummaryData.projects || []);

            // User performance (chỉ admin mới gọi)
            try {
                const performanceData = await statsService.getUserPerformance();
                setUserPerformance(performanceData || []);
            } catch (err) {
                console.warn('Cannot fetch user performance:', err);
                setUserPerformance([]);
            }

            // All users
            try {
                const usersResponse = await userService.getAllUsers();
                if (usersResponse.success) setAllUsers(usersResponse.data || []);
            } catch (err) {
                console.warn('Cannot fetch users:', err);
                setAllUsers([]);
            }

            // All tasks (dùng để tính task stats)
            try {
                const tasksResponse = await taskService.getTasks({ limit: 1000 });
                if (tasksResponse.success) setAllTasks(tasksResponse.tasks || tasksResponse.data || []);
            } catch (err) {
                console.warn('Cannot fetch tasks:', err);
                setAllTasks([]);
            }

        } catch (err) {
            setError(err.message || 'Không thể tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllStats();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllStats();
        setRefreshing(false);
    };

    // Tính user stats - backend role: admin, manager, employee
    const userStats = {
        total: allUsers.length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        managers: allUsers.filter(u => u.role === 'manager').length,
        regularUsers: allUsers.filter(u => u.role === 'employee').length
    };

    // Tính project stats từ GET /api/statistics/projects
    // Backend trả: { totalTasks, doneTasks, completionRate, endDate }
    const projectStats = {
        total: allProjects.length,
        active: allProjects.filter(p => p.totalTasks > 0 && p.doneTasks < p.totalTasks).length,
        completed: allProjects.filter(p => p.completionRate === 100).length,
        onHold: allProjects.filter(p =>
            p.totalTasks === 0 && (p.completionRate || 0) < 100
        ).length,
        overdue: allProjects.filter(p => {
            const endDate = p.endDate ? new Date(p.endDate) : null;
            const today = new Date();
            return endDate && endDate < today && p.completionRate < 100;
        }).length,
    };

    // Tính task stats từ allTasks - dùng status backend thật
    // Backend enum: todo, in_progress, done, pending, cancelled
    const calculateTaskStats = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = { todo: 0, in_progress: 0, done: 0, pending: 0, cancelled: 0, overdue: 0 };

        allTasks.forEach(task => {
            const status = task.status?.toLowerCase().trim();
            let isOverdue = false;
            if (task.dueDate && status !== 'done') {
                const endDate = new Date(task.dueDate);
                endDate.setHours(0, 0, 0, 0);
                isOverdue = endDate < today;
            }

            if (isOverdue) {
                stats.overdue++;
            } else if (stats.hasOwnProperty(status)) {
                stats[status]++;
            }
        });

        return stats;
    };

    const taskStats = allTasks.length > 0 ? calculateTaskStats() : {
        todo: taskStatus?.todo || 0,
        in_progress: taskStatus?.in_progress || 0,
        done: taskStatus?.done || 0,
        pending: taskStatus?.pending || 0,
        cancelled: taskStatus?.cancelled || 0,
        overdue: 0,
    };

    // Chuẩn bị dữ liệu chart - dùng key backend thật
    const getTaskStatusChartData = () => {
        return [
            { name: 'Hoàn thành', value: taskStats.done || 0,        color: CHART_COLORS.SUCCESS },
            { name: 'Đang làm',   value: taskStats.in_progress || 0, color: CHART_COLORS.PRIMARY },
            { name: 'Đang chờ',   value: taskStats.pending || 0,    color: CHART_COLORS.WARNING },
            { name: 'Chưa bắt đầu', value: taskStats.todo || 0,       color: CHART_COLORS.GRAY },
            { name: 'Đã hủy',     value: taskStats.cancelled || 0, color: '#6B7280' },
            { name: 'Quá hạn',    value: taskStats.overdue || 0,    color: CHART_COLORS.DANGER },
        ].filter(d => d.value > 0);
    };

    const getProjectChartData = () => {
        if (!projectSummary) return [];
        return [
            { name: 'Active', value: projectStats.active || 0, color: CHART_COLORS.PRIMARY },
            { name: 'Completed', value: projectStats.completed || 0, color: CHART_COLORS.SUCCESS },
            { name: 'On Hold', value: projectStats.onHold || 0, color: CHART_COLORS.WARNING },
            { name: 'Overdue', value: projectStats.overdue || 0, color: CHART_COLORS.DANGER }
        ];
    };

    const getTopPerformersData = () => {
        return userPerformance.slice(0, 5).map(user => ({
            name: user.userName?.split(' ').slice(-1)[0] || 'User',
            completed: user.completedTasks || 0,
            inProgress: user.inProgressTasks || 0,
            total: user.totalTasks || 0
        }));
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600">
                    <p className="font-semibold text-gray-800 dark:text-white">{payload[0].name}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                        Số lượng: <span className="font-bold text-gray-900 dark:text-white">{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <LucideIcons.Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-slate-400">Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-8 max-w-md w-full text-center">
                    <LucideIcons.AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with Refresh Button */}
            <div className="flex items-center justify-end">
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg disabled:opacity-50"
                >
                    <LucideIcons.RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users */}
                <div 
                    onClick={() => navigate('/admin/users')}
                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 transform"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <LucideIcons.Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Tổng Users</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.total}</p>
                </div>

                {/* Total Projects */}
                <div 
                    onClick={() => navigate('/admin/projects')}
                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 transform"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <LucideIcons.Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Tổng Projects</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{projectStats.total}</p>
                </div>

                {/* Total Tasks */}
                <div 
                    onClick={() => navigate('/admin/tasks')}
                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 transform"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <LucideIcons.ListTodo className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Tổng Tasks</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{overview?.total || 0}</p>
                </div>

                {/* Completion Rate */}
                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-6 border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <LucideIcons.Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Tỷ lệ hoàn thành</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {overview?.completion_rate ? `${overview.completion_rate}%` : '0%'}
                    </p>
                </div>
            </div>

            {/* Task Status Distribution */}
            {taskStatus && (
                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                        Phân bố trạng thái Tasks
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* PieChart */}
                        <div>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        data={getTaskStatusChartData()}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={90}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {getTaskStatusChartData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>

                    {/* Task Status Cards - dùng key backend thật */}
                    <div className="flex flex-col justify-center space-y-3">
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                            <div className="flex items-center">
                                <LucideIcons.CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Hoàn thành</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.done || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                            <div className="flex items-center">
                                <LucideIcons.Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Đang thực hiện</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.in_progress || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                            <div className="flex items-center">
                                <LucideIcons.AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Đang chờ</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.pending || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                            <div className="flex items-center">
                                <LucideIcons.FileText className="w-8 h-8 text-gray-600 dark:text-slate-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Chưa bắt đầu</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.todo || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                            <div className="flex items-center">
                                <LucideIcons.CalendarX2 className="w-8 h-8 text-red-600 dark:text-red-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-slate-400">Quá hạn</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.overdue || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            )}

            {/* Project Overview */}
            {allProjects.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                        Tổng quan Projects
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getProjectChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#f0f0f0'} />
                            <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#666'} />
                            <YAxis stroke={isDark ? '#94a3b8' : '#666'} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                {getProjectChartData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Active Projects</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{projectStats.active}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Đang có tasks thực hiện</p>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Completed</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{projectStats.completed}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Tất cả tasks hoàn thành</p>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">On Hold</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{projectStats.onHold}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Chưa hoàn thành, không có task đang làm</p>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/30">
                            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Overdue</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{projectStats.overdue}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Đã quá thời hạn</p>
                        </div>
                    </div>
                </div>
            )}

            {/* User Performance */}
            {userPerformance && userPerformance.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
                            Top 5 Performers - Tasks Performance
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={getTopPerformersData()}>
                                <defs>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.SUCCESS} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={CHART_COLORS.SUCCESS} stopOpacity={0.1}/>
                                    </linearGradient>
                                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.PRIMARY} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={CHART_COLORS.PRIMARY} stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#f0f0f0'} />
                                <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#666'} />
                                <YAxis stroke={isDark ? '#94a3b8' : '#666'} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="completed"
                                    stroke={CHART_COLORS.SUCCESS}
                                    fillOpacity={1}
                                    fill="url(#colorCompleted)"
                                    name="Hoàn thành"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="inProgress"
                                    stroke={CHART_COLORS.PRIMARY}
                                    fillOpacity={1}
                                    fill="url(#colorProgress)"
                                    name="Đang làm"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Top performers theo số lượng tasks hoàn thành
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Task</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tasks hoàn thành</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Tỷ lệ hoàn thành</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {userPerformance.slice(0, 10).map((user, index) => {
                                const completionRate = user.totalTasks > 0
                                    ? Math.round((user.completedTasks / user.totalTasks) * 100)
                                    : 0;

                                return (
                                    <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-slate-750/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {index === 0 && <LucideIcons.Award className="w-5 h-5 text-yellow-500 mr-2" />}
                                                {index === 1 && <LucideIcons.Award className="w-5 h-5 text-gray-400 mr-2" />}
                                                {index === 2 && <LucideIcons.Award className="w-5 h-5 text-orange-500 mr-2" />}
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">#{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium mr-3">
                                                    {user.userName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.userName || 'Unknown'}</div>
                                                    <div className="text-sm text-gray-500 dark:text-slate-400">{user.userEmail || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <LucideIcons.ClipboardList className="w-4 h-4 text-blue-500 mr-2" />
                                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{user.totalTasks || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <LucideIcons.CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                <span className="text-sm font-bold text-green-600 dark:text-green-400">{user.completedTasks || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-full max-w-xs">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-slate-350">{completionRate}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                completionRate >= 80 ? 'bg-green-500' :
                                                                    completionRate >= 50 ? 'bg-blue-500' :
                                                                        completionRate >= 30 ? 'bg-yellow-500' :
                                                                            'bg-red-500'
                                                            }`}
                                                            style={{ width: `${completionRate}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStats;