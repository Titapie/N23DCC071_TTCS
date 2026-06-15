import { createContext, useState, useEffect, useCallback } from "react";
import Toast from "../components/common/Toast";

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const hideToast = () => setToast(null);

  // Lắng nghe sự kiện từ các file không phải React (như api.js)
  useEffect(() => {
    const handleToastEvent = (e) => {
      const { message, type } = e.detail;
      showToast(message, type);
    };

    window.addEventListener("toast-notification", handleToastEvent);
    return () => {
      window.removeEventListener("toast-notification", handleToastEvent);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </ToastContext.Provider>
  );
}
