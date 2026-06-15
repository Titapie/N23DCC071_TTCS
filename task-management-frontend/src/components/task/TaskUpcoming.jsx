// src/components/task/TaskUpcomingSection.jsx
import React, { useRef } from 'react';
import TaskCard from './TaskCard';
import Button from '../common/Button';
import Loading from '../common/Loading';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTimeLeft } from '../../utils/dateHelpers';
import { DARK_MODE_COLORS } from '../../utils/constants';

const TaskUpcoming = ({ tasks, loading, projects, onNavigate }) => {
    const timeLimitRef = useRef(null);

    const scroll = (direction) => {
        if (timeLimitRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            timeLimitRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 animate-fade-in">
                <h2 className={`text-2xl font-bold ${DARK_MODE_COLORS.TEXT_PRIMARY}`}>
                    Sắp đến hạn
                    <span className={`text-sm font-normal ml-2 ${DARK_MODE_COLORS.TEXT_SECONDARY}`}>
                        (3 ngày tới)
                    </span>
                </h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => scroll('left')}
                        className="transition-transform hover:scale-110"
                    >
                        <ChevronLeft size={20} />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => scroll('right')}
                        className="transition-transform hover:scale-110"
                    >
                        <ChevronRight size={20} />
                    </Button>
                </div>
            </div>
            <div
                ref={timeLimitRef}
                className="flex gap-4 overflow-x-auto pb-4 animate-slide-up"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {loading ? (
                    <Loading />
                ) : tasks.length === 0 ? (
                    <div className={`${DARK_MODE_COLORS.TEXT_SECONDARY} animate-fade-in`}>
                        Không có task sắp đến hạn
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task._id || task.id}
                            task={task}
                            projects={projects}
                            timeLeft={getTimeLeft(task.dueDate)}
                            onClick={() => onNavigate(task._id || task.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskUpcoming;