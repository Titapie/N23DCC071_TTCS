// src/pages/TaskDetailPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TaskDetail from '../components/task/TaskDetail';
import taskService from '../services/taskService';
import TASK_ROUTES from '../routes/taskRoutes';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { ToastContext } from '../context/ToastContext';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

const TaskDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useContext(ToastContext);
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal xác nhận xóa
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const data = await taskService.getTaskById(id);
                // Backend trả về { success, message, data: task }
                setTask(data.task || data.data || data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    const handleEdit = () => {
        navigate(TASK_ROUTES.EDIT(id));
    };

    // Mở modal xác nhận thay vì window.confirm
    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        try {
            setDeleting(true);
            await taskService.deleteTask(id);
            showToast('Xóa công việc thành công!', 'success');
            navigate(TASK_ROUTES.LIST);
        } catch (err) {
            showToast('Lỗi: ' + (err.message || 'Không thể xóa công việc'), 'error');
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center animate-fade-in">
                <div className="text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Có lỗi xảy ra</p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Button
                        onClick={() => navigate(TASK_ROUTES.LIST)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95"
                    >
                        Quay lại danh sách task
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <TaskDetail task={task} onEdit={handleEdit} onDelete={handleDelete} />

            {/* Modal xác nhận xóa task */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
                        onClick={() => !deleting && setShowDeleteConfirm(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200 dark:border-slate-700 animate-scale-in">
                        {/* Icon cảnh báo */}
                        <div className="flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full mx-auto mb-4">
                            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                            Xác nhận xóa công việc
                        </h3>
                        <p className="text-gray-600 dark:text-slate-400 text-center mb-1">
                            Bạn có chắc muốn xóa công việc:
                        </p>
                        <p className="text-gray-900 dark:text-white font-semibold text-center mb-2">
                            "{task?.name}"
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                            <p className="text-sm text-red-700 dark:text-red-300 text-center">
                                ⚠️ Hành động này không thể hoàn tác. Tất cả phân công liên quan cũng sẽ bị xóa.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang xóa...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Xóa công việc
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskDetailPage;