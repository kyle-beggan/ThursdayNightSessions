'use client';

import { useState } from 'react';
import { SessionWithDetails } from '@/lib/types';
import SessionIndicator from '../calendar/SessionIndicator';
import SessionModal from '../calendar/SessionModal';

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
    const currentYear = new Date().getFullYear();

    // Group sessions by month
    const sessionsByMonth = sessions.reduce((acc, session) => {
        const sessionDate = new Date(session.date);
        const monthIndex = sessionDate.getMonth();
        if (!acc[monthIndex]) {
            acc[monthIndex] = [];
        }
        acc[monthIndex].push(session);
        return acc;
    }, {} as Record<number, SessionWithDetails[]>);

    // Sort sessions within each month by date
    Object.keys(sessionsByMonth).forEach(monthIndex => {
        sessionsByMonth[Number(monthIndex)].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    });

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
            {MONTHS.map((month, index) => {
                const monthSessions = sessionsByMonth[index] || [];
                // Only show months that have sessions or distinct empty state if desired. 
                // Current design shows all months.

                return (
                    <div key={month} className="mb-8">
                        {/* Month Header */}
                        <div className="flex items-baseline gap-2 md:gap-3 mb-4">
                            <h2 className="text-lg md:text-2xl font-bold text-text-primary">
                                {month} {currentYear}
                            </h2>
                            {monthSessions.length > 0 && (
                                <span className="text-xs md:text-sm text-text-secondary whitespace-nowrap">
                                    {monthSessions.length} session{monthSessions.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Sessions Container */}
                        <div className="bg-surface-hover border border-border rounded-lg p-4">
                            {monthSessions.length > 0 ? (
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
                            ) : (
                                <div className="h-32 flex items-center justify-center text-text-secondary">
                                    No sessions scheduled for {month}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

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
