import { api } from "../utils/api";

const taskService = {
  getTasks: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.status) queryParams.append("status", params.status);
    if (params.priority) queryParams.append("priority", params.priority);
    if (params.project) queryParams.append("project", params.project);
    if (params.mode) queryParams.append("mode", params.mode);
    if (params.manager) queryParams.append("manager", params.manager);
    if (params.assignee) queryParams.append("assignee", params.assignee);
    if (params.myTasks) queryParams.append("myTasks", params.myTasks);

    // Nếu có projectId thì gọi /projects/:id/tasks (chỉ khi không lọc theo mode)
    let endpoint;
    if (params.project && !params.status && !params.priority && !params.mode && !params.manager && !params.assignee && !params.myTasks) {
      endpoint = `/projects/${params.project}/tasks`;
    } else {
      endpoint = `/tasks?${queryParams.toString()}`;
    }

    const res = await api.get(endpoint);

    return {
      success: true,
      tasks: res.data || [],
      data: res.data || [],
      pagination: res.pagination || { totalTask: (res.data || []).length },
    };
  },

  getTaskById: async (id) => {
    const res = await api.get(`/tasks/${id}`);
    return { success: true, task: res.data, data: res.data };
  },

  createTask: async (taskData) => {
    const payload = {
      name: taskData.name,
      description: taskData.description,
      priority: taskData.priority || "medium",
      startDate: taskData.startDate,
      dueDate: taskData.dueDate,
      project: taskData.project,
      parentTask: taskData.parentTask || undefined,
      status: taskData.status,
    };
    // Bỏ field undefined
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );
    const res = await api.post(`/tasks`, payload);
    return { success: true, message: "Task created", task: res.data, data: res.data };
  },

  updateTask: async (id, taskData) => {
    // PUT /api/tasks/:id - chỉ manager/admin, cập nhật status tự do
    const payload = {
      name: taskData.name,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      startDate: taskData.startDate,
      dueDate: taskData.dueDate,
    };
    // Bỏ field undefined
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );
    const res = await api.put(`/tasks/${id}`, payload);
    return { success: true, task: res.data, data: res.data };
  },

  /**
   * Cập nhật trạng thái task
   * PATCH /api/tasks/:id/status
   * Body: { status, note? }
   * Tất cả role đều được gọi (employee cập nhật task được giao)
   */
  updateTaskStatus: async (taskId, status, note, startDate, dueDate) => {
    const payload = { status };
    if (note) payload.note = note;
    if (startDate) payload.startDate = startDate;
    if (dueDate) payload.dueDate = dueDate;
    const res = await api.patch(`/tasks/${taskId}/status`, payload);
    return { success: true, data: res.data, task: res.data };
  },

  deleteTask: async (id) => {
    const res = await api.delete(`/tasks/${id}`);
    return { success: true, message: "Task deleted", task: res.data };
  },

  exportTasks: async (params = {}) => {
    const response = await taskService.getTasks({ ...params, limit: 1000, page: 1 });
    const data = response.tasks || response.data || [];
    const content = JSON.stringify(data, null, 2);
    return new Blob([content], { type: "application/json" });
  },

  getUpcomingTasks: async (mode) => {
    const params = { limit: 100 };
    if (mode) params.mode = mode;
    if (mode === 'employee') params.myTasks = 'true';
    const res = await api.get('/tasks', { params });
    const tasks = res.data || [];
    const now = new Date();
    const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= now && due <= end && task.status !== "done";
    });
  },

  getOverdueTasks: async (mode) => {
    const params = { limit: 100 };
    if (mode) params.mode = mode;
    if (mode === 'employee') params.myTasks = 'true';
    const res = await api.get('/tasks', { params });
    const tasks = res.data || [];
    const now = new Date();
    return tasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== "done"
    );
  },

  getRecentTasks: async (limit = 5, mode) => {
    const params = { limit };
    if (mode) params.mode = mode;
    if (mode === 'employee') params.myTasks = 'true';
    const res = await api.get('/tasks', { params });
    return res.data || [];
  },

  /**
   * Lấy danh sách assignments của task
   * GET /api/tasks/:taskId/assignments
   * hoặc GET /api/assignments?taskId=...
   */
  getTaskAssignments: async (taskId) => {
    try {
      const res = await api.get(`/tasks/${taskId}/assignments`);
      return { success: true, data: res.data || [] };
    } catch (err) {
      // Fallback
      return { success: true, data: [] };
    }
  },

  // Alias cũ để tương thích component đang dùng
  getTaskMembers: async (taskId) => {
    return taskService.getTaskAssignments(taskId);
  },

  /**
   * Employee xin làm lại task đã hoàn thành
   * POST /api/tasks/:id/request-redo
   * Không đổi status — chỉ gửi email tới manager
   */
  requestRedo: async (taskId) => {
    const res = await api.post(`/tasks/${taskId}/request-redo`);
    return { success: true, data: res.data };
  },
};

/**
 * updateTaskStatus - named export cho tương thích backward
 * PATCH /api/tasks/:id/status
 */
export const updateTaskStatus = async (taskId, newStatus, note, startDate, dueDate) => {
  const payload = { status: newStatus };
  if (note) payload.note = note;
  if (startDate) payload.startDate = startDate;
  if (dueDate) payload.dueDate = dueDate;
  const res = await api.patch(`/tasks/${taskId}/status`, payload);
  return { success: true, data: res.data, task: res.data };
};

export default taskService;