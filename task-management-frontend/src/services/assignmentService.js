// src/services/assignmentService.js
import { api } from "../utils/api";

const assignmentService = {
  /**
   * Tạo phân công (giao việc)
   * POST /api/assignments
   * Body: { taskId, assigneeId }
   * Yêu cầu: Manager/Admin
   */
  createAssignment: async (taskId, assigneeId) => {
    const res = await api.post("/assignments", { taskId, assigneeId });
    return { success: true, data: res.data, message: res.message };
  },

  /**
   * Lấy danh sách phân công theo task
   * GET /api/assignments?taskId=...
   * Employee chỉ thấy assignment của mình
   */
  getAssignmentsByTask: async (taskId) => {
    const res = await api.get(`/assignments?taskId=${taskId}`);
    return { success: true, data: res.data || [] };
  },

  /**
   * Lấy danh sách công việc được giao cho tôi
   * GET /api/assignments/my-tasks
   * Trả về: [{ _id, task: { name, status, priority, dueDate, project: { name } }, assignedBy, assignedAt }]
   */
  getMyAssignments: async () => {
    const res = await api.get("/assignments/my-tasks");
    return { success: true, data: res.data || [] };
  },

  /**
   * Hủy phân công
   * DELETE /api/assignments/:id
   * Yêu cầu: Manager/Admin
   */
  deleteAssignment: async (assignmentId) => {
    const res = await api.delete(`/assignments/${assignmentId}`);
    return { success: true, message: res.message };
  },

  /**
   * Lấy danh sách assignments của task từ task route
   * GET /api/tasks/:taskId/assignments
   */
  getTaskAssignments: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}/assignments`);
    return { success: true, data: res.data || [] };
  },
};

export default assignmentService;
