// services/statsService.js
// Tất cả method đều gọi API thật từ backend, không dùng mock data
import { api } from "../utils/api";

class StatsService {
  /**
   * Lấy overview stats cho dashboard
   * Gọi GET /api/dashboard/overview (backend xử lý theo role)
   * Response admin: { totalUsers, totalProjects, totalTasks, tasksByStatus }
   * Response manager: { totalProjects, totalTasks, tasksByStatus }
   * Response employee: { totalAssignedTasks, tasksByStatus }
   */
  async getOverview(mode) {
    try {
      const res = await api.get('/dashboard/overview', { params: mode ? { mode } : {} });
      const data = res.data || {};

      // Normalize: tính totalTasks và completionRate từ tasksByStatus
      const byStatus = data.tasksByStatus || {};
      const totalTasks = data.totalTasks || data.totalAssignedTasks ||
        Object.values(byStatus).reduce((s, v) => s + v, 0);
      const doneTasks = byStatus.done || 0;
      const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      return {
        // Fields chuẩn cho useOverviewStats
        total: totalTasks,
        completed: doneTasks,
        failed: byStatus.cancelled || 0,
        in_progress: byStatus.in_progress || 0,
        pending: byStatus.pending || 0,
        todo: byStatus.todo || 0,
        completion_rate: completionRate,
        overdue: data.overdueTasksCount || 0,
        // Admin-only
        totalUsers: data.totalUsers || 0,
        totalProjects: data.totalProjects || 0,
        // Raw
        _raw: data,
      };
    } catch (err) {
      console.error('getOverview error:', err);
      return { total: 0, completed: 0, failed: 0, in_progress: 0, pending: 0, todo: 0, completion_rate: 0, overdue: 0 };
    }
  }

