import { api } from "../utils/api";

const projectService = {
  getProjects: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);

    const res = await api.get(`/projects?${queryParams.toString()}`);
    
    return {
      success: true,
      projects: res.data || [],
      data: res.data || [],
      pagination: res.pagination || { totalProjects: (res.data || []).length },
    };
  },

  getAllProjectsNoPagination: async () => {
    const res = await api.get(`/projects?limit=1000`);
    return {
      success: true,
      projects: res.data || [],
      data: res.data || [],
      pagination: res.pagination || { totalProjects: (res.data || []).length, totalPage: 1, currentPage: 1 },
    };
  },

  getProject: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return { success: true, project: res.data, data: res.data };
  },

  createProject: async (data) => {
    const payload = {
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
    };
    const res = await api.post(`/projects`, payload);
    return { success: true, message: "Project created", project: res.data, data: res.data };
  },

  updateProject: async (id, data) => {
    const payload = {
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      progress: data.progress,
    };
    const res = await api.put(`/projects/${id}`, payload);
    return { success: true, message: "Project updated", project: res.data, data: res.data };
  },

  deleteProject: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return { success: true, message: "Project deleted", project: res.data };
  },

  getProjectMembers: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/members`);
    return { success: true, data: res.data || [] };
  },

  getProjectTasks: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/tasks`);
    return { success: true, data: res.data || [] };
  },

  /**
   * Thêm nhiều thành viên vào dự án (gọi từng request theo từng user)
   * Backend: POST /api/project-members { projectId, userId, role }
   * @param {string} projectId
   * @param {Array<{member_id: string, role: string}>} members
   */
  addMembers: async (projectId, members) => {
    const results = [];
    for (const member of members) {
      try {
        const res = await api.post(`/project-members`, {
          projectId,
          userId: member.member_id || member.userId,
          role: member.role || 'member',
        });
        results.push(res.data);
      } catch (err) {
        // Ném lỗi của lần đầu tiên để component xử lý
        throw err;
      }
    }
    return { success: true, message: "Members added", data: results };
  },

  /**
   * Xóa thành viên khỏi dự án theo membershipId
   * Backend: DELETE /api/project-members/:id
   */
  removeMember: async (membershipId) => {
    const res = await api.delete(`/project-members/${membershipId}`);
    return { success: true, message: "Member removed", data: res.data };
  },

  getMemberUnfinishedTasks: async (projectId, employeeId) => {
    const res = await api.get(`/projects/${projectId}/members/${employeeId}/unfinished-tasks`);
    return {
      success: true,
      unfinishedTaskCount: res.unfinishedTaskCount || res.data?.unfinishedTaskCount || 0,
      tasks: res.tasks || res.data?.tasks || []
    };
  },

  removeMemberFromProject: async (projectId, employeeId, handoverEmployeeId = null) => {
    const payload = {};
    if (handoverEmployeeId) {
      payload.handoverEmployeeId = handoverEmployeeId;
    }
    const res = await api.delete(`/projects/${projectId}/members/${employeeId}`, { data: payload });
    return { success: true, message: "Member removed from project", data: res.data };
  },
};

export default projectService;