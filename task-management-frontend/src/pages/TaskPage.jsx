// src/pages/TasksPageCard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useTasks, { useUpcomingTasks } from '../hooks/useTasks';
import TaskList from '../components/task/TaskList';
import TaskFilter from '../components/task/TaskFilter';
import TaskSearch from '../components/task/TaskSearch';
import TaskUpcoming from '../components/task/TaskUpcoming';
import NoPermissionModal from '../components/common/NoPermissionModal';
import { Filter, ChevronDown, UserCheck, Briefcase } from 'lucide-react';
import { getProjectNameById } from '../utils/helpers';
import projectService from '../services/projectService';
import { TASK_ROUTES } from '../routes/taskRoutes';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { useAuth } from '../hooks/useAuth';
import { canCreateTask as canCreateTaskFn, hasManagerRole, hasEmployeeRole } from '../utils/roleUtils';

const TasksPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const canCreateTask = canCreateTaskFn(user);
    const isMultiRole = user && hasManagerRole(user) && hasEmployeeRole(user);
    const [taskRoleFilter, setTaskRoleFilter] = useState('all');
    const showMyTasksToggle = user && (((!isMultiRole && hasEmployeeRole(user)) || (isMultiRole && taskRoleFilter === 'employee')));

    const [params, setParams] = useState({
        page: 1,
        limit: 10,
        sortKey: 'dueDate',
        sortValue: 'DESC'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [noPermissionModal, setNoPermissionModal] = useState({ isOpen: false, message: '' });

    const [tempFilters, setTempFilters] = useState({
        status: '',
        priority: '',
        deadline_from: '',
        deadline_to: ''
    });

    const [appliedFilters, setAppliedFilters] = useState({
        status: '',
        priority: '',
        deadline_from: '',
        deadline_to: ''
    });

    const [sortConfig, setSortConfig] = useState({
        sortKey: 'dueDate',
        sortValue: 'DESC'
    });

    const [projects, setProjects] = useState([]);
    const [prioritizeAssigned, setPrioritizeAssigned] = useState(false);
    const [myTasksOnly, setMyTasksOnly] = useState(false);

    const { tasks, loading, error, refetch, pagination } = useTasks(params);
    const { upcomingTasks, loading: loadingUpcoming, refetch: refetchUpcoming } = useUpcomingTasks();

    const sortedTasks = useMemo(() => {
        if (!prioritizeAssigned) return tasks;
        return [...tasks].sort((a, b) => {
            const aAssigned = a.members?.some(m => m && (m._id === user?._id || m.id === user?._id));
            const bAssigned = b.members?.some(m => m && (m._id === user?._id || m.id === user?._id));
            if (aAssigned && !bAssigned) return -1;
            if (!aAssigned && bAssigned) return 1;
            return 0;
        });
    }, [tasks, prioritizeAssigned, user]);

    // Helper: Build params and cleanup
    const buildAndCleanParams = (overrides) => {
        const newParams = {
            page: params.page,
            limit: params.limit,
            ...overrides
        };

        Object.keys(newParams).forEach(key => {
            if (newParams[key] === undefined || newParams[key] === '') {
                delete newParams[key];
            }
        });

        return newParams;
    };

    const updateParamsAndFetch = (overrides) => {
        const newParams = buildAndCleanParams({
            page: 1,
            status: appliedFilters.status || undefined,
            priority: appliedFilters.priority || undefined,
            deadline_from: appliedFilters.deadline_from || undefined,
            deadline_to: appliedFilters.deadline_to || undefined,
            mode: taskRoleFilter === 'all' ? undefined : taskRoleFilter,
            myTasks: myTasksOnly ? 'true' : undefined,
            ...sortConfig,
            ...overrides
        });
        setParams(newParams);
        refetch(newParams);
    };

    const handleRoleFilterChange = (value) => {
        setTaskRoleFilter(value);
        setMyTasksOnly(false);
        updateParamsAndFetch({
            mode: value === 'all' ? undefined : value,
            myTasks: undefined
        });
    };

    const filteredUpcomingTasks = upcomingTasks.filter(task => {
        if (appliedFilters.status && task.status !== appliedFilters.status) return false;
        if (appliedFilters.priority && task.priority !== appliedFilters.priority) return false;
        return true;
    });

    const handleSearch = (search) => {
        updateParamsAndFetch({ search: search || undefined });
    };

    const handleFilterChange = (field, value) => {
        setTempFilters({ ...tempFilters, [field]: value });
    };

    const handleApplyFilters = () => {
        setAppliedFilters(tempFilters);
        updateParamsAndFetch({
            status: tempFilters.status || undefined,
            priority: tempFilters.priority || undefined,
            deadline_from: tempFilters.deadline_from || undefined,
            deadline_to: tempFilters.deadline_to || undefined
        });
        refetchUpcoming();
    };

    const handleResetFilters = () => {
        const resetFilters = { status: '', priority: '', deadline_from: '', deadline_to: '' };
        setTempFilters(resetFilters);
        setAppliedFilters(resetFilters);
        updateParamsAndFetch({ status: undefined, priority: undefined, deadline_from: undefined, deadline_to: undefined });
        refetchUpcoming();
    };

    const handleMyTasksToggle = () => {
        const nextVal = !myTasksOnly;
        setMyTasksOnly(nextVal);
        updateParamsAndFetch({ myTasks: nextVal ? 'true' : undefined });
    };

    const handleSortChange = (key, value) => {
        const newSortConfig = { sortKey: key, sortValue: value };
        setSortConfig(newSortConfig);
        updateParamsAndFetch({ sortKey: key, sortValue: value });
    };

    const handlePageChange = (newPage) => {
        const newParams = { ...params, page: newPage };
        setParams(newParams);
        refetch(newParams);
    };

    // Xử lý click nút "Tạo Task" — kiểm tra quyền trước
    const handleCreateTaskClick = () => {
        if (!canCreateTask) {
            setNoPermissionModal({
                isOpen: true,
                message: 'Bạn không có quyền tạo công việc. Chỉ Manager và Admin mới được tạo task.'
            });
            return;
        }
        navigate(TASK_ROUTES.CREATE);
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await projectService.getAllProjectsNoPagination();
                setProjects(response.projects || response.data || []);
            } catch (err) {
                console.error('Lỗi khi tải danh sách dự án:', err);
            }
        };
        fetchProjects();
    }, []);

    if (loading && params.page === 1) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl dark:bg-red-900/30 dark:border-red-700 dark:text-red-200 transition-all duration-300 animate-fade-in">
                    Lỗi: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
            {/* Header */}
            <div className="mb-6 animate-fade-in">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
                    Explore Task
                </h1>
            </div>

            {/* Role switcher tabs */}
            {isMultiRole && (
                <div className="flex gap-2 mb-6 animate-fade-in">
                    {[
                        { value: 'all', label: 'Tất cả công việc' },
                        { value: 'manager', label: 'Tôi quản lý' },
                        { value: 'employee', label: 'Tôi được giao' }
                    ].map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => handleRoleFilterChange(tab.value)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                taskRoleFilter === tab.value
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="animate-slide-down">
                <TaskSearch onSearch={handleSearch} placeholder="Search Task" />
            </div>

            {/* Filters and Sort */}
            <div className="mb-6 flex gap-4 items-center justify-between flex-wrap animate-fade-in-fast">
                <div className='flex gap-4 items-center'>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 transition-all duration-200"
                    >
                        <Filter size={20} />
                        Filters
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
                        />
                    </Button>

                    {showMyTasksToggle ? (
                        <button
                            id="my-task-toggle"
                            onClick={handleMyTasksToggle}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 shadow-sm ${
                                myTasksOnly
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-300'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <Briefcase size={16} className={myTasksOnly ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
                            My Task
                        </button>
                    ) : (
                        <button
                            onClick={() => setPrioritizeAssigned(!prioritizeAssigned)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all duration-200 shadow-sm ${
                                prioritizeAssigned
                                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}
                        >
                            <UserCheck size={16} className={prioritizeAssigned ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
                            Ưu tiên việc được giao
                        </button>
                    )}
                </div>

                {/* Nút Tạo Task — hiển thị cho tất cả, nhưng kiểm tra quyền khi click */}
                <Button
                    onClick={handleCreateTaskClick}
                    className="transition-transform hover:scale-105"
                >
                    Tạo Task
                </Button>
            </div>

            {/* Filters Section */}
            <div
                className={`mb-6 overflow-hidden transition-all duration-300 ease-in-out ${
                    showFilters
                        ? 'max-h-[500px] opacity-100 animate-slide-down'
                        : 'max-h-0 opacity-0'
                }`}
            >
                <TaskFilter
                    filters={tempFilters}
                    onFilterChange={handleFilterChange}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    showDeadlineFilter={true}
                />
            </div>

            {/* Upcoming Tasks Section */}
            <div className="animate-slide-up">
                <TaskUpcoming
                    tasks={filteredUpcomingTasks}
                    loading={loadingUpcoming}
                    projects={projects}
                    onNavigate={(taskId) => navigate(TASK_ROUTES.DETAIL(taskId))}
                />
            </div>

            {/* All Tasks Table */}
            <div className="mb-8 animate-fade-in-slow">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 transition-colors duration-300">
                    Tất cả công việc
                </h2>
                <TaskList
                    tasks={sortedTasks}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    canEdit={canCreateTask}
                />
            </div>



            {/* Modal không có quyền */}
            <NoPermissionModal
                isOpen={noPermissionModal.isOpen}
                message={noPermissionModal.message}
                onClose={() => setNoPermissionModal({ isOpen: false, message: '' })}
            />
        </div>
    );
};

export default TasksPage;