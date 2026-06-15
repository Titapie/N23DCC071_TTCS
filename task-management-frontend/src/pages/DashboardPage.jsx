// pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import StatsOverview from '../components/dashboard/StatsOverview';
import TaskStatusChart from '../components/dashboard/TaskStatusChart';
import ProgressChart from '../components/dashboard/ProgressChart';
import DeadlineAlert from '../components/dashboard/DeadlineAlert';
import RecentTask from '../components/dashboard/RecentTask';
import { DARK_MODE_COLORS } from "../utils/constants.js";
import { useAuth } from '../hooks/useAuth';
import { hasManagerRole, hasEmployeeRole } from '../utils/roleUtils';

const DashboardPage = () => {
    const { user } = useAuth();
    const isManager = hasManagerRole(user);
    const isEmployee = hasEmployeeRole(user);

    // Mặc định: nếu có cả hai, bắt đầu với 'manager', nếu chỉ có employee thì 'employee', nếu chỉ manager thì 'manager'
    const defaultMode = isManager && isEmployee ? 'manager' : (isManager ? 'manager' : 'employee');
    const [activeDashboardMode, setActiveDashboardMode] = useState(defaultMode);

    useEffect(() => {
        if (isManager && isEmployee) {
            setActiveDashboardMode('manager');
        } else if (isManager) {
            setActiveDashboardMode('manager');
        } else {
            setActiveDashboardMode('employee');
        }
    }, [user, isManager, isEmployee]);

    return (
        <div className={`w-full md:p-6 space-y-6 ${DARK_MODE_COLORS.BG_SECONDARY}`}>
            {/* Header info / Role switcher */}
            {isManager && isEmployee ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm gap-4 transition-all duration-300">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span>Góc nhìn Dashboard</span>
                            <span className="text-xs font-normal px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100/50 dark:border-indigo-800/50">
                                Song song 2 vai trò
                            </span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Bạn đang truy cập với vai trò Quản lý &amp; Nhân viên. Chuyển chế độ để xem dữ liệu tương ứng.
                        </p>
                    </div>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/40 dark:border-slate-800 self-stretch md:self-auto justify-stretch">
                        <button
                            onClick={() => setActiveDashboardMode('manager')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                activeDashboardMode === 'manager'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none transform scale-[1.02]'
                                    : 'bg-transparent dark:bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            💼 Chế độ Quản lý
                        </button>
                        <button
                            onClick={() => setActiveDashboardMode('employee')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                activeDashboardMode === 'employee'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none transform scale-[1.02]'
                                    : 'bg-transparent dark:bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            👨‍💻 Chế độ Nhân viên
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Dashboard {isManager ? 'Quản lý' : 'Nhân viên'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Chào mừng bạn quay trở lại. Xem nhanh tiến trình và công việc của bạn bên dưới.
                    </p>
                </div>
            )}

            {/* Tổng quan - Card lớn và Grid 2x2 */}
            <StatsOverview showPieChart={false} mode={activeDashboardMode} />

            {/* Layout chính: 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái: ProgressChart và RecentTask */}
                <div className="lg:col-span-2 space-y-6">
                    <ProgressChart mode={activeDashboardMode} />
                    <RecentTask mode={activeDashboardMode} />
                </div>

                {/* Cột phải: PieChart (từ StatsOverview), TaskStatusChart, và DeadlineAlert */}
                <div className="lg:col-span-1 space-y-6">
                    <TaskStatusChart mode={activeDashboardMode} />
                    <DeadlineAlert mode={activeDashboardMode} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;