export default function ProfileSkeleton({ isMobile = false }) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-6 animate-pulse ${
        isMobile ? "" : "max-w-xl"
      }`}
    >
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>

      {/* Info lines */}
      <div className="space-y-3">
        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>

      {/* Button */}
      <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  );
}
