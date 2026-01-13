'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import MonthlySessionsView from '@/components/sessions/MonthlySessionsView';
import { SessionWithDetails } from '@/lib/types';
import Button from '@/components/ui/Button';
import CreateSessionModal from '@/components/admin/CreateSessionModal';

export default function DashboardPage() {
    const { data: session } = useSession();
    const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-4xl font-bold text-text-primary mb-2">
                        Thursday Night Sessions
                    </h2>
                </div>
                {session?.user?.userType === 'admin' && (
                    <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
                        + Add Session
                    </Button>
                )}
            </div>
            <MonthlySessionsView sessions={sessions} onRefresh={fetchSessions} />

            <CreateSessionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSessionCreated={() => {
                    fetchSessions();
                    setIsCreateModalOpen(false);
                }}
            />
        </div>
    );
}
