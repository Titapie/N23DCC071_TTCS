// src/components/tasks/TaskCard.jsx
import React from 'react';
import { Clock } from 'lucide-react';
import { TASK_STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, DARK_MODE_COLORS } from '../../utils/constants';
import { getProjectNameById } from '../../utils/helpers';

const TaskCard = ({ task, onEdit, onDelete, showActions = false, timeLeft, onClick, projects = [] }) => {
    console.log('Task data in TaskCard:', task);
    return (
        <div
            onClick={onClick}
            className={`min-w-[320px] ${DARK_MODE_COLORS.BG_CARD} rounded-lg shadow-sm border ${DARK_MODE_COLORS.BORDER_PRIMARY} overflow-hidden cursor-pointer ${DARK_MODE_COLORS.CARD_SHADOW} transition-all duration-300 hover:scale-105 hover:shadow-xl animate-scale-in`}
        >
            {/* Image Thumbnail */}
            <div className={`h-40 ${DARK_MODE_COLORS.BG_GRADIENT} flex items-center justify-center animate-fade-in`}>
                <div className="text-white text-6xl font-bold opacity-20">
                    {task.name ? task.name.charAt(0).toUpperCase() : 'T'}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 animate-slide-up">
                {/* Title */}
                <h3 className={`font-bold text-lg ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-2 line-clamp-2`}>
                    {task.name}
                </h3>

                <p className={`text-sm ${DARK_MODE_COLORS.TEXT_SECONDARY} mb-3`}>
                    {getProjectNameById(task.project, projects)}
                </p>

                {/* Status & Priority Badges */}
                <div className="flex gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[task.status] || DARK_MODE_COLORS.BADGE_GRAY} transition-transform hover:scale-110`}>
                        {TASK_STATUS_LABELS[task.status]}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority] || DARK_MODE_COLORS.BADGE_GRAY} transition-transform hover:scale-110`}>
                        {PRIORITY_LABELS[task.priority]}
                    </span>
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3 border-t ${DARK_MODE_COLORS.BORDER_SECONDARY}`}>
                    {/* Time Left */}
                    <div className={`flex items-center gap-1 text-sm ${DARK_MODE_COLORS.TEXT_SECONDARY}`}>
                        <Clock size={16} className="animate-bounce-subtle" />
                        <span>{timeLeft || 'No deadline'}</span>
                    </div>

                    {/* Members */}
                    {task.members && task.members.length > 0 && (
                        <div className="flex -space-x-2">
                            {task.members.slice(0, 3).map((member, idx) => (
                                <div
                                    key={member._id || member.id}
                                    className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 text-white text-xs flex items-center justify-center border-2 border-white dark:border-slate-700 transition-transform hover:scale-125 hover:z-10"
                                    title={`${member.firstName || ''} ${member.lastName || ''}`}
                                >
                                    {(member.firstName || 'U').charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {task.members.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-slate-600 text-white text-xs flex items-center justify-center border-2 border-white dark:border-slate-700 transition-transform hover:scale-125 hover:z-10">
                                    +{task.members.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TaskCard;