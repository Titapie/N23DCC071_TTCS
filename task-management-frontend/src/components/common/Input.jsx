// src/components/common/Input.jsx
import React, { useRef, useEffect } from 'react';

const Input = ({ 
  type = "text", 
  value, 
  onChange, 
  placeholder = "",
  className = "",
  multiline = false,
  rows = 4,
  variant = "adaptive", // Mặc định là adaptive mode
  ...props 
}) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, multiline]);

  // Light mode - luôn sáng
  const lightClassName = `w-full px-4 py-2.5 rounded-xl border 
    border-slate-300 
    bg-white 
    text-gray-900 
    text-sm outline-none 
    placeholder-gray-400 
    focus:border-indigo-500 
    focus:ring-2 focus:ring-indigo-200 
    transition-all duration-200
    hover:border-slate-400 
    animate-fade-in-fast`;

  // Adaptive mode - có thể chuyển dark-light
  const adaptiveClassName = `w-full px-4 py-2.5 rounded-xl border 
    border-slate-300 
    bg-white 
    text-gray-900 
    text-sm outline-none 
    placeholder-gray-400 
    focus:border-indigo-500 
    focus:ring-2 focus:ring-indigo-200 
    transition-all duration-200
    hover:border-slate-400 
    animate-fade-in-fast
    dark:border-slate-600 
    dark:bg-slate-700 
    dark:text-white 
    dark:placeholder-slate-400 
    dark:focus:border-indigo-400 
    dark:focus:ring-indigo-900/50 
    dark:hover:border-slate-500`;

  const baseClassName = variant === "light" ? lightClassName : adaptiveClassName;
  const finalClassName = `${baseClassName} ${className}`;

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`${finalClassName} resize-none`}
        {...props}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={finalClassName}
      {...props}
    />
  );
};

export default Input;