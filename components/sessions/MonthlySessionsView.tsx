'use client';

import { useState } from 'react';
import { SessionWithDetails } from '@/lib/types';
import SessionIndicator from '../calendar/SessionIndicator';
import SessionModal from '../calendar/SessionModal';
import { FaChevronDown } from 'react-icons/fa';

interface MonthlySessionsViewProps {
    sessions: SessionWithDetails[];
    onRefresh: () => void;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlySessionsView({ sessions, onRefresh }: MonthlySessionsViewProps) {
    const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
    const [isUpcomingCollapsed, setIsUpcomingCollapsed] = useState(true);
    const [isPastCollapsed, setIsPastCollapsed] = useState(true);
    const currentYear = new Date().getFullYear();

    // Compute most recent and next upcoming sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const nextUpcomingSession = sortedSessions.find(s => new Date(s.date) >= today);
    const mostRecentPastSession = [...sortedSessions].reverse().find(s => new Date(s.date) < today);

    // Separate past and upcoming sessions
    const upcomingSessions = sessions.filter(session => new Date(session.date) >= today);
    const pastSessions = sessions.filter(session => new Date(session.date) < today);

    // Helper to group and sort sessions by month
    const groupSessionsByMonth = (sessionList: SessionWithDetails[]) => {
        const grouped = sessionList.reduce((acc, session) => {
            const sessionDate = new Date(session.date);
            const monthIndex = sessionDate.getUTCMonth();
            if (!acc[monthIndex]) acc[monthIndex] = [];
            acc[monthIndex].push(session);
            return acc;
        }, {} as Record<number, SessionWithDetails[]>);

        Object.keys(grouped).forEach(monthIndex => {
            grouped[Number(monthIndex)].sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );
        });
        return grouped;
    };

    const upcomingSessionsByMonth = groupSessionsByMonth(upcomingSessions);
    const pastSessionsByMonth = groupSessionsByMonth(pastSessions);

    // Update selected session when sessions list changes (e.g. after refresh)
    // This keeps the modal data fresh without closing it
    const [lastSessions, setLastSessions] = useState(sessions);
    if (sessions !== lastSessions) {
        setLastSessions(sessions);
        if (selectedSession) {
            const updated = sessions.find(s => s.id === selectedSession.id);
            if (updated) setSelectedSession(updated);
        }
    }

    return (
        <div className="space-y-0">
            {/* Recent & Upcoming Sessions */}
            {(mostRecentPastSession || nextUpcomingSession) && (
                <div className="mb-12 border-b border-border pb-8">
                    <h2 className="text-2xl md:text-2xl font-bold text-text-primary mb-4">
                        Recent & Upcoming
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mostRecentPastSession && (
                            <div className="bg-surface border border-border rounded-lg p-4 flex flex-col">
                                <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Most Recent Session</h3>
                                <div className="flex-grow">
                                    <SessionIndicator
                                        session={mostRecentPastSession}
                                        className="h-full"
                                        onClick={() => setSelectedSession(mostRecentPastSession)}
                                    />
                                </div>
                            </div>
                        )}
                        {nextUpcomingSession && (
                            <div className="bg-surface border border-primary/30 rounded-lg p-4 flex flex-col">
                                <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Next Upcoming Session</h3>
                                <div className="flex-grow">
                                    <SessionIndicator
                                        session={nextUpcomingSession}
                                        className="h-full"
                                        onClick={() => setSelectedSession(nextUpcomingSession)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upcoming Sessions List */}
            {Object.keys(upcomingSessionsByMonth).length > 0 && (
                <div className="mb-12">
                    <div
                        className="flex items-center justify-between mb-6 border-b border-border pb-2 cursor-pointer group"
                        onClick={() => setIsUpcomingCollapsed(!isUpcomingCollapsed)}
                    >
                        <h2 className="text-3xl font-bold text-text-primary group-hover:text-primary transition-colors">Upcoming Sessions</h2>
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isUpcomingCollapsed
                                    ? 'bg-surface-secondary text-text-secondary group-hover:bg-primary/20 group-hover:text-primary'
                                    : 'bg-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                                }`}
                            style={{ transform: isUpcomingCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
                            aria-label={isUpcomingCollapsed ? "Expand upcoming sessions" : "Collapse upcoming sessions"}
                        >
                            <FaChevronDown className="w-4 h-4" />
                        </div>
                    </div>

                    {!isUpcomingCollapsed && MONTHS.map((month, index) => {
                        const monthSessions = upcomingSessionsByMonth[index] || [];
                        if (monthSessions.length === 0) return null;

                        return (
                            <div key={`upcoming-${month}`} className="mb-8">
                                <div className="flex items-baseline gap-2 md:gap-3 mb-4">
                                    <h3 className="text-2xl md:text-2xl font-bold text-text-primary">
                                        {month} {currentYear}
                                    </h3>
                                    <span className="text-xs md:text-sm text-text-secondary whitespace-nowrap">
                                        {monthSessions.length} session{monthSessions.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="bg-surface-hover border border-border rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {monthSessions.map(session => (
                                            <div key={session.id}>
                                                <SessionIndicator
                                                    session={session}
                                                    className="h-full"
                                                    onClick={() => setSelectedSession(session)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Past Sessions List */}
            {Object.keys(pastSessionsByMonth).length > 0 && (
                <div className="mb-12">
                    <div
                        className="flex items-center justify-between mb-6 border-b border-border pb-2 cursor-pointer group"
                        onClick={() => setIsPastCollapsed(!isPastCollapsed)}
                    >
                        <h2 className="text-3xl font-bold text-text-primary group-hover:text-primary transition-colors">Past Sessions</h2>
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isPastCollapsed
                                    ? 'bg-surface-secondary text-text-secondary group-hover:bg-primary/20 group-hover:text-primary'
                                    : 'bg-primary text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                                }`}
                            style={{ transform: isPastCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
                            aria-label={isPastCollapsed ? "Expand past sessions" : "Collapse past sessions"}
                        >
                            <FaChevronDown className="w-4 h-4" />
                        </div>
                    </div>

                    {!isPastCollapsed && MONTHS.map((month, index) => {
                        const monthSessions = pastSessionsByMonth[index] || [];
                        if (monthSessions.length === 0) return null;

                        return (
                            <div key={`past-${month}`} className="mb-8">
                                <div className="flex items-baseline gap-2 md:gap-3 mb-4">
                                    <h3 className="text-2xl md:text-2xl font-bold text-text-primary">
                                        {month} {currentYear}
                                    </h3>
                                    <span className="text-xs md:text-sm text-text-secondary whitespace-nowrap">
                                        {monthSessions.length} session{monthSessions.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="bg-surface-hover border border-border rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {monthSessions.map(session => (
                                            <div key={session.id}>
                                                <SessionIndicator
                                                    session={session}
                                                    className="h-full"
                                                    onClick={() => setSelectedSession(session)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State when no sessions exist at all */}
            {Object.keys(upcomingSessionsByMonth).length === 0 && Object.keys(pastSessionsByMonth).length === 0 && (
                <div className="h-32 flex items-center justify-center text-text-secondary bg-surface-hover border border-border rounded-lg p-4">
                    No sessions scheduled yet.
                </div>
            )}

            {/* Session Modal */}
            {selectedSession && (
                <SessionModal
                    isOpen={!!selectedSession}
                    onClose={() => setSelectedSession(null)}
                    session={selectedSession}
                    onUpdate={() => {
                        onRefresh();
                        // Don't close here, let the modal handle closing if needed (e.g. RSVP)
                        // This allows uploads to refresh data without closing the modal
                    }}
                />
            )}
        </div>
    );
}
