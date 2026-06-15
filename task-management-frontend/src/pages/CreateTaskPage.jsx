// src/pages/CreateTaskPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskForm from '../components/task/TaskForm';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import TASK_ROUTES from '../routes/taskRoutes';

const CreateTaskPage = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);

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
            const response = await taskService.createTask(formData);
            alert('Tạo task thành công!');
            const createdTask = response.task || response.data;
            const taskId = createdTask?._id || createdTask?.id;
            if (taskId) {
                navigate(TASK_ROUTES.DETAIL(taskId));
            } else {
                navigate(TASK_ROUTES.LIST);
            }
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    return (
        <>
            <TaskForm
                projects={projects}
                onSubmit={handleSubmit}
                onCancel={() => navigate(TASK_ROUTES.LIST)}
            />
        </>
    );
};

export default CreateTaskPage;