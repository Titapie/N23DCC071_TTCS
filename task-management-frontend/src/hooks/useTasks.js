// src/hooks/useTasks.js
import { useState, useEffect, useMemo } from 'react';
import taskService from '../services/taskService';

const useTasks = (initialParams = {}) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPage: 0,
        totalTask: 0,
        startIndex: 0,
        endIndex: 0,
        hasNextPage: false,
        hasPrevPage: false
    });

    const memoizedParams = useMemo(() => initialParams, [JSON.stringify(initialParams)]);
    useEffect(() => {
        fetchTasks(memoizedParams);
    }, [memoizedParams]);


    const fetchTasks = async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await taskService.getTasks(params);
            
            // Chuẩn hóa: ưu tiên response.data, fallback sang response.tasks hoặc response
            const tasksData = response?.data || response?.tasks || [];
            setTasks(Array.isArray(tasksData) ? tasksData : []);
            
            // Parse pagination từ API response
            if (response.pagination) {
                setPagination(response.pagination);
            } else {
                // Fallback: tính pagination từ params nếu API không trả về
                const currentPage = params.page || 1;
                const limit = params.limit || 10;
                const totalTask = Array.isArray(tasksData) ? tasksData.length : 0;
                
                setPagination({
                    currentPage,
                    totalPage: Math.ceil(totalTask / limit),
                    totalTask: totalTask,
                    startIndex: (currentPage - 1) * limit + 1,
                    endIndex: Math.min(currentPage * limit, totalTask),
                    hasNextPage: currentPage * limit < totalTask,
                    hasPrevPage: currentPage > 1
                });
            }
        } catch (err) {
            setError(err.message);
            setTasks([]);
            setPagination({
                currentPage: 1,
                totalPage: 0,
                totalTask: 0,
                startIndex: 0,
                endIndex: 0,
                hasNextPage: false,
                hasPrevPage: false
            });
        } finally {
            setLoading(false);
        }
    };

    const refetch = (params) => {
        fetchTasks(params);
    };

    return {
        tasks,
        loading,
        error,
        pagination,
        refetch
    };
};

// Hook để lấy tasks sắp đến hạn (3 ngày tới)
export const useUpcomingTasks = (mode) => {
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchUpcomingTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await taskService.getUpcomingTasks(mode);
                if (mounted) {
                    // Chuẩn hóa response
                    setUpcomingTasks(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Error fetching upcoming tasks:', err);
                    setError(err.message);
                    setUpcomingTasks([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchUpcomingTasks();

        return () => {
            mounted = false;
        };
    }, [mode]);

    const refetch = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getUpcomingTasks(mode);
            setUpcomingTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error refetching upcoming tasks:', err);
            setError(err.message);
            setUpcomingTasks([]);
        } finally {
            setLoading(false);
        }
    };

    return {
        upcomingTasks,
        loading,
        error,
        refetch
    };
};

// Hook để lấy tasks quá hạn
export const useOverdueTasks = (mode) => {
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchOverdueTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await taskService.getOverdueTasks(mode);
                if (mounted) {
                    // Chuẩn hóa response
                    setOverdueTasks(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Error fetching overdue tasks:', err);
                    setError(err.message);
                    setOverdueTasks([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchOverdueTasks();

        return () => {
            mounted = false;
        };
    }, [mode]);

    const refetch = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getOverdueTasks(mode);
            setOverdueTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error refetching overdue tasks:', err);
            setError(err.message);
            setOverdueTasks([]);
        } finally {
            setLoading(false);
        }
    };

    return {
        overdueTasks,
        loading,
        error,
        refetch
    };
};

// Hook để lấy tasks gần đây
export const useRecentTasks = (limit = 5, mode) => {
    const [recentTasks, setRecentTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchRecentTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await taskService.getRecentTasks(limit, mode);
                if (mounted) {
                    // Chuẩn hóa response
                    setRecentTasks(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Error fetching recent tasks:', err);
                    setError(err.message);
                    setRecentTasks([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchRecentTasks();

        return () => {
            mounted = false;
        };
    }, [limit, mode]);

    const refetch = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getRecentTasks(limit, mode);
            setRecentTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching recent tasks:', err);
            setError(err.message);
            setRecentTasks([]);
        } finally {
            setLoading(false);
        }
    };

    return {
        recentTasks,
        loading,
        error,
        refetch
    };
};

// Hook kết hợp upcoming và overdue tasks
export const useDeadlineTasks = (mode) => {
    const { upcomingTasks, loading: upcomingLoading, error: upcomingError, refetch: refetchUpcoming } = useUpcomingTasks(mode);
    const { overdueTasks, loading: overdueLoading, error: overdueError, refetch: refetchOverdue } = useOverdueTasks(mode);

    const refetchAll = () => {
        refetchUpcoming();
        refetchOverdue();
    };

    return {
        upcomingTasks,
        overdueTasks,
        loading: upcomingLoading || overdueLoading,
        error: upcomingError || overdueError,
        refetch: refetchAll
    };
};

export default useTasks;