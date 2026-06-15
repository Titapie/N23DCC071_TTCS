export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base = "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95";

  const variants = {
    primary: "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
    outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed",
    danger: "bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button {...props} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
