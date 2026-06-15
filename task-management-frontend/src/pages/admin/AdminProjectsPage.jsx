import React, { useState, useEffect } from 'react';
import { 
    Briefcase, Search, RefreshCw, Loader2, AlertCircle, 
    Calendar, User, CheckCircle2, Clock, HelpCircle, AlertTriangle
} from 'lucide-react';
import projectService from '../../services/projectService';
import { useTheme } from '../../context/ThemeContext';
import { DARK_MODE_COLORS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

export default function AdminProjectsPage() {
    const { user } = useAuth();
    const { theme } = useTheme();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await projectService.getAllProjectsNoPagination();
            if (response.success) {
                setProjects(response.projects || response.data || []);
            }
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách dự án');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchProjects();
        }
    }, [user]);

    if (user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 text-red-500 font-semibold">
                Bạn không có quyền truy cập trang này.
            </div>
        );
    }

    const handleRefresh = () => {
        fetchProjects();
    };

    const getFilteredProjects = () => {
        if (!searchTerm.trim()) return projects;
        const q = searchTerm.toLowerCase();
        return projects.filter(p => 
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getProjectStatus = (project) => {
        const total = project.total_tasks || 0;
        const completed = project.completed_tasks || 0;
        const completionRate = project.completionRate !== undefined ? project.completionRate : (total > 0 ? Math.round((completed / total) * 100) : 0);

        if (completionRate === 100) {
            return {
                label: 'Hoàn thành',
                color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                icon: CheckCircle2
            };
        }

        const endDate = project.endDate ? new Date(project.endDate) : null;
        const today = new Date();
        if (endDate && endDate < today) {
            return {
                label: 'Quá hạn',
                color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                icon: AlertTriangle
            };
        }

        if (total === 0) {
            return {
                label: 'Tạm dừng',
                color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                icon: HelpCircle
            };
        }

        return {
            label: 'Đang làm',
            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            icon: Clock
        };
    };

    const filteredProjects = getFilteredProjects();

    return (
        <div className="h-full bg-gray-50 dark:bg-slate-900 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">Quản lý Projects</h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-1">Tổng quan toàn bộ dự án đang có trên hệ thống</p>
                        </div>
                        <button onClick={handleRefresh}
                            className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input type="text" placeholder="Tìm kiếm dự án theo tên hoặc mô tả..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                        <p className="text-gray-600 dark:text-slate-400">Đang tải danh sách dự án...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Có lỗi xảy ra</h3>
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button onClick={fetchProjects} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Thử lại</button>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md p-12 text-center">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Không tìm thấy dự án</h3>
                        <p className="text-gray-600 dark:text-slate-400">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-indigo-600 text-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tên dự án</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Mô tả</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Người quản lý</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tasks (Tổng/Đã xong)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tiến độ</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Thời gian</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {filteredProjects.map(project => {
                                        const total = project.total_tasks || 0;
                                        const completed = project.completed_tasks || 0;
                                        const completionRate = project.completionRate !== undefined ? project.completionRate : (total > 0 ? Math.round((completed / total) * 100) : 0);
                                        const statusInfo = getProjectStatus(project);
                                        const StatusIcon = statusInfo.icon;

                                        const managerObj = project.createdBy;
                                        const managerName = managerObj && typeof managerObj === 'object'
                                            ? `${managerObj.firstName || ''} ${managerObj.lastName || ''}`.trim() || managerObj.email || 'Chưa có'
                                            : 'Chưa có';

                                        return (
                                            <tr key={project._id || project.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-xs" title={project.name}>
                                                        {project.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 max-w-xs" title={project.description}>
                                                        {project.description || <span className="italic text-gray-400 font-normal">Không có mô tả</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-700 dark:text-slate-300">
                                                        <User className="w-4 h-4 text-gray-400 mr-2" />
                                                        {managerName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700 dark:text-slate-300">
                                                        <span className="font-bold text-gray-900 dark:text-white">{total}</span>
                                                        <span className="text-gray-400 mx-1">/</span>
                                                        <span className="font-bold text-green-600 dark:text-green-400">{completed}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="w-36">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{completionRate}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${
                                                                    completionRate >= 80 ? 'bg-green-500' :
                                                                    completionRate >= 50 ? 'bg-blue-500' :
                                                                    completionRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${completionRate}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col text-xs text-gray-500 dark:text-slate-400">
                                                        <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Bắt đầu: {formatDate(project.startDate)}</span>
                                                        <span className="flex items-center mt-1"><Calendar className="w-3.5 h-3.5 mr-1 text-red-400" /> Kết thúc: {formatDate(project.endDate)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {statusInfo.label}
                                                    </span>
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
        </div>
    );
}
