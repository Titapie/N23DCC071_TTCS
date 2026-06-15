import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import TaskPage from "./pages/TaskPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import CreateTaskPage from "./pages/CreateTaskPage";
import EditTaskPage from "./pages/EditTaskPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import KanbanPage from "./pages/KanbanPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

// admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage";
import AdminTasksPage from "./pages/admin/AdminTasksPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import ManagerRoute from "./routes/ManagerRoute";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AddMemberForm from "./components/projects/AddMemberForm.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgotpassword" element={<ForgotPasswordPage />} />

      {/* Protected routes - yêu cầu đăng nhập */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Tasks - xem cho tất cả, tạo/sửa chỉ Manager/Admin */}
          <Route path="/tasks" element={<TaskPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />

          {/* Tạo/sửa task: chỉ manager/admin */}
          <Route element={<ManagerRoute />}>
            <Route path="/tasks/create" element={<CreateTaskPage />} />
            <Route path="/tasks/:id/edit" element={<EditTaskPage />} />
          </Route>

          {/* Projects - xem cho tất cả */}
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />

          {/* Thêm thành viên: chỉ manager/admin */}
          <Route element={<ManagerRoute />}>
            <Route path="/projects/:id/add-members" element={<AddMemberForm />} />
          </Route>

          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/projects" element={<AdminProjectsPage />} />
            <Route path="/admin/tasks" element={<AdminTasksPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
