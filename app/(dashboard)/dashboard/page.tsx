'use client';

import { useState, useEffect } from 'react';
import MonthlySessionsView from '@/components/sessions/MonthlySessionsView';
import { SessionWithDetails } from '@/lib/types';

export default function DashboardPage() {
    const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const response = await fetch('/api/sessions');
            if (response.ok) {
                const data = await response.json();
                setSessions(data);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pt-6">
            <div className="mb-8 text-center">
                <h2 className="text-4xl font-bold text-text-primary mb-2">
                    Thursday Night Sessions
                </h2>
                <p className="text-text-secondary">
                    View and commit to upcoming rehearsal sessions
                </p>
            </div>
            <MonthlySessionsView sessions={sessions} onRefresh={fetchSessions} />
        </div>
    );
}
