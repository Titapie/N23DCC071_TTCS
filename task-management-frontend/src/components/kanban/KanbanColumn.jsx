import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { DARK_MODE_COLORS } from '../../utils/constants';

const KanbanColumn = ({ status, tasks, title, colorClass }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <div className={`flex flex-col min-w-[280px] ${DARK_MODE_COLORS.BG_SECONDARY} rounded-lg p-4 transition-all duration-200`}>
            {/* Column Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-bold text-lg ${colorClass}`}>{title}</h3>
                    <span className={`${DARK_MODE_COLORS.BADGE_GRAY} px-2 py-1 rounded-full text-sm font-semibold`}>
                        {tasks.length}
                    </span>
                </div>
                <div className={`h-1 rounded ${colorClass.replace('text-', 'bg-')}`}></div>
            </div>

            {/* Droppable Area */}
            <SortableContext
                id={status}
                items={tasks.map((t) => t._id || t.id)}
                strategy={verticalListSortingStrategy}
            >
                <div
                    ref={setNodeRef}
                    className={`flex-1 transition-colors ${
                        isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg' : ''
                    }`}
                >
                    {tasks.length === 0 ? (
                        <div className={`text-center ${DARK_MODE_COLORS.TEXT_TERTIARY} mt-8 text-sm`}>
                            Không có task phù hợp
                        </div>
                    ) : (
                        tasks.map((task) => <KanbanCard key={task._id || task.id} task={task} />)
                    )}
                </div>
            </SortableContext>
        </div>
    );
};

export default KanbanColumn;