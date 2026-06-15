/**
 * Khi bật: vào mọi trang không cần đăng nhập; /login vẫn mở được để xem giao diện.
 * Tắt: đặt trong .env → VITE_BYPASS_AUTH=false
 */
export const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH !== "false";
