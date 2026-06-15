import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PRIORITY_LABELS, PRIORITY_COLORS, DARK_MODE_COLORS } from '../../utils/constants';
import { formatDate, isDeadlineSoon } from '../../utils/dateHelpers';
import { Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const KanbanCard = ({ task }) => {
    const { user } = useAuth();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id || task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isAssigned = task.members?.some(m => m && (m._id === user?._id || m.id === user?._id));

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${DARK_MODE_COLORS.BG_CARD} p-4 rounded-lg border ${DARK_MODE_COLORS.BORDER_PRIMARY} mb-3 cursor-move ${DARK_MODE_COLORS.CARD_SHADOW} transition-all duration-200 ${
                isDeadlineSoon(task.dueDate) ? 'border-l-4 border-l-red-500 dark:border-l-red-400' : ''
            }`}
        >
            {/* Task Name */}
            <h4 className={`font-semibold ${DARK_MODE_COLORS.TEXT_PRIMARY} mb-2 line-clamp-2`}>
                {task.name}
            </h4>

            {/* Priority & Role Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                        PRIORITY_COLORS[task.priority] || DARK_MODE_COLORS.BADGE_GRAY
                    }`}
                >
                    {PRIORITY_LABELS[task.priority]}
                </span>
                {task.userRole === 'both' && (
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full whitespace-nowrap">
                        Quản lý + Được giao
                    </span>
                )}
                {task.userRole === 'manager' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
                        Quản lý
                    </span>
                )}
                {task.userRole === 'employee' && (
                    isAssigned ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                            Được giao
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-medium rounded-full whitespace-nowrap">
                            Tham gia
                        </span>
                    )
                )}
            </div>

            {/* Deadline */}
            {task.dueDate && (
                <div className={`text-sm ${DARK_MODE_COLORS.TEXT_SECONDARY} mb-2`}>
                    <span className="font-medium">Deadline:</span>{' '}
                    <span className={isDeadlineSoon(task.dueDate) ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                        {formatDate(task.dueDate)}
                    </span>
                </div>
            )}

            {/* Project */}
            {task.project?.name && (
                <div className={`text-xs ${DARK_MODE_COLORS.TEXT_TERTIARY} mb-2`}>
                    {task.project.name}
                </div>
            )}

            {/* Members */}
            {task.members && task.members.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                    <Users size={14} className={`text-gray-500 dark:text-slate-400`} />
                    <div className="flex -space-x-2">
                        {task.members.slice(0, 3).map((member, idx) => (
                            <div
                                key={member._id || member.id}
                                className={`w-6 h-6 rounded-full ${DARK_MODE_COLORS.AVATAR_MEMBER} text-xs flex items-center justify-center ${DARK_MODE_COLORS.AVATAR_BORDER}`}
                                title={`${member.firstName || ''} ${member.lastName || ''}`}
                            >
                                {(member.firstName || 'U').charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {task.members.length > 3 && (
                            <div className={`w-6 h-6 rounded-full ${DARK_MODE_COLORS.AVATAR_MORE} text-xs flex items-center justify-center ${DARK_MODE_COLORS.AVATAR_BORDER}`}>
                                +{task.members.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanCard;