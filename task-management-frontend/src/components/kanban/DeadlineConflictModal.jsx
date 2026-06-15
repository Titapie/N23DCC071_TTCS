import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import DatePicker from '../common/DatePicker';

/**
 * DeadlineConflictModal
 * Hiện khi task.dueDate > project.endDate
 *
 * Props:
 *   isOpen: bool
 *   task: { _id, name, dueDate, project: { _id, name, endDate } }
 *   onUpdateProject: (newProjectEndDate: string) => Promise<void>
 *   onEditTaskDeadline: () => void   — đóng modal, quay lại edit task
 *   onClose: () => void
 */
const DeadlineConflictModal = ({
  isOpen,
  task,
  onUpdateProject,
  onEditTaskDeadline,
  onClose,
}) => {
  const [choice, setChoice] = useState(null); // 'project' | 'task'
  const [newProjectEnd, setNewProjectEnd] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const taskDueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('vi-VN')
    : '—';
  const projectEndDateStr = task.project?.endDate
    ? new Date(task.project.endDate).toLocaleDateString('vi-VN')
    : '—';

  // Deadline task phải là tối thiểu cho project end mới
  const minProjectEnd = task.dueDate
    ? new Date(task.dueDate).toISOString().split('T')[0]
    : '';

  const handleClose = () => {
    setChoice(null);
    setNewProjectEnd('');
    setError('');
    onClose();
  };

  const handleConfirmUpdateProject = async () => {
    setError('');
    if (!newProjectEnd) {
      setError('Vui lòng nhập deadline mới cho dự án.');
      return;
    }
    if (task.dueDate && new Date(newProjectEnd) < new Date(task.dueDate)) {
      setError(
        `Deadline dự án phải lớn hơn hoặc bằng deadline công việc (${taskDueDateStr}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onUpdateProject(newProjectEnd);
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật dự án.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = () => {
    handleClose();
    onEditTaskDeadline();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Deadline vượt quá dự án</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cần giải quyết xung đột thời gian</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict info */}
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl p-4 mb-5">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Deadline công việc <strong>{task.name}</strong> đang vượt quá deadline của dự án{' '}
            <strong>{task.project?.name}</strong>:
          </p>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-orange-200 dark:border-orange-900/30">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-gray-600 dark:text-gray-400">Deadline task:</span>
              <span className="font-bold text-orange-600">{taskDueDateStr}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-red-200 dark:border-red-900/30">
              <Calendar className="w-4 h-4 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Deadline dự án:</span>
              <span className="font-bold text-red-600">{projectEndDateStr}</span>
            </div>
          </div>
        </div>

        {/* Lựa chọn */}
        {choice === null && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Bạn muốn:</p>

            <button
              onClick={() => setChoice('project')}
              className="w-full text-left px-4 py-3.5 rounded-xl border-2 border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-200">Cập nhật deadline dự án</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Mở rộng deadline dự án để phù hợp với task</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleEditTask}
              className="w-full text-left px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg group-hover:bg-gray-200 dark:group-hover:bg-slate-600 transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">Sửa lại deadline công việc</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Quay lại và nhập deadline task hợp lệ (≤ {projectEndDateStr})</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Form cập nhật deadline project */}
        {choice === 'project' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Deadline mới của dự án <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={newProjectEnd}
                min={minProjectEnd}
                onChange={(e) => { setNewProjectEnd(e.target.value); setError(''); }}
                hasError={!!error}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Phải ≥ deadline task: <strong>{taskDueDateStr}</strong>
              </p>
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-3 mb-4 text-xs text-blue-700 dark:text-blue-300">
              💡 Tất cả thành viên dự án sẽ nhận email thông báo thay đổi deadline.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setChoice(null); setError(''); }}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmUpdateProject}
                disabled={submitting || !newProjectEnd}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white transition-colors disabled:opacity-60"
              >
                {submitting ? 'Đang cập nhật...' : 'Cập nhật dự án'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlineConflictModal;
