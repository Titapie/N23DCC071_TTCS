// src/routes/taskRoutes.js

export const TASK_ROUTES = {
  LIST: '/tasks',
  KANBAN: '/kanban',
  CREATE: '/tasks/create',
  DETAIL: (id) => `/tasks/${id}`,
  EDIT: (id) => `/tasks/${id}/edit`,
};

export default TASK_ROUTES;