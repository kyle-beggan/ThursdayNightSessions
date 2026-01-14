'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { SessionWithDetails } from '@/lib/types';
import SessionModal from './SessionModal';
import SessionIndicator from './SessionIndicator';

interface MonthlyCalendarProps {
    sessions: SessionWithDetails[];
    onRefresh: () => void;
}

export default function MonthlyCalendar({ sessions, onRefresh }: MonthlyCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the first day of the week for the month
    const firstDayOfWeek = monthStart.getDay();

    // Create array of days including padding for the first week
    const calendarDays = Array(firstDayOfWeek).fill(null).concat(daysInMonth);

    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const getSessionsForDay = (day: Date) => {
        return sessions.filter(session =>
            isSameDay(new Date(session.date), day)
        );
    };

    const handleSessionClick = (session: SessionWithDetails) => {
        setSelectedSession(session);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSession(null);
    };

    const handleSessionUpdate = () => {
        onRefresh();
        handleCloseModal();
    };

    return (
        <div className="w-full">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handlePreviousMonth}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    aria-label="Previous month"
                >
                    <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <h2 className="text-3xl font-bold text-text-primary">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>

                <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    aria-label="Next month"
                >
                    <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Day Labels - Hidden on mobile, shown on desktop */}
            <div className="hidden md:grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-text-secondary font-semibold py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid - Vertical stack on mobile, 7-col grid on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                    if (!day) {
                        return <div key={`empty-${index}`} className="hidden md:block aspect-square" />;
                    }

                    const daySessions = getSessionsForDay(day);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toISOString()}
                            className={`
                border border-border rounded-lg p-2 
                min-h-[100px] md:min-h-0 md:aspect-square
                ${isToday ? 'bg-primary/10 border-primary' : 'bg-surface-secondary'}
                ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}
              `}
                        >
                            <div className="text-sm font-medium text-text-primary mb-1">
                                {format(day, 'd')}
                            </div>

                            <div className="space-y-1">
                                {daySessions.map(session => (
                                    <SessionIndicator
                                        key={session.id}
                                        session={session}
                                        onClick={() => handleSessionClick(session)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Session Modal */}
            {selectedSession && (
                <SessionModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    session={selectedSession}
                    onUpdate={handleSessionUpdate}
                />
            )}
        </div>
    );
}
