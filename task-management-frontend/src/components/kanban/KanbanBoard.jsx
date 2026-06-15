import React, { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import KanbanStatusModal from './KanbanStatusModal';
import DeadlineConflictModal from './DeadlineConflictModal';
import useTasks from '../../hooks/useTasks';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import assignmentService from '../../services/assignmentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { TASK_STATUS, TASK_STATUS_LABELS, DARK_MODE_COLORS } from '../../utils/constants';

/**
 * Luật chuyển trạng thái cho employee
 * Chỉ: in_progress → done
 */
const EMPLOYEE_ALLOWED = { in_progress: ['done'] };

/**
 * Luật chuyển trạng thái cho manager / admin
 */
const MANAGER_ALLOWED = {
    todo:        ['in_progress', 'pending', 'done', 'cancelled'],
    in_progress: ['todo', 'done', 'pending', 'cancelled'],
    pending:     ['in_progress', 'todo', 'cancelled'],
    done:        ['in_progress', 'pending', 'cancelled'],
    cancelled:   ['todo', 'in_progress', 'pending'],
};

/**
 * KanbanBoard
 * - 5 cột: todo | in_progress | pending | done | cancelled
 * - Role-based drag & drop với confirmation dialogs
 * - Employee: chỉ in_progress→done; xin làm lại done→in_progress qua email
 * - Manager/Admin: full control với confirm dialogs
 */
const KanbanBoard = ({ filters, projects = [] }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const role = user?.role || 'employee';

    // Chuẩn hóa filter
    const normalizedFilters = {
        ...filters,
        project: filters?.project || filters?.project_id || '',
        project_id: undefined,
        limit: 200,
    };
    Object.keys(normalizedFilters).forEach(
        (k) => normalizedFilters[k] === undefined && delete normalizedFilters[k]
    );

    const { tasks, loading, error, refetch } = useTasks(normalizedFilters);
    const [activeTask, setActiveTask] = useState(null);
    const [localTasks, setLocalTasks] = useState([]);

    // State cho modal xác nhận status
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        task: null,
        fromStatus: null,
        toStatus: null,
    });

    // State cho modal cảnh báo thành viên không thuộc project
    const [warningModal, setWarningModal] = useState({
        isOpen: false,
        task: null,
        fromStatus: null,
        toStatus: null,
    });

    // State cho modal "employee xin làm lại"
    const [redoModal, setRedoModal] = useState({ isOpen: false, task: null });

    // State cho modal deadline conflict
    const [deadlineModal, setDeadlineModal] = useState({
        isOpen: false,
        task: null,
        pendingPayload: null,  // payload ban đầu muốn submit sau khi resolve conflict
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const columns = [
        { status: TASK_STATUS.TODO,        title: TASK_STATUS_LABELS[TASK_STATUS.TODO],        colorClass: 'text-gray-600 dark:text-gray-400' },
        { status: TASK_STATUS.IN_PROGRESS, title: TASK_STATUS_LABELS[TASK_STATUS.IN_PROGRESS], colorClass: 'text-blue-600 dark:text-blue-400' },
        { status: TASK_STATUS.PENDING,     title: TASK_STATUS_LABELS[TASK_STATUS.PENDING],     colorClass: 'text-yellow-600 dark:text-yellow-400' },
        { status: TASK_STATUS.DONE,        title: TASK_STATUS_LABELS[TASK_STATUS.DONE],        colorClass: 'text-green-600 dark:text-green-400' },
        { status: TASK_STATUS.CANCELLED,   title: TASK_STATUS_LABELS[TASK_STATUS.CANCELLED],   colorClass: 'text-red-600 dark:text-red-400' },
    ];

    useEffect(() => {
        const tasksWithRoles = tasks.map(task => {
            if (task.userRole) return task;

            // Tính toán userRole từ project.userRole
            const projId = task.project?._id || task.project?.id || task.project;
            const projectObj = projects.find(p => (p._id || p.id) === projId);

            let calculatedRole = 'employee';
            if (user?.role === 'admin' || (user?.roles && user.roles.includes('admin'))) {
                calculatedRole = 'admin';
            } else if (projectObj) {
                const isCreator = projectObj.userRole === 'manager' || projectObj.userRole === 'both';
                const isAssigned = task.members?.some(m => m && (m._id === user?._id || m.id === user?._id));
                if (isCreator && isAssigned) calculatedRole = 'both';
                else if (isCreator) calculatedRole = 'manager';
                else calculatedRole = 'employee';
            } else {
                const isAssigned = task.members?.some(m => m && (m._id === user?._id || m.id === user?._id));
                calculatedRole = 'employee';
            }
            return { ...task, userRole: calculatedRole };
        });

        // Lọc tasks: Đúng role của user đó
        // Nếu user chỉ có quyền employee trên task (không phải creator/manager và không phải admin),
        // thì họ chỉ được xem các công việc được phân công cho họ (họ là thành viên của task đó).
        const filteredTasks = tasksWithRoles.filter(task => {
            const isAdminUser = user?.role === 'admin' || (user?.roles && user.roles.includes('admin'));
            const isManagerOrAdmin = task.userRole === 'manager' || task.userRole === 'both' || isAdminUser;
            if (isManagerOrAdmin) return true;

            const isAssigned = task.members?.some(m => m && (m._id === user?._id || m.id === user?._id));
            return isAssigned;
        });

        setLocalTasks(filteredTasks);
    }, [tasks, projects, user]);

    const groupedTasks = columns.reduce((acc, col) => {
        acc[col.status] = localTasks.filter((t) => t.status === col.status);
        return acc;
    }, {});

    const handleDragStart = (event) => {
        const task = localTasks.find((t) => (t._id || t.id) === event.active.id);
        setActiveTask(task);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveTask(null);
        if (!over) return;

        const taskId = active.id;
        let newStatus = over.id;

        // Nếu thả lên task khác, lấy status của task đó
        if (!Object.values(TASK_STATUS).includes(newStatus)) {
            const targetTask = localTasks.find((t) => (t._id || t.id) === newStatus);
            if (targetTask) newStatus = targetTask.status;
            else return;
        }

        const task = localTasks.find((t) => (t._id || t.id) === taskId);
        if (!task || task.status === newStatus) return;

        const fromStatus = task.status;

        // ─── PHÂN QUYỀN THEO TASK ROLE ──────────────────────────────
        const isAdminUser = user?.role === 'admin' || (user?.roles && user.roles.includes('admin'));
        const isManagerOnTask = task.userRole === 'manager' || task.userRole === 'both' || isAdminUser;

        if (!isManagerOnTask) {
            const isAssigned = task.members?.some(m => m && (m._id === user?._id || m.id === user?._id));
            if (!isAssigned) {
                showToast('Bạn không có quyền thao tác trên công việc được phân cho người khác.', 'error');
                return;
            }
            const allowed = EMPLOYEE_ALLOWED[fromStatus] || [];
            if (!allowed.includes(newStatus)) {
                // Employee kéo done→in_progress: hiện modal xin làm lại
                if (fromStatus === 'done' && newStatus === 'in_progress') {
                    setRedoModal({ isOpen: true, task });
                    return;
                }
                showToast('Bạn không có quyền thực hiện thao tác này trên công việc này.', 'error');
                return;
            }
        } else {
            // Manager / Admin: kiểm tra transition hợp lệ
            const allowed = MANAGER_ALLOWED[fromStatus] || [];
            if (!allowed.includes(newStatus)) {
                showToast(`Không thể chuyển từ "${TASK_STATUS_LABELS[fromStatus] || fromStatus}" sang "${TASK_STATUS_LABELS[newStatus] || newStatus}".`, 'error');
                return;
            }
        }

        // ─── KIỂM TRA THÀNH VIÊN VÀ HIỆN MODAL XÁC NHẬN ───────────
        const isTargetTransition = 
            ((fromStatus === 'done' || fromStatus === 'cancelled') && (newStatus === 'in_progress' || newStatus === 'pending')) ||
            (fromStatus === 'cancelled' && newStatus === 'todo');

        if (isTargetTransition && isManagerOnTask) {
            const checkAndShowWarning = async () => {
                try {
                    const projectId = task.project?._id || task.project?.id || task.project;
                    const response = await projectService.getProjectMembers(projectId);
                    const projectMembers = response.data || [];
                    
                    let hasInvalidAssignee = false;
                    if (projectMembers.length > 0) {
                        const memberUserIds = projectMembers.map(m => (m.user?._id || m.user?.id || m.user).toString());
                        const assigneesNotInProject = (task.members || []).filter(member => {
                            const memberId = (member?._id || member?.id || member)?.toString();
                            const isEmployee = member?.role === 'employee' || (member?.roles && member.roles.includes('employee')) || (!member?.role && !member?.roles);
                            return memberId && isEmployee && !memberUserIds.includes(memberId);
                        });
                        
                        if (assigneesNotInProject.length > 0) {
                            hasInvalidAssignee = true;
                        }
                    }
                    
                    if (hasInvalidAssignee) {
                        setWarningModal({
                            isOpen: true,
                            task,
                            fromStatus,
                            toStatus: newStatus
                        });
                    } else {
                        setStatusModal({ isOpen: true, task, fromStatus, toStatus: newStatus });
                    }
                } catch (err) {
                    console.error("Lỗi khi kiểm tra thành viên dự án:", err);
                    setStatusModal({ isOpen: true, task, fromStatus, toStatus: newStatus });
                }
            };
            checkAndShowWarning();
        } else {
            setStatusModal({ isOpen: true, task, fromStatus, toStatus: newStatus });
        }
    };

    /**
     * Thực hiện API sau khi modal xác nhận
     * payload: { status, dueDate?, startDate? }
     */
    const handleConfirmStatusChange = useCallback(async (payload) => {
        const { task, toStatus } = statusModal;
        const taskId = task._id || task.id;

        // Kiểm tra deadline conflict trước khi gọi API
        if (payload.dueDate && task.project?.endDate) {
            const due = new Date(payload.dueDate);
            const projEnd = new Date(task.project.endDate);
            if (due > projEnd) {
                setStatusModal((s) => ({ ...s, isOpen: false }));
                setDeadlineModal({ isOpen: true, task, pendingPayload: payload });
                return;
            }
        }

        // Optimistic update
        setLocalTasks((prev) =>
            prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: payload.status } : t))
        );

        try {
            await taskService.updateTaskStatus(taskId, payload.status, payload.note, payload.startDate, payload.dueDate);
            // Nếu có cập nhật dueDate riêng (PUT task)
            if (payload.dueDate || payload.startDate) {
                await taskService.updateTask(taskId, {
                    ...(payload.dueDate && { dueDate: payload.dueDate }),
                    ...(payload.startDate && { startDate: payload.startDate }),
                });
            }
            showToast('Cập nhật trạng thái thành công!', 'success');
        } catch (err) {
            // Rollback
            setLocalTasks((prev) =>
                prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: task.status } : t))
            );
            const msg = err?.response?.data?.message || 'Không thể cập nhật trạng thái.';

            // Nếu backend báo deadline vượt project → mở conflict modal
            if (err?.response?.data?.code === 'TASK_DEADLINE_EXCEEDS_PROJECT') {
                setDeadlineModal({ isOpen: true, task, pendingPayload: payload });
            } else {
                showToast(msg, 'error');
            }
            throw err;
        }
    }, [statusModal, showToast]);

    /**
     * Employee xin làm lại task
     */
    const handleConfirmRedo = async () => {
        const { task } = redoModal;
        const taskId = task._id || task.id;
        try {
            await taskService.requestRedo(taskId);
            showToast('Yêu cầu làm lại đã gửi tới manager. Chờ manager xem xét.', 'info');
        } catch (err) {
            const msg = err?.response?.data?.message || 'Không thể gửi yêu cầu.';
            showToast(msg, 'error');
        } finally {
            setRedoModal({ isOpen: false, task: null });
        }
    };

    /**
     * Cập nhật deadline project khi có conflict
     */
    const handleUpdateProjectDeadline = async (newProjectEndDate) => {
        const { task, pendingPayload } = deadlineModal;
        const projectId = task.project?._id || task.project?.id;
        if (!projectId) throw new Error('Không tìm thấy dự án');

        // 1. Cập nhật project endDate
        await projectService.updateProject(projectId, { endDate: newProjectEndDate });

        // 2. Cập nhật task với deadline mới và status
        const taskId = task._id || task.id;
        setLocalTasks((prev) =>
            prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: pendingPayload.status } : t))
        );
        try {
            await taskService.updateTaskStatus(taskId, pendingPayload.status, pendingPayload.note);
            if (pendingPayload.dueDate || pendingPayload.startDate) {
                await taskService.updateTask(taskId, {
                    ...(pendingPayload.dueDate && { dueDate: pendingPayload.dueDate }),
                    ...(pendingPayload.startDate && { startDate: pendingPayload.startDate }),
                });
            }
            showToast('Đã cập nhật deadline dự án và trạng thái công việc!', 'success');
            // Refetch để lấy data mới
            if (typeof refetch === 'function') refetch();
        } catch (err) {
            setLocalTasks((prev) =>
                prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: task.status } : t))
            );
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className={DARK_MODE_COLORS.TEXT_TERTIARY}>Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${DARK_MODE_COLORS.NEAR_DEADLINE} text-red-600 dark:text-red-300 p-4 rounded`}>
                Lỗi: {error}
            </div>
        );
    }

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                    {columns.map((col) => (
                        <KanbanColumn
                            key={col.status}
                            status={col.status}
                            title={col.title}
                            colorClass={col.colorClass}
                            tasks={groupedTasks[col.status] || []}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <div className="rotate-3 opacity-90 transition-transform duration-150">
                            <KanbanCard task={activeTask} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Modal xác nhận đổi status (manager/admin + employee done→in_progress) */}
            <KanbanStatusModal
                isOpen={statusModal.isOpen}
                fromStatus={statusModal.fromStatus}
                toStatus={statusModal.toStatus}
                task={statusModal.task}
                onConfirm={handleConfirmStatusChange}
                onClose={() => setStatusModal({ isOpen: false, task: null, fromStatus: null, toStatus: null })}
            />

            {/* Modal employee xin làm lại */}
            {redoModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRedoModal({ isOpen: false, task: null })} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="mb-4">
                            <div className="p-2 w-fit rounded-xl bg-purple-50 border border-purple-200 mb-3">
                                <span className="text-2xl">🔄</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Xin làm lại công việc</h3>
                            <p className="text-sm text-gray-500 mt-1">Công việc đã hoàn thành</p>
                        </div>
                        {redoModal.task?.name && (
                            <div className="px-4 py-3 rounded-xl bg-purple-50 border border-purple-200 mb-4">
                                <p className="text-sm font-semibold text-gray-800">📋 {redoModal.task.name}</p>
                            </div>
                        )}
                        <p className="text-sm text-gray-600 mb-5">
                            Bạn muốn làm lại công việc này? Một email sẽ được gửi tới manager để xem xét.
                            <br />
                            <span className="text-orange-600 font-medium">Trạng thái sẽ chỉ thay đổi sau khi manager chấp thuận.</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRedoModal({ isOpen: false, task: null })}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmRedo}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-bold text-white"
                            >
                                Gửi yêu cầu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal xung đột deadline */}
            <DeadlineConflictModal
                isOpen={deadlineModal.isOpen}
                task={deadlineModal.task}
                onUpdateProject={handleUpdateProjectDeadline}
                onEditTaskDeadline={() => {
                    setDeadlineModal({ isOpen: false, task: null, pendingPayload: null });
                    showToast('Vui lòng nhập lại deadline công việc hợp lệ.', 'warning');
                }}
                onClose={() => setDeadlineModal({ isOpen: false, task: null, pendingPayload: null })}
            />

            {/* Modal cảnh báo thành viên không còn trong project */}
            {warningModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setWarningModal({ isOpen: false, task: null, fromStatus: null, toStatus: null })} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-yellow-100 dark:border-yellow-900/30 animate-in zoom-in-95 duration-200">
                        <div className="mb-4">
                            <div className="p-2 w-fit rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-250 dark:border-yellow-900/30 mb-3">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Cảnh báo thành viên</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                            Task này từng được thực hiện bởi 1 người không còn là thành viên của Project, nếu bạn muốn khôi phục/khôi phục và bắt đầu thì bạn phải xóa nhân viên đó ra khỏi phần lịch sử công việc của task
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setWarningModal({ isOpen: false, task: null, fromStatus: null, toStatus: null })}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={async () => {
                                    const { task, fromStatus, toStatus } = warningModal;
                                    setWarningModal({ isOpen: false, task: null, fromStatus: null, toStatus: null });
                                    
                                    try {
                                        const projectId = task.project?._id || task.project?.id || task.project;
                                        const projectMembersRes = await projectService.getProjectMembers(projectId);
                                        const projectMembers = projectMembersRes.data || [];
                                        
                                        if (projectMembers.length > 0) {
                                            const memberUserIds = projectMembers.map(m => (m.user?._id || m.user?.id || m.user).toString());
                                            
                                            const assignmentsRes = await assignmentService.getTaskAssignments(task._id || task.id);
                                            const assignments = assignmentsRes.data || [];
                                            
                                            const invalidAssignments = assignments.filter(a => {
                                                const u = a.assignee || {};
                                                const userId = (u._id || u.id || a.assignee)?.toString();
                                                const isEmployee = u.role === 'employee' || (u.roles && u.roles.includes('employee')) || (!u.role && !u.roles);
                                                return userId && isEmployee && !memberUserIds.includes(userId);
                                            });
                                            
                                            for (const a of invalidAssignments) {
                                                await assignmentService.deleteAssignment(a._id);
                                            }
                                            
                                            if (invalidAssignments.length > 0) {
                                                showToast(`Đã xóa ${invalidAssignments.length} nhân viên không thuộc dự án khỏi phần giao việc`, 'info');
                                                if (typeof refetch === 'function') refetch();
                                            }
                                        }
                                    } catch (err) {
                                        console.error("Lỗi khi xóa người được giao không hợp lệ:", err);
                                        showToast("Lỗi khi xóa nhân viên không thuộc dự án khỏi công việc.", "error");
                                    }

                                    setStatusModal({ isOpen: true, task, fromStatus, toStatus });
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-750 text-sm font-bold text-white transition-colors"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default KanbanBoard;