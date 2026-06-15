import { useEffect, useState } from "react";
import UserProfile from "../components/user/UserProfile";
import ProfileSkeleton from "../components/user/ProfileSkeleton";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Desktop Skeleton */}
        <div className="hidden lg:block">
          <div className="h-7 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-6 animate-pulse" />
          <ProfileSkeleton />
        </div>

        {/* Mobile Skeleton */}
        <div className="lg:hidden">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4 animate-pulse" />
          <ProfileSkeleton isMobile />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop */}
      <div className="hidden lg:block">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Profile
        </h2>
        <UserProfile />
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
          Profile
        </h2>
        <UserProfile isMobile />
      </div>
    </div>
  );
}
