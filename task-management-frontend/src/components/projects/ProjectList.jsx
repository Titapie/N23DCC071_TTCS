import React, { useState, useEffect, useContext } from 'react';
import {
    Plus,
    Search,
    Filter,
    RefreshCw,
    Loader2,
    AlertCircle,
    Grid3x3,
    List as ListIcon
} from 'lucide-react';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import projectService from '../../services/projectService';
import DatePicker from '../common/DatePicker';
import {DARK_MODE_COLORS} from "../../utils/constants.js";
import { ToastContext } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import NoPermissionModal from '../common/NoPermissionModal';
import { canManageProjects, hasManagerRole, hasEmployeeRole } from '../../utils/roleUtils';

const ProjectList = () => {
    // States
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false); // loading riêng cho form submit
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [noPermissionModal, setNoPermissionModal] = useState(false);
    const [projectRoleFilter, setProjectRoleFilter] = useState('all');

    const { showToast } = useContext(ToastContext);
    const { user } = useContext(AuthContext);
    // Pagination
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProjects: 0,
        limit: 12
    });

    // Filters
    const [filters, setFilters] = useState({
        start_from: '',
        end_to: '',
        manager_id: '',
        sortKey: 'created_at',
        sortValue: 'DESC'
    });

    const [showFilters, setShowFilters] = useState(false);

    // Fetch projects
    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
                search: searchTerm,
                ...filters
            };

            const response = await projectService.getProjects(params);

            if (response.success) {
                setProjects(response.projects || []);
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.pagination?.totalPage || 1,
                    totalProjects: response.pagination?.totalProjects || 0
                }));
            }
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách dự án');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    // Effects
    useEffect(() => {
        fetchProjects();
    }, [pagination.currentPage, filters, searchTerm]);

    // Handlers
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleCreateNew = () => {
        // Kiểm tra role: employee thuần túy không được tạo project (dùng roleUtils hỗ trợ multi-role)
        if (user && !canManageProjects(user)) {
            setNoPermissionModal(true);
            return;
        }
        setEditingProject(null);
        setShowForm(true);
    };

    const handleFormSubmit = async (data) => {
        try {
            setFormLoading(true);

            if (editingProject) {
                const response = await projectService.updateProject(editingProject._id || editingProject.id, data);
                if (response.success) {
                    showToast('Cập nhật dự án thành công!', 'success');
                    setShowForm(false);
                    setEditingProject(null);
                    await fetchProjects();
                }
            } else {
                const response = await projectService.createProject(data);
                if (response.success) {
                    showToast('Tạo dự án thành công!', 'success');
                    setShowForm(false);
                    setEditingProject(null);
                    await fetchProjects();
                }
            }
        } catch (err) {
            // api.js reject lỗi dạng { message: '...' } (response.data từ backend)
            showToast(err.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        fetchProjects();
    };

    const clearFilters = () => {
        setFilters({
            start_from: '',
            end_to: '',
            manager_id: '',
            sortKey: 'created_at',
            sortValue: 'DESC'
        });
        setSearchTerm('');
    };

    // Render pagination
    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        const pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Trước
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="px-2 dark:text-gray-400">...</span>}
                    </>
                )}

                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                            page === pagination.currentPage
                                ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {endPage < pagination.totalPages && (
                    <>
                        {endPage < pagination.totalPages - 1 && <span className="px-2 dark:text-gray-400">...</span>}
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                        >
                            {pagination.totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Sau
                </button>
            </div>
        );
    };

    // Modal Form
    if (showForm) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className="max-w-2xl w-full">
                    <ProjectForm
                        project={editingProject}
                        mode={editingProject ? 'edit' : 'create'}
                        onSubmit={handleFormSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingProject(null);
                        }}
                        isLoading={formLoading}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-200">
            {/* Modal không có quyền */}
            <NoPermissionModal
                isOpen={noPermissionModal}
                message="Bạn không có quyền tạo dự án. Chức năng này chỉ dành cho Manager và Admin."
                onClose={() => setNoPermissionModal(false)}
            />
            <div className="w-full mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className={`text-3xl font-bold text-gray-900 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                                Quản lý dự án
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Tổng số: {pagination.totalProjects} dự án
                            </p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Tạo dự án mới
                        </button>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className={`${DARK_MODE_COLORS.BG_CARD} rounded-lg shadow-md dark:shadow-slate-700/50 p-4 space-y-4 transition-colors duration-200`}>
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên dự án..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className={`w-full pl-10 pr-4 py-2 border ${DARK_MODE_COLORS.BORDER_PRIMARY} ${DARK_MODE_COLORS.BG_INPUT}  ${DARK_MODE_COLORS.TEXT_PRIMARY} rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 transition-colors`}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                        showFilters
                                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                                            : 'bg-gray-100 dark:bg-blue-500 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-400 hover:text-blue-600 dark:hover:text-white'
                                    }`}
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    Lọc
                                </button>

                                <button
                                    onClick={handleRefresh}
                                    className="flex items-center px-4 py-2 bg-gray-100 dark:bg-blue-500 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-400 hover:text-blue-600 dark:hover:text-white transition-colors"
                                    disabled={loading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Filters Panel */}
                        {showFilters && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Từ ngày
                                        </label>
                                        <DatePicker
                                            value={filters.start_from}
                                            onChange={(e) => handleFilterChange('start_from', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Đến ngày
                                        </label>
                                        <DatePicker
                                            value={filters.end_to}
                                            onChange={(e) => handleFilterChange('end_to', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Sắp xếp theo
                                        </label>
                                        <select
                                            value={`${filters.sortKey}-${filters.sortValue}`}
                                            onChange={(e) => {
                                                const [key, value] = e.target.value.split('-');
                                                setFilters(prev => ({ ...prev, sortKey: key, sortValue: value }));
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                                        >
                                            <option value="created_at-DESC">Mới nhất</option>
                                            <option value="created_at-ASC">Cũ nhất</option>
                                            <option value="name-ASC">Tên A-Z</option>
                                            <option value="name-DESC">Tên Z-A</option>
                                            <option value="dueDate-ASC">Deadline gần nhất</option>
                                            <option value="dueDate-DESC">Deadline xa nhất</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {(() => {
                    const isMultiRole = user && hasManagerRole(user) && hasEmployeeRole(user);
                    const displayedProjects = projects.filter(project => {
                        if (!isMultiRole || projectRoleFilter === 'all') return true;
                        if (projectRoleFilter === 'manager') return project.userRole === 'manager' || project.userRole === 'both';
                        if (projectRoleFilter === 'employee') return project.userRole === 'employee' || project.userRole === 'both';
                        return true;
                    });

                    return (
                        <>
                            {/* Multi-role Filter Tabs */}
                            {isMultiRole && projects.length > 0 && (
                                <div className="flex gap-2 mb-6">
                                    {[
                                        { value: 'all', label: 'Tất cả dự án' },
                                        { value: 'manager', label: 'Tôi quản lý' },
                                        { value: 'employee', label: 'Tôi được giao' }
                                    ].map(tab => (
                                        <button
                                            key={tab.value}
                                            onClick={() => setProjectRoleFilter(tab.value)}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                                projectRoleFilter === tab.value
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {loading && projects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                                    <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                                        Có lỗi xảy ra
                                    </h3>
                                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                                    <button
                                        onClick={handleRefresh}
                                        className="px-6 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-lg shadow-md dark:shadow-slate-700/50 p-12 text-center transition-colors duration-200`}>
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Không tìm thấy dự án
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        {searchTerm || filters.start_from || filters.end_to
                                            ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                            : 'Bắt đầu bằng cách tạo dự án đầu tiên của bạn'}
                                    </p>
                                    <button
                                        onClick={handleCreateNew}
                                        className="inline-flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Tạo dự án mới
                                    </button>
                                </div>
                            ) : displayedProjects.length === 0 ? (
                                <div className={`${DARK_MODE_COLORS.BG_PRIMARY} rounded-lg shadow-md dark:shadow-slate-700/50 p-12 text-center transition-colors duration-200`}>
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        Không có dự án phù hợp
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Bạn không có dự án nào thuộc nhóm này.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Projects Grid */}
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                                        {displayedProjects.map((project) => (
                                            <div key={project._id || project.id} className="relative group">
                                                <ProjectCard project={project} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {renderPagination()}
                                </>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default ProjectList;