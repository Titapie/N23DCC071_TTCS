import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

const TaskSearch = ({ onSearch, placeholder = "Tìm kiếm task..." }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        onSearch(searchTerm);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClear = () => {
        setSearchTerm('');
        onSearch('');
    };

    return (
        <div className="mb-4">
            <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border rounded px-4 py-2 transition-all duration-200 focus:animate-scale-in"
                />
                <Button
                    onClick={handleSearch}
                    className="px-4 py-2 text-white rounded transition-transform hover:scale-105"
                >
                    Tìm
                </Button>
            </div>
        </div>
    );
};

export default TaskSearch;