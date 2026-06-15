// src/components/tasks/TaskFilter.jsx
import React from 'react';
import { TASK_STATUS, TASK_STATUS_LABELS, PRIORITY, PRIORITY_LABELS, DARK_MODE_COLORS } from '../../utils/constants';
import Select from '../common/Select';
import DatePicker from '../common/DatePicker';
import Button from '../common/Button';
import { RefreshCcw } from 'lucide-react';

const TaskFilter = ({ 
    filters, 
    onFilterChange, 
    onApply, 
    onReset,
    showDeadlineFilter = false 
}) => {
    return (
        <div className={`${DARK_MODE_COLORS.BG_PRIMARY} p-6 rounded-xl shadow-lg border ${DARK_MODE_COLORS.BORDER_PRIMARY} transition-all duration-300`}>
            {/* Filter Row */}
            <div className={`grid ${showDeadlineFilter ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-6`}>
                {/* Status Filter */}
                <div className="animate-fade-in-fast" style={{ animationDelay: '0ms' }}>
                    <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                        Trạng thái
                    </label>
                    <Select
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        options={[
                            { value: '', label: 'Tất cả' },
                            ...Object.entries(TASK_STATUS).map(([key, value]) => ({
                                value: value,
                                label: TASK_STATUS_LABELS[value]
                            }))
                        ]}
                    />
                </div>

                {/* Priority Filter */}
                <div className="animate-fade-in-fast" style={{ animationDelay: '100ms' }}>
                    <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                        Ưu tiên
                    </label>
                    <Select
                        value={filters.priority}
                        onChange={(e) => onFilterChange('priority', e.target.value)}
                        options={[
                            { value: '', label: 'Tất cả' },
                            ...Object.entries(PRIORITY).map(([key, value]) => ({
                                value: value,
                                label: PRIORITY_LABELS[value]
                            }))
                        ]}
                    />
                </div>

                {/* Deadline From */}
                {showDeadlineFilter && (
                    <div className="animate-fade-in-fast" style={{ animationDelay: '200ms' }}>
                        <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                            Deadline từ
                        </label>
                        <DatePicker
                            value={filters.deadline_from}
                            onChange={(e) => onFilterChange('deadline_from', e.target.value)}
                        />
                    </div>
                )}

                {/* Deadline To */}
                {showDeadlineFilter && (
                    <div className="animate-fade-in-fast" style={{ animationDelay: '300ms' }}>
                        <label className={`block text-sm font-medium ${DARK_MODE_COLORS.TEXT_LABEL} mb-2`}>
                            Deadline đến
                        </label>
                        <DatePicker
                            value={filters.deadline_to}
                            onChange={(e) => onFilterChange('deadline_to', e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
                <Button
                    onClick={onApply}
                    className="transition-transform hover:scale-105 active:scale-95"
                >
                    Áp dụng
                </Button>
                <Button
                    onClick={onReset}
                    variant="outline"
                    className="transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <RefreshCcw size={16} />
                    Reset
                </Button>
            </div>

        </div>
    );
};

export default TaskFilter;