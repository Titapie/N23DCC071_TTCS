import React, { useState, useEffect } from 'react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import ProjectFilter from '../components/kanban/ProjectFilter';
import { DARK_MODE_COLORS } from '../utils/constants';
import projectService from '../services/projectService';
import { useAuth } from '../hooks/useAuth';
import { hasManagerRole, hasEmployeeRole } from '../utils/roleUtils';

const KanbanPage = () => {
    const { user } = useAuth();
    const isMultiRole = user && hasManagerRole(user) && hasEmployeeRole(user);
    const [taskRoleFilter, setTaskRoleFilter] = useState('all');
    const [projectId, setProjectId] = useState('');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch danh sách projects khi component mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await projectService.getAllProjectsNoPagination();
                setProjects(response.projects || []);
            } catch (error) {
                console.error('Lỗi khi tải danh sách dự án:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleProjectChange = (e) => {
        setProjectId(e.target.value);
    };

    return (
        <div className={`min-h-screen flex flex-col overflow-hidden ${DARK_MODE_COLORS.BG_SECONDARY} p-6`}>
            {/* Header */}
            <div className="mb-6">
                <h1 className={`text-3xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Kanban Board</h1>
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
                            onClick={() => setTaskRoleFilter(tab.value)}
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

            {/* Project Filter */}
            {!loading && (
                <ProjectFilter
                    value={projectId}
                    onChange={handleProjectChange}
                    projects={projects}
                />
            )}

            {/* Kanban Board - FULL WIDTH */}
            <div className="flex-1 overflow-hidden">
                <KanbanBoard 
                    filters={{ project_id: projectId, mode: taskRoleFilter === 'all' ? undefined : taskRoleFilter }} 
                    projects={projects}
                />
            </div>
        </div>
    );
};

export default KanbanPage;