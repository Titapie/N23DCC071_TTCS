import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, Ban, RotateCcw } from 'lucide-react';

// ─── Map status → tên tiếng Việt ────────────────────────────
const STATUS_VI = {
  todo:        'Chưa bắt đầu',
  in_progress: 'Đang làm',
  pending:     'Đang chờ',
  done:        'Đã hoàn thành',
  cancelled:   'Đã hủy',
};

const STATUS_ICONS = {
  todo:        <Clock className="w-5 h-5 text-gray-500" />,
  in_progress: <Clock className="w-5 h-5 text-blue-500" />,
  pending:     <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  done:        <CheckCircle className="w-5 h-5 text-green-500" />,
  cancelled:   <Ban className="w-5 h-5 text-red-500" />,
};

// ─── Config nội dung cho từng transition ─────────────────────
const getTransitionConfig = (from, to) => {
  const key = `${from}→${to}`;
  const configs = {
    'in_progress→done':      { title: 'Xác nhận hoàn thành', body: 'Bạn có chắc muốn đánh dấu công việc này là đã hoàn thành?', confirm: 'Hoàn thành', variant: 'success', needsDates: false },
    'done→in_progress':      { title: 'Mở lại công việc',    body: 'Bạn có chắc muốn mở lại công việc này để tiếp tục thực hiện?', confirm: 'Mở lại', variant: 'blue', needsDates: true, dateLabel: 'Deadline mới (nếu cần)' },
    'todo→in_progress':      { title: 'Bắt đầu công việc',   body: 'Xác nhận chuyển công việc sang "Đang làm"? Ngày bắt đầu sẽ được ghi nhận là hôm nay.', confirm: 'Bắt đầu', variant: 'blue', needsDates: false },
    'todo→pending':          { title: 'Tạm hoãn công việc',  body: 'Xác nhận tạm hoãn công việc này? Nhân viên sẽ được thông báo qua email.', confirm: 'Tạm hoãn', variant: 'warning', needsDates: false },
    'in_progress→pending':   { title: 'Tạm hoãn công việc',  body: 'Xác nhận tạm hoãn công việc đang thực hiện? Nhân viên sẽ được thông báo qua email.', confirm: 'Tạm hoãn', variant: 'warning', needsDates: false },
    'done→pending':          { title: 'Hoãn công việc đã hoàn thành', body: 'Xác nhận chuyển công việc đã hoàn thành sang trạng thái hoãn? Nhân viên sẽ được thông báo.', confirm: 'Xác nhận', variant: 'warning', needsDates: false },
    'pending→in_progress':   { title: 'Tiếp tục công việc',  body: 'Xác nhận tiếp tục công việc đang bị hoãn? Nhân viên sẽ được thông báo qua email.', confirm: 'Tiếp tục', variant: 'blue', needsDates: true, dateLabel: 'Deadline mới (nếu cần cập nhật)' },
    'pending→todo':          { title: 'Chuyển về chưa bắt đầu', body: 'Xác nhận chuyển công việc về trạng thái "Chưa bắt đầu"?', confirm: 'Xác nhận', variant: 'gray', needsDates: true, dateLabel: 'Deadline mới' },
    'in_progress→todo':      { title: 'Quay lại chưa bắt đầu', body: 'Xác nhận chuyển công việc đang làm về trạng thái "Chưa bắt đầu"? Nhân viên sẽ được thông báo.', confirm: 'Xác nhận', variant: 'gray', needsDates: true, dateLabel: 'Deadline mới' },
    'todo→done':             { title: 'Hoàn thành ngay', body: '⚠️ Công việc chưa bắt đầu. Bạn có chắc muốn chuyển thẳng sang "Đã hoàn thành"?', confirm: 'Hoàn thành', variant: 'success', needsDates: false },
    'todo→cancelled':        { title: 'Hủy công việc',   body: 'Xác nhận hủy công việc này? Hành động này sẽ thông báo cho nhân viên qua email.', confirm: 'Hủy', variant: 'danger', needsDates: false },
    'in_progress→cancelled': { title: 'Hủy công việc',   body: 'Xác nhận hủy công việc đang thực hiện? Nhân viên sẽ được thông báo qua email.', confirm: 'Hủy', variant: 'danger', needsDates: false },
    'pending→cancelled':     { title: 'Hủy công việc',   body: 'Xác nhận hủy công việc đang bị hoãn?', confirm: 'Hủy', variant: 'danger', needsDates: false },
    'done→cancelled':        { title: 'Hủy công việc đã hoàn thành', body: 'Xác nhận hủy công việc này?', confirm: 'Hủy', variant: 'danger', needsDates: false },
    'cancelled→todo':        { title: 'Khôi phục công việc', body: 'Khôi phục công việc về trạng thái "Chưa bắt đầu"?', confirm: 'Khôi phục', variant: 'gray', needsDates: true, dateLabel: 'Deadline mới' },
    'cancelled→in_progress': { title: 'Khôi phục và bắt đầu', body: 'Khôi phục công việc và chuyển sang "Đang làm"?', confirm: 'Khôi phục', variant: 'blue', needsDates: true, dateLabel: 'Deadline mới' },
    'cancelled→pending':     { title: 'Khôi phục về hoãn',    body: 'Khôi phục công việc về trạng thái "Đang chờ"?', confirm: 'Khôi phục', variant: 'warning', needsDates: false },
  };

  return configs[key] || {
    title: 'Xác nhận đổi trạng thái',
    body: `Chuyển từ "${STATUS_VI[from]}" sang "${STATUS_VI[to]}"?`,
    confirm: 'Xác nhận',
    variant: 'blue',
    needsDates: false,
  };
};

const VARIANT_STYLES = {
  success: { btn: 'bg-green-600 hover:bg-green-700',  icon: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/30', bg: 'bg-green-50 dark:bg-green-900/10' },
  blue:    { btn: 'bg-blue-600 hover:bg-blue-700',    icon: 'text-blue-600 dark:text-blue-400',  border: 'border-blue-200 dark:border-blue-900/30',  bg: 'bg-blue-50 dark:bg-blue-900/10'  },
  warning: { btn: 'bg-yellow-500 hover:bg-yellow-600',icon: 'text-yellow-600 dark:text-yellow-400',border: 'border-yellow-200 dark:border-yellow-900/30',bg: 'bg-yellow-50 dark:bg-yellow-900/10'},
  danger:  { btn: 'bg-red-600 hover:bg-red-700',      icon: 'text-red-600 dark:text-red-400',   border: 'border-red-200 dark:border-red-900/30',   bg: 'bg-red-50 dark:bg-red-900/10'   },
  gray:    { btn: 'bg-gray-600 hover:bg-gray-700',    icon: 'text-gray-600 dark:text-gray-400',  border: 'border-gray-200 dark:border-slate-700',  bg: 'bg-gray-50 dark:bg-slate-800'  },
};

/**
 * KanbanStatusModal
 * Props:
 *   isOpen: bool
 *   fromStatus: string (backend enum)
 *   toStatus: string (backend enum)
 *   task: { _id, name, dueDate, project: { endDate } }
 *   onConfirm: (payload: { status, dueDate?, startDate? }) => Promise<void>
 *   onClose: () => void
 */
const KanbanStatusModal = ({ isOpen, fromStatus, toStatus, task, onConfirm, onClose }) => {
  const [newStartDate, setNewStartDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !fromStatus || !toStatus) return null;

  const config = getTransitionConfig(fromStatus, toStatus);
  const styles = VARIANT_STYLES[config.variant] || VARIANT_STYLES.blue;

  const projectStartDate = task?.project?.startDate
    ? new Date(task.project.startDate).toISOString().split('T')[0]
    : '';

  const projectEndDate = task?.project?.endDate
    ? new Date(task.project.endDate).toISOString().split('T')[0]
    : '';

  const isRevertingToTodo = toStatus === 'todo' && (fromStatus === 'in_progress' || fromStatus === 'pending' || fromStatus === 'cancelled');

  const handleConfirm = async () => {
    setDateError('');

    if (isRevertingToTodo) {
      const startVal = newStartDate ? new Date(newStartDate) : null;
      const dueVal = newDueDate ? new Date(newDueDate) : null;

      // Chỉ validate khi có nhập giá trị
      if (startVal) {
        if (projectStartDate && startVal < new Date(projectStartDate)) {
          setDateError(`Ngày bắt đầu không được trước ngày bắt đầu dự án (${new Date(projectStartDate).toLocaleDateString('vi-VN')}).`);
          return;
        }
      }

      if (dueVal) {
        if (projectEndDate && dueVal > new Date(projectEndDate)) {
          setDateError(`Deadline không được vượt quá deadline dự án (${new Date(projectEndDate).toLocaleDateString('vi-VN')}).`);
          return;
        }
      }

      if (startVal && dueVal) {
        if (startVal > dueVal) {
          setDateError('Ngày bắt đầu không được sau deadline.');
          return;
        }
      } else if (startVal && !dueVal && task?.dueDate) {
        // So sánh với deadline hiện tại của task nếu có
        if (startVal > new Date(task.dueDate)) {
          setDateError('Ngày bắt đầu không được sau deadline hiện tại của công việc.');
          return;
        }
      } else if (!startVal && dueVal && task?.startDate) {
        // So sánh với ngày bắt đầu hiện tại của task nếu có
        if (new Date(task.startDate) > dueVal) {
          setDateError('Ngày bắt đầu hiện tại của công việc không được sau deadline mới.');
          return;
        }
      }
    } else {
      // Validate nếu có nhập ngày mới
      if (config.needsDates && newDueDate) {
        const due = new Date(newDueDate);
        const today = new Date(); today.setHours(0,0,0,0);
        if (due < today) {
          setDateError('Deadline không được trước ngày hôm nay.');
          return;
        }
        if (projectEndDate && due > new Date(projectEndDate)) {
          setDateError(`Deadline không được vượt quá deadline dự án (${new Date(projectEndDate).toLocaleDateString('vi-VN')}).`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = { status: toStatus };
      if (isRevertingToTodo) {
        if (newStartDate) payload.startDate = newStartDate;
        if (newDueDate) payload.dueDate = newDueDate;
      } else if (config.needsDates && newDueDate) {
        payload.dueDate = newDueDate;
      }
      await onConfirm(payload);
      setNewStartDate('');
      setNewDueDate('');
      onClose();
    } catch (err) {
      // lỗi sẽ được xử lý ở KanbanBoard
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewStartDate('');
    setNewDueDate('');
    setDateError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`flex items-center gap-3`}>
            <div className={`p-2 rounded-xl ${styles.bg} ${styles.border} border`}>
              {STATUS_ICONS[toStatus]}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{config.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {STATUS_VI[fromStatus]} → {STATUS_VI[toStatus]}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task name */}
        {task?.name && (
          <div className={`px-4 py-3 rounded-xl ${styles.bg} ${styles.border} border mb-4`}>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">📋 {task.name}</p>
            {task.project?.name && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📁 {task.project.name}</p>
            )}
          </div>
        )}

        {/* Body */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{config.body}</p>

        {/* Date picker nếu cần */}
        {config.needsDates && (
          <div className="space-y-4 mb-4">
            {isRevertingToTodo ? (
              <>
                {/* Ngày bắt đầu mới */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-semibold">
                    Ngày bắt đầu mới
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    min={projectStartDate || undefined}
                    max={projectEndDate || undefined}
                    onChange={(e) => { setNewStartDate(e.target.value); setDateError(''); }}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                  {projectStartDate && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Tối thiểu: {new Date(projectStartDate).toLocaleDateString('vi-VN')} (ngày bắt đầu dự án)
                    </p>
                  )}
                </div>

                {/* Deadline mới */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-semibold">
                    Deadline mới
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    min={newStartDate || projectStartDate || undefined}
                    max={projectEndDate || undefined}
                    onChange={(e) => { setNewDueDate(e.target.value); setDateError(''); }}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                  {projectEndDate && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Tối đa: {new Date(projectEndDate).toLocaleDateString('vi-VN')} (deadline dự án)
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {config.dateLabel}
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  max={projectEndDate || undefined}
                  onChange={(e) => { setNewDueDate(e.target.value); setDateError(''); }}
                  className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                {projectEndDate && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Tối đa: {new Date(projectEndDate).toLocaleDateString('vi-VN')} (deadline dự án)
                  </p>
                )}
              </div>
            )}

            {dateError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{dateError}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 ${styles.btn}`}
          >
            {submitting ? 'Đang xử lý...' : config.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KanbanStatusModal;
