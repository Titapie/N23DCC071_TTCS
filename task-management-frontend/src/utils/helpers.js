// project map id to name helper
export const getProjectNameById = (projectId, projects) => {
    if (!projectId) return 'Không thuộc dự án nào';
    const project = projects.find(p => p.id === projectId);
    return project ? project.Name : 'Không thuộc dự án nào';
};