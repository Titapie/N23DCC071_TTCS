// src/components/task/TaskSort.jsx
import React from 'react';
import Select from '../common/Select';

const TaskSort = ({ sortConfig, onSortChange }) => {
    return (
        <div className="animate-fade-in-fast">
            <Select
                value={`${sortConfig.sortKey}-${sortConfig.sortValue}`}
                onChange={(e) => {
                    const [key, value] = e.target.value.split('-');
                    onSortChange(key, value);
                }}
                options={[
                    { value: 'dueDate-ASC', label: 'Sort By: Deadline (Sớm nhất)' },
                    { value: 'dueDate-DESC', label: 'Sort By: Deadline (Muộn nhất)' },
                    { value: 'createdAt-DESC', label: 'Sort By: Mới nhất' },
                    { value: 'priority-DESC', label: 'Sort By: Ưu tiên cao' }
                ]}
                className="transition-all duration-200"
            />
        </div>
    );
};

export default TaskSort;