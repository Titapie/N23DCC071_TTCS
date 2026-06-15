import React, { useState, useEffect } from 'react';
import { 
    ListTodo, Search, RefreshCw, Loader2, AlertCircle, 
    Calendar, User, ArrowUpCircle
} from 'lucide-react';
import taskService from '../../services/taskService';
import userService from '../../services/userService';
import { useTheme } from '../../context/ThemeContext';
import { DARK_MODE_COLORS, TASK_STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const STATUS_COLORS = {
    todo: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    pending: 'bg-yellow-100 text-yellow-750 dark:bg-yellow-900/30 dark:text-yellow-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const PRIORITY_COLORS = {
    low: 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400',
    medium: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400',
    high: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400',
};

export default function AdminTasksPage() {
    const { user } = useAuth();
    const { theme } = useTheme();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [managerFilter, setManagerFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const [managers, setManagers] = useState([]);
    const [assignees, setAssignees] = useState([]);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);
    const limit = 15;

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page,
                limit,
                status: statusFilter === 'all' ? undefined : statusFilter,
                manager: managerFilter === 'all' ? undefined : managerFilter,
                assignee: assigneeFilter === 'all' ? undefined : assigneeFilter
            };
            
            const response = await taskService.getTasks(params);
            if (response.success) {
                setTasks(response.tasks || response.data || []);
                setTotalTasks(response.pagination?.total || (response.data || []).length);
                setTotalPages(Math.ceil((response.pagination?.total || (response.data || []).length) / limit) || 1);
            }
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách công việc');
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const [mRes, aRes] = await Promise.all([
                    userService.getAllUsers({ role: 'manager', limit: 200 }),
                    userService.getAllUsers({ role: 'employee', limit: 200 })
                ]);
                if (mRes.success) {
                    setManagers(mRes.users || mRes.data || []);
                }
                if (aRes.success) {
                    setAssignees(aRes.users || aRes.data || []);
                }
            } catch (err) {
                console.error('Lỗi khi tải dữ liệu bộ lọc:', err);
            }
        };
        if (user?.role === 'admin') {
            fetchFiltersData();
        }
    }, [user]);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchTasks();
        }
    }, [user, page, statusFilter, managerFilter, assigneeFilter]);

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 text-red-500 font-semibold">
                Bạn không có quyền truy cập trang này.
            </div>
        );
    }

    const handleRefresh = () => {
        fetchTasks();
    };

    const getFilteredTasks = () => {
        if (!searchTerm.trim()) return tasks;
        const q = searchTerm.toLowerCase();
        return tasks.filter(t => 
            t.name?.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.project?.name?.toLowerCase().includes(q)
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const filteredTasks = getFilteredTasks();

    return (
        <div className="h-full bg-gray-50 dark:bg-slate-900 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">Quản lý Tasks</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1">
                                Tổng số: {totalTasks} công việc trên hệ thống
                            </p>
                        </div>
                        <button onClick={handleRefresh}
                            className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                        </button>
                    </div>

                    {/* Search & Filter */}
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-4">
                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input type="text" placeholder="Tìm kiếm theo tên task, mô tả hoặc tên dự án..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Trạng thái:</label>
                                    <select 
                                        value={statusFilter} 
                                        onChange={e => {
                                            setStatusFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className="px-3 py-2 border border-gray-300 dark:border-slate-650 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Người quản lý:</label>
                                    <select 
                                        value={managerFilter} 
                                        onChange={e => {
                                            setManagerFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className="px-3 py-2 border border-gray-300 dark:border-slate-650 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 max-w-xs"
                                    >
                                        <option value="all">Tất cả manager</option>
                                        {managers.map(m => (
                                            <option key={m._id} value={m._id}>
                                                {`${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Người thực hiện:</label>
                                    <select 
                                        value={assigneeFilter} 
                                        onChange={e => {
                                            setAssigneeFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className="px-3 py-2 border border-gray-300 dark:border-slate-650 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 max-w-xs"
                                    >
                                        <option value="all">Tất cả người thực hiện</option>
                                        {assignees.map(a => (
                                            <option key={a._id} value={a._id}>
                                                {`${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                        <p className="text-gray-600 dark:text-slate-400">Đang tải danh sách công việc...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Có lỗi xảy ra</h3>
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button onClick={fetchTasks} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Thử lại</button>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-12 text-center">
                        <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Không tìm thấy công việc</h3>
                        <p className="text-gray-600 dark:text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-blue-600 dark:bg-slate-700 text-white">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tên công việc</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dự án</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Người quản lý</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Người thực hiện</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Trạng thái</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ưu tiên</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {filteredTasks.map(task => {
                                            const projectManager = task.project?.createdBy;
                                            const managerName = projectManager && typeof projectManager === 'object'
                                                ? `${projectManager.firstName || ''} ${projectManager.lastName || ''}`.trim() || projectManager.email || 'Chưa có'
                                                : 'Chưa có';

                                            const assignees = task.members || [];

                                            return (
                                                <tr key={task._id || task.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs" title={task.name}>
                                                            {task.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-550 dark:text-slate-300 font-semibold">
                                                            {task.project?.name || <span className="italic text-gray-400 font-normal">Không thuộc dự án nào</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-700 dark:text-slate-300">
                                                            <User className="w-4 h-4 text-gray-400 mr-2" />
                                                            {managerName}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                                            {assignees.length > 0 ? (
                                                                assignees.map(u => {
                                                                    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
                                                                    return (
                                                                        <span key={u._id || u.email} className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-purple-50 dark:bg-purple-950/20 text-purple-650 dark:text-purple-400 font-medium" title={u.email}>
                                                                            {name}
                                                                        </span>
                                                                    );
                                                                })
                                                            ) : (
                                                                <span className="text-xs italic text-gray-400">Chưa giao việc</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status] || 'bg-gray-100'}`}>
                                                            {TASK_STATUS_LABELS[task.status] || task.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority] || 'bg-gray-100'}`}>
                                                            <ArrowUpCircle className="w-3 h-3 mr-1" />
                                                            {PRIORITY_LABELS[task.priority] || task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col text-xs text-gray-550 dark:text-slate-400 font-medium">
                                                            <span>Bắt đầu: {formatDate(task.startDate)}</span>
                                                            <span className="mt-1 text-red-500">Hạn cuối: {formatDate(task.dueDate)}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center space-x-2 mt-6">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Trước
                                </button>
                                <span className="text-sm text-gray-750 dark:text-slate-300 font-semibold">
                                    Trang {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
