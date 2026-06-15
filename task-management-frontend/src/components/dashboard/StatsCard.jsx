// components/stats/StatsCard.jsx
import React from 'react';
import {CHART_COLORS, DARK_MODE_COLORS} from '../../utils/constants';

const StatsCard = ({
                       title,
                       value,
                       icon,
                       color = 'primary',
                       change,
                       subtitle,
                       isLoading = false,
                       className = ''
                   }) => {
    const colorClasses = {
        primary: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-100 dark:border-blue-900/30',
            hex: CHART_COLORS.PRIMARY
        },
        success: {
            bg: 'bg-green-50 dark:bg-green-950/30',
            text: 'text-green-600 dark:text-green-400',
            border: 'border-green-100 dark:border-green-900/30',
            hex: CHART_COLORS.SUCCESS
        },
        danger: {
            bg: 'bg-red-50 dark:bg-red-950/30',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-100 dark:border-red-900/30',
            hex: CHART_COLORS.DANGER
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-950/30',
            text: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-100 dark:border-yellow-900/30',
            hex: CHART_COLORS.WARNING
        },
        info: {
            bg: 'bg-purple-50 dark:bg-purple-950/30',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-100 dark:border-purple-900/30',
            hex: CHART_COLORS.INFO
        },
        gray: {
            bg: 'bg-gray-50 dark:bg-slate-700/50',
            text: 'text-gray-600 dark:text-slate-400',
            border: 'border-gray-100 dark:border-slate-700',
            hex: CHART_COLORS.GRAY
        }
    };

    if (isLoading) {
        return (
            <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 animate-pulse ${className}`}>
                <div className="flex justify-between items-start mb-5">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-md w-24"></div>
                    <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
                <div className="h-9 bg-gray-200 dark:bg-slate-700 rounded-md w-20 mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-md w-32"></div>
            </div>
        );
    }

    const colors = colorClasses[color] || colorClasses.primary;

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-650 transition-all duration-300 group ${className}`}>
            <div className="flex justify-between items-start mb-5">
                <h3 className={`text-sm ${DARK_MODE_COLORS.TEXT_PRIMARY} font-medium  leading-snug`}>{title}</h3>
                {icon && (
                    <div className={`p-2.5 rounded-lg ${colors.bg} ${colors.text} group-hover:scale-110 transition-transform duration-300`}>
                        {React.cloneElement(icon, {
                            className: `w-5 h-5 ${colors.text}`,
                            size: 20
                        })}
                    </div>
                )}
            </div>

            <div className="flex items-baseline gap-3 mb-2">
                <p className={`text-3xl ${DARK_MODE_COLORS.TEXT_PRIMARY} font-bold tracking-tight`}>{value}</p>
                {change !== undefined && change !== null && (
                    <span className={`text-sm font-semibold flex items-center gap-0.5 px-2 py-1 rounded-md ${
                        change > 0
                            ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/20'
                            : change < 0
                                ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20'
                                : 'text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-slate-700'
                    }`}>
                        <span className="text-base">
                            {change > 0 ? '↗' : change < 0 ? '↘' : '→'}
                        </span>
                        {Math.abs(change)}%
                    </span>
                )}
            </div>

            {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{subtitle}</p>
            )}
        </div>
    );
};

export default StatsCard;