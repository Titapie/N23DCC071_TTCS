// components/stats/StatsOverview.jsx
import React from 'react';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiBarChart2, FiAlertCircle, FiCalendar } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatsCard from './StatsCard';
import { useOverviewStats } from '../../hooks/useStats';
import {CHART_COLORS, DARK_MODE_COLORS} from "../../utils/constants.js";

const StatsOverview = ({ mode }) => {
    const { data, loading, error, refresh } = useOverviewStats(mode);

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">Lỗi: {error}</p>
                <button
                    onClick={refresh}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    // Card tổng (lớn)
    const totalCard = {
        title: 'Tổng công việc',
        value: data?.totalTasks || 0,
        icon: <FiBarChart2 size={32} />,
        color: CHART_COLORS.INFO,
        subtitle: `${data?.completionRate || 0}% hoàn thành`,
        isLarge: true // ✅ Flag để tăng text size
    };

    // 4 cards còn lại (nhỏ)
    const detailCards = [
        {
            title: 'Công việc sắp tới',
            value: data?.todoTasks || 0,
            icon: <FiCalendar size={20} />,
            color: CHART_COLORS.SUCCESS,
        },
        {
            title: 'Đang làm',
            value: data?.inProgressTasks || 0,
            icon: <FiClock size={20} />,
            color: CHART_COLORS.PRIMARY,
        },
        {
            title: 'Đang chờ',
            value: data?.pendingTasks || 0,
            icon: <FiAlertTriangle size={20} />,
            color: CHART_COLORS.WARNING,
        },
        {
            title: 'Quá hạn',
            value: data?.overdueTasks || 0,
            icon: <FiAlertCircle size={20} />,
            color: CHART_COLORS.DANGER,
        }
    ];

    // ✅ Dữ liệu cho PieChart
    const pieData = [
        {
            name: 'Hoàn thành',
            value: data?.completedTasks || 0,
            color: CHART_COLORS.SUCCESS
        },
        {
            name: 'Đang làm',
            value: data?.inProgressTasks || 0,
            color: CHART_COLORS.PRIMARY
        },
        {
            name: 'Chưa hoàn thành',
            value: data?.failedTasks || 0,
            color: CHART_COLORS.WARNING
        },
        {
            name: 'Quá hạn',
            value: data?.overdueTasks || 0,
            color: CHART_COLORS.DANGER
        }
    ].filter(item => item.value > 0);

    const totalTasks = data?.totalTasks || 0;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700">
                    <p className="font-semibold text-gray-800 dark:text-white">{payload[0].name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {payload[0].value} tasks ({((payload[0].value / totalTasks) * 100).toFixed(1)}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold text-gray-800 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>Tổng quan</h2>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="bg-transparent dark:bg-transparent text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                >
                    <FiClock size={14} />
                    Làm mới
                </button>
            </div>

            {/* ✅ Layout: Card lớn | Grid 2x2 | PieChart */}
            <div className={`grid grid-cols-1 ${(mode === 'employee' || mode === 'manager') ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>

                {/* ✅ COL 1: Card tổng (LỚN) */}
                <div className="h-[420px]">
                    <div className="relative bg-indigo-600  rounded-2xl shadow-xl p-8 h-full flex flex-col justify-between overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">
                                        Dashboard Overview
                                    </p>
                                    <h3 className="text-white text-2xl font-bold">
                                        {totalCard.title}
                                    </h3>
                                </div>
                                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                                    {React.cloneElement(totalCard.icon, {
                                        className: 'text-white',
                                        size: 32
                                    })}
                                </div>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    <div className="w-40 h-20 bg-white/20 rounded-lg animate-pulse"></div>
                                    <div className="w-56 h-8 bg-white/20 rounded-lg animate-pulse"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <div className="flex items-baseline gap-3">
                                            <p className="text-white text-7xl font-black tracking-tight">
                                                {totalCard.value}
                                            </p>
                                            <p className="text-blue-100 text-xl font-medium">
                                                tasks
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>


                    </div>
                </div>

                {/* ✅ COL 2: Grid 2x2 (4 cards nhỏ) */}
                <div className="grid grid-cols-2 gap-4 ">
                    {detailCards.map((card, index) => (
                        <StatsCard
                            key={index}
                            title={card.title}
                            value={card.value}
                            icon={card.icon}
                            color={card.color}
                            isLoading={loading}
                        />
                    ))}
                </div>

                {/* ✅ COL 3: PieChart */}
                {mode !== 'employee' && mode !== 'manager' && (
                    <div className={` h-[420px] p-6 rounded-xl shadow-sm border dark:border-slate-600 ${DARK_MODE_COLORS.BG_CARD}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                            Phân bổ công việc
                        </h3>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                            </div>
                        ) : totalTasks === 0 ? (
                            <div className="flex justify-center items-center h-64 text-gray-400">
                                <div className="text-center">
                                    <FiBarChart2 size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>Chưa có dữ liệu</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) =>
                                                    `${(percent * 100).toFixed(0)}%`
                                                }
                                                outerRadius={80}
                                                innerRadius={0}
                                                paddingAngle={1}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Legend tự làm */}
                                <div className="mt-2 space-y-2">
                                    {pieData.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className={` ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{item.name}</span>
                                            </div>
                                            <span className={`font-semibold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsOverview;