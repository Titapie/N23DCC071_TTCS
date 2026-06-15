import React from 'react';
import { ShieldX, X } from 'lucide-react';

/**
 * NoPermissionModal — Hiện khi user không có quyền thực hiện thao tác
 * Props:
 *   isOpen: bool
 *   message: string (mặc định: "Bạn không có quyền thực hiện thao tác này.")
 *   onClose: () => void
 */
const NoPermissionModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-700">
              <ShieldX className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Không có quyền</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-slate-400 mb-5 leading-relaxed">
          {message || 'Bạn không có quyền thực hiện thao tác này.'}
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default NoPermissionModal;