  /**
   * Biểu đồ tiến độ theo tuần/tháng/năm
   * Backend KHÔNG có API này → tính từ GET /api/tasks (tất cả task)
   * Nhóm theo createdAt (task mới) và updatedAt + status=done (task hoàn thành)
   */
  async getProgressChart(period = "month", mode) {
    try {
      // Lấy tất cả task (giới hạn 500 để performance)
      const params = { limit: 500 };
      if (mode) params.mode = mode;
      if (mode === 'employee') params.myTasks = 'true';
      const res = await api.get('/tasks', { params });
      const tasks = res.data || [];

      const now = new Date();
      let labels = [];
      let created = [];
      let completed = [];

      if (period === 'week') {
        // 7 ngày gần nhất
        labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const dayOfWeek = now.getDay(); // 0=CN, 1=T2...
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
        monday.setHours(0, 0, 0, 0);

        created = Array(7).fill(0);
        completed = Array(7).fill(0);

        tasks.forEach(task => {
          const createdAt = new Date(task.createdAt);
          const dayIdx = Math.floor((createdAt - monday) / (1000 * 60 * 60 * 24));
          if (dayIdx >= 0 && dayIdx < 7) created[dayIdx]++;
          if (task.status === 'done') {
            const updatedAt = new Date(task.updatedAt || task.createdAt);
            const doneIdx = Math.floor((updatedAt - monday) / (1000 * 60 * 60 * 24));
            if (doneIdx >= 0 && doneIdx < 7) completed[doneIdx]++;
          }
        });

      } else if (period === 'year') {
        // 12 tháng gần nhất
        labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        created = Array(12).fill(0);
        completed = Array(12).fill(0);

        tasks.forEach(task => {
          const createdAt = new Date(task.createdAt);
          if (createdAt.getFullYear() === now.getFullYear()) {
            created[createdAt.getMonth()]++;
          }
          if (task.status === 'done') {
            const updatedAt = new Date(task.updatedAt || task.createdAt);
            if (updatedAt.getFullYear() === now.getFullYear()) {
              completed[updatedAt.getMonth()]++;
            }
          }
        });

      } else {
        // month: 4 tuần gần nhất
        labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
        created = Array(4).fill(0);
        completed = Array(4).fill(0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        tasks.forEach(task => {
          const createdAt = new Date(task.createdAt);
          const diffDays = Math.floor((createdAt - startOfMonth) / (1000 * 60 * 60 * 24));
          const weekIdx = Math.min(Math.floor(diffDays / 7), 3);
          if (diffDays >= 0 && createdAt.getMonth() === now.getMonth()) {
            created[weekIdx]++;
          }
          if (task.status === 'done') {
            const updatedAt = new Date(task.updatedAt || task.createdAt);
            const diffDone = Math.floor((updatedAt - startOfMonth) / (1000 * 60 * 60 * 24));
            const weekDone = Math.min(Math.floor(diffDone / 7), 3);
            if (diffDone >= 0 && updatedAt.getMonth() === now.getMonth()) {
              completed[weekDone]++;
            }
          }
        });
      }

      return { labels, created, completed };
    } catch (err) {
      console.error('getProgressChart error:', err);
      // Fallback minimal
      return { labels: [], created: [], completed: [] };
    }
  }

  /**
   * Phân bố trạng thái task
   * GET /api/statistics/tasks/status
   * Response: { todo, in_progress, done, pending, cancelled, total }
   */
  async getTaskStatusStats(mode) {
    try {
      const res = await api.get('/statistics/tasks/status', { params: mode ? { mode } : {} });
      // Backend trả data.todo, data.in_progress, data.done, data.pending, data.cancelled
      return res.data || {};
    } catch (err) {
      console.error('getTaskStatusStats error:', err);
      return { todo: 0, in_progress: 0, done: 0, pending: 0, cancelled: 0, total: 0 };
    }
  }

  /**
   * Tổng quan dự án
   * GET /api/statistics/projects
   * Response: [{ _id, name, progress, startDate, endDate, totalTasks, doneTasks, completionRate }]
   */
  async getProjectSummary(mode) {
    try {
      const res = await api.get('/statistics/projects', { params: mode ? { mode } : {} });
      const projects = res.data || [];
      const today = new Date();

      let active = 0, completedCount = 0, onHold = 0, overdue = 0;

      projects.forEach(p => {
        const isCompleted = p.completionRate === 100;
        const isOverdue = p.endDate && new Date(p.endDate) < today && !isCompleted;
        const hasInProgress = p.totalTasks > 0 && p.doneTasks < p.totalTasks;

        if (isCompleted) {
          completedCount++;
        } else if (isOverdue) {
          overdue++;
        } else if (hasInProgress) {
          active++;
        } else {
          onHold++;
        }
      });

      return {
        total: projects.length,
        active,
        completed: completedCount,
        onHold,
        overdue,
        projects, // raw array
      };
    } catch (err) {
      console.error('getProjectSummary error:', err);
      return { total: 0, active: 0, completed: 0, onHold: 0, overdue: 0, projects: [] };
    }
  }

  /**
   * Top performers
   * Gọi GET /api/statistics/tasks/user/:userId cho từng user
   * Chỉ admin/manager được gọi
   */
  async getUserPerformance() {
    try {
      const usersRes = await api.get('/users?limit=100');
      const users = usersRes.data || [];

      const performanceList = await Promise.all(users.map(async u => {
        try {
          const uStats = await api.get(`/statistics/tasks/user/${u._id}`);
          const s = uStats.data?.stats || {};
          return {
            userId: u._id,
            userName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            userEmail: u.email,
            completedTasks: s.done || 0,
            inProgressTasks: s.in_progress || 0,
            totalTasks: s.total || 0,
          };
        } catch {
          return {
            userId: u._id,
            userName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            userEmail: u.email,
            completedTasks: 0,
            inProgressTasks: 0,
            totalTasks: 0,
          };
        }
      }));

      return performanceList.sort((a, b) => b.completedTasks - a.completedTasks);
    } catch (err) {
      console.error('getUserPerformance error:', err);
      return [];
    }
  }

  async getAllProjects() {
    try {
      const res = await api.get('/projects?limit=1000');
      return res.data || [];
    } catch {
      return [];
    }
  }
}

export default new StatsService();