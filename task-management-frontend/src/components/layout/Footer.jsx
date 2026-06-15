export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 border-t border-slate-100 dark:border-slate-800 transition-colors">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        {/* Bản quyền */}
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
          © {currentYear}{" "}
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
            AA
          </span>
          . All rights reserved.
        </p>

        {/* Links phụ */}
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
          >
            Chính sách bảo mật
          </a>
          <a
            href="#"
            className="text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
          >
            Điều khoản dịch vụ
          </a>
        </div>
      </div>
    </footer>
  );
}
