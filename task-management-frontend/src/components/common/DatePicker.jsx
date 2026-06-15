import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

export default function DatePicker({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = 'dd/mm/yyyy',
  hasError = false,
  ...props
}) {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  // Chuyển đổi định dạng từ YYYY-MM-DD sang DD/MM/YYYY
  const formatDisplayDate = (val) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const dateObj = new Date(val);
    if (!isNaN(dateObj.getTime())) {
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return val;
  };

  // Đồng bộ giá trị từ prop value sang state inputValue
  useEffect(() => {
    setInputValue(formatDisplayDate(value));
  }, [value]);

  const handleTextInputChange = (e) => {
    let inputVal = e.target.value;

    // Chỉ giữ lại số và dấu gạch chéo
    inputVal = inputVal.replace(/[^0-9/]/g, '');

    // Tự động định dạng mặt nạ: chèn dấu gạch chéo
    if (inputVal.length === 2 && !inputVal.includes('/')) {
      inputVal = inputVal + '/';
    } else if (inputVal.length === 5 && inputVal.split('/').length === 2) {
      inputVal = inputVal + '/';
    }

    // Giới hạn tối đa 10 ký tự
    if (inputVal.length > 10) {
      inputVal = inputVal.slice(0, 10);
    }

    setInputValue(inputVal);

    // Phát hiện ngày hợp lệ và cập nhật lên cha
    if (inputVal.length === 10) {
      const parts = inputVal.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          const yyyy = year;
          const mm = String(month + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const isoDate = `${yyyy}-${mm}-${dd}`;

          if (onChange) {
            onChange({
              target: {
                name: props.name || props.id,
                id: props.id,
                value: isoDate,
              },
            });
          }
        }
      }
    } else if (inputVal.length === 0) {
      if (onChange) {
        onChange({
          target: {
            name: props.name || props.id,
            id: props.id,
            value: '',
          },
        });
      }
    }
  };

  const handleKeyDown = (e) => {
    // Xử lý backspace xóa dấu '/' mượt mà
    if (e.key === 'Backspace') {
      const val = e.target.value;
      if (val.endsWith('/')) {
        e.preventDefault();
        setInputValue(val.slice(0, -2));
      }
    }
  };

  const handleIconClick = (e) => {
    e.stopPropagation();
    if (inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch (err) {
        inputRef.current.focus();
      }
    }
  };

  const handleNativeChange = (e) => {
    const val = e.target.value;
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div
      className={`relative flex items-center justify-between w-full rounded-xl border transition-all duration-200 text-sm
      ${
        hasError
          ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200'
          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white'
      }
      hover:border-slate-400 dark:hover:border-slate-500
      focus-within:border-indigo-500 dark:focus-within:border-indigo-400
      focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-900/50
      animate-fade-in-fast ${className}`}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleTextInputChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        disabled={props.disabled}
        className="w-full bg-transparent outline-none px-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <button
        type="button"
        onClick={handleIconClick}
        disabled={props.disabled}
        className="pr-4 pl-2 py-2 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
      >
        <Calendar size={16} className="pointer-events-none" />
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value || ''}
        onChange={handleNativeChange}
        onBlur={onBlur}
        {...props}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        style={{ colorScheme: 'light dark' }}
      />
    </div>
  );
}
