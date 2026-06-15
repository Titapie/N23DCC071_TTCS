// src/pages/EditTaskPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TaskForm from '../components/task/TaskForm';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import TASK_ROUTES from '../routes/taskRoutes';
import { ToastContext } from '../context/ToastContext';

const EditTaskPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useContext(ToastContext);

    const [task, setTask] = useState(null);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const data = await taskService.getTaskById(id);
                const taskData = data.task || data.data || data;
                setTask(taskData);
            } catch (err) {
                console.error('Lỗi khi tải task:', err);
                showToast('Không thể tải thông tin công việc: ' + (err.message || ''), 'error');
            }
        };
        fetchTask();
    }, [id]);

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

    const handleSubmit = async (formData) => {
        try {
            await taskService.updateTask(id, formData);
            showToast('Cập nhật công việc thành công!', 'success');
            // Chuyển sang trang chi tiết để có thể giao việc
            navigate(TASK_ROUTES.DETAIL(id));
        } catch (err) {
            showToast('Lỗi: ' + (err.message || 'Không thể cập nhật công việc'), 'error');
        }
    };

    if (!task) return null;

    return (
        <>
            <TaskForm
                initialData={task}
                projects={projects}
                onSubmit={handleSubmit}
                onCancel={() => navigate(TASK_ROUTES.DETAIL(id))}
            />
        </>
    );
};

export default EditTaskPage;