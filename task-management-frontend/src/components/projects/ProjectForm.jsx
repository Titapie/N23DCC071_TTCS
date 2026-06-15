import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, User, FileText, Briefcase } from 'lucide-react';
import {DARK_MODE_COLORS} from "../../utils/constants.js";
import DatePicker from '../common/DatePicker';

const ProjectForm = ({
                         project = null,
                         onSubmit,
                         onCancel,
                         isLoading = false,
                         mode = 'create' // 'create' or 'edit'
                     }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: ''
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Load dữ liệu project khi edit
    useEffect(() => {
        if (project && mode === 'edit') {
            setFormData({
                name: project.name || '',
                description: project.description || '',
                startDate: project.startDate ? formatDateForInput(project.startDate) : '',
                endDate: project.endDate ? formatDateForInput(project.endDate) : ''
            });
        }
    }, [project, mode]);

    // Format date từ ISO string sang YYYY-MM-DD cho input[type="date"]
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Validation rules
    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || value.trim() === '') {
                    error = 'Tên dự án không được để trống';
                } else if (value.trim().length < 3) {
                    error = 'Tên dự án phải có ít nhất 3 ký tự';
                } else if (value.trim().length > 255) {
                    error = 'Tên dự án không được vượt quá 255 ký tự';
                }
                break;

            case 'description':
                if (value && value.length > 5000) {
                    error = 'Mô tả không được vượt quá 5000 ký tự';
                }
                break;

            case 'startDate':
                if (value && isNaN(Date.parse(value))) {
                    error = 'Ngày bắt đầu không hợp lệ';
                }
                // Check nếu có endDate và startDate > endDate
                if (value && formData.endDate && new Date(value) > new Date(formData.endDate)) {
                    error = 'Ngày bắt đầu không được sau ngày kết thúc';
                }
                break;

            case 'endDate':
                if (value && isNaN(Date.parse(value))) {
                    error = 'Ngày kết thúc không hợp lệ';
                }
                // Check nếu có startDate và endDate < startDate
                if (value && formData.startDate && new Date(value) < new Date(formData.startDate)) {
                    error = 'Ngày kết thúc không được trước ngày bắt đầu';
                }
                break;

            default:
                break;
        }

        return error;
    };

    // Validate toàn bộ form
    const validateForm = () => {
        const newErrors = {};

        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validate field khi user đang nhập (nếu đã touch)
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    // Handle blur - đánh dấu field đã được touch
    const handleBlur = (e) => {
        const { name } = e.target;

        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        // Validate field khi blur
        const error = validateField(name, formData[name]);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Đánh dấu tất cả fields đã touched
        const allTouched = Object.keys(formData).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setTouched(allTouched);

        // Validate toàn bộ form
        if (!validateForm()) {
            return;
        }

        // Chuẩn bị data để submit
        const submitData = { ...formData };

        // Convert empty strings to null cho dates
        if (!submitData.startDate) submitData.startDate = null;
        if (!submitData.endDate) submitData.endDate = null;

        // Gọi callback onSubmit
        await onSubmit(submitData);
    };

    return (
        <div className={`${DARK_MODE_COLORS.BG_CARD} border dark:border-slate-700 rounded-lg shadow-lg max-w-2xl mx-auto`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center">
                    <Briefcase className={`w-6 h-6 ${DARK_MODE_COLORS.TEXT_PRIMARY} mr-3`} />
                    <h2 className={`text-2xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                        {mode === 'create' ? 'Tạo dự án mới' : 'Chỉnh sửa dự án'}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-650 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    disabled={isLoading}
                >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Tên dự án */}
                <div>
                    <label htmlFor="name" className={`flex items-center text-sm font-medium ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-2`}>
                        <Briefcase className="w-4 h-4 mr-2" />
                        Tên dự án <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Nhập tên dự án..."
                        className={`w-full px-4 py-2 ${DARK_MODE_COLORS.BG_INPUT} ${DARK_MODE_COLORS.TEXT_PRIMARY} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.name && touched.name
                                ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                : 'border-gray-300 dark:border-slate-600'
                        }`}
                        disabled={isLoading}
                    />
                    {errors.name && touched.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <span className="mr-1">⚠</span>
                            {errors.name}
                        </p>
                    )}
                </div>

                {/* Mô tả */}
                <div>
                    <label htmlFor="description" className={`flex items-center text-sm font-medium ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-2`}>
                        <FileText className="w-4 h-4 mr-2" />
                        Mô tả dự án
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Nhập mô tả chi tiết về dự án..."
                        rows="4"
                            className={`w-full px-4 py-2 ${DARK_MODE_COLORS.BG_INPUT} ${DARK_MODE_COLORS.TEXT_PRIMARY} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                            errors.description && touched.description
                                ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                : 'border-gray-300 dark:border-slate-600'
                        }`}
                        disabled={isLoading}
                    />
                    {errors.description && touched.description && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                            <span className="mr-1">⚠</span>
                            {errors.description}
                        </p>
                    )}
                    <p className={`mt-1 text-xs ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                        {formData.description.length} / 5000 ký tự
                    </p>
                </div>

                {/* Ngày bắt đầu và kết thúc */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ngày bắt đầu */}
                    <div>
                        <label htmlFor="startDate" className={`flex items-center text-sm font-medium ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-2`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Ngày bắt đầu
                        </label>
                        <DatePicker
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            hasError={!!(errors.startDate && touched.startDate)}
                            disabled={isLoading}
                        />
                        {errors.startDate && touched.startDate && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                                <span className="mr-1">⚠</span>
                                {errors.startDate}
                            </p>
                        )}
                    </div>

                    {/* Ngày kết thúc */}
                    <div>
                        <label htmlFor="endDate" className={`flex items-center text-sm font-medium ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-2`}>
                            <Calendar className="w-4 h-4 mr-2 " />
                            Ngày kết thúc <span className="text-red-500 ml-1">*</span>
                        </label>
                        <DatePicker
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            hasError={!!(errors.endDate && touched.endDate)}
                            disabled={isLoading}
                        />
                        {errors.endDate && touched.endDate && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                                <span className="mr-1">⚠</span>
                                {errors.endDate}
                            </p>
                        )}
                    </div>
                </div>

                {/* Manager Info - chỉ hiển thị khi edit */}
                {mode === 'edit' && project && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium">Manager:</span>
                            <span className="ml-2">
                                {(() => {
                                    const mgr = project.createdBy || project.manager;
                                    if (mgr && typeof mgr === 'object') {
                                        return `${mgr.firstName || ''} ${mgr.lastName || ''}`.trim() || mgr.email || 'Chưa có';
                                    }
                                    return project.manager_name || 'Chưa có';
                                })()}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            * Manager được tự động gán khi tạo dự án và không thể thay đổi trực tiếp
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-red-500 dark:hover:bg-red-650 hover:text-white dark:hover:text-white hover:border-white transition-colors font-medium"
                        disabled={isLoading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {mode === 'create' ? 'Tạo dự án' : 'Lưu thay đổi'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectForm;