// src/utils/dateHelpers.js

/**
 * Format date theo định dạng vi-VN (dd/mm/yyyy)
 * @param {string|Date} date - Ngày cần format
 * @returns {string} - Ngày đã format hoặc 'Chưa có'
 */
export const formatDate = (date) => {
    if (!date) return 'Chưa có';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Chưa có';
    return dateObj.toLocaleDateString('vi-VN');
};

/**
 * Kiểm tra deadline gần (≤3 ngày)
 * @param {string|Date} deadline - Ngày deadline
 * @returns {boolean}
 */
export const isDeadlineSoon = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) return false;
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
};

/**
 * Tính thời gian còn lại đến deadline
 * @param {string|Date} endDate - Ngày kết thúc
 * @returns {string|null} - Thời gian còn lại hoặc null
 */
export const getTimeLeft = (endDate) => {
    if (!endDate) return null;
    
    const now = new Date();
    const deadline = new Date(endDate);
    
    // Kiểm tra valid date
    if (isNaN(deadline.getTime())) return null;
    
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays} Days Left`;
    if (diffHours > 0) return `${diffHours} Hour${diffHours > 1 ? 's' : ''}`;
    return 'Overdue';
};

/**
 * Kiểm tra task có trong khoảng thời gian time limit không
 * @param {string|Date} endDate - Ngày kết thúc
 * @param {number} daysLimit - Số ngày giới hạn (mặc định 7)
 * @returns {boolean}
 */
export const isWithinTimeLimit = (endDate, daysLimit = 7) => {
    if (!endDate) return false;
    
    const now = new Date();
    const deadline = new Date(endDate);
    
    if (isNaN(deadline.getTime())) return false;
    
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    return daysLeft > 0 && daysLeft <= daysLimit;
};

/**
 * So sánh ngày có nằm trong khoảng không
 * @param {string|Date} date - Ngày cần kiểm tra
 * @param {string|Date} fromDate - Ngày bắt đầu
 * @param {string|Date} toDate - Ngày kết thúc
 * @returns {boolean}
 */
export const isDateInRange = (date, fromDate, toDate) => {
    if (!date) return false;
    
    const checkDate = new Date(date);
    if (isNaN(checkDate.getTime())) return false;
    
    checkDate.setHours(0, 0, 0, 0);

    if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (checkDate < from) return false;
    }

    if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (checkDate > to) return false;
    }

    return true;
};

/**
 * Format date sang yyyy-mm-dd
 * @param {Date} date 
 * @returns {string}
 */
export const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};