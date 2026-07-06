'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import MonthlySessionsView from '@/components/sessions/MonthlySessionsView';
import { SessionWithDetails } from '@/lib/types';
import Button from '@/components/ui/Button';
import CreateSessionModal from '@/components/admin/CreateSessionModal';
import BroadcastSMSModal from '@/components/admin/BroadcastSMSModal';
import { useToast } from '@/hooks/useToast';

export default function DashboardPage() {
    const { data: session } = useSession();
    const toast = useToast();
    const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

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

    const handleSendBroadcast = async (message: string) => {
        setIsSendingBroadcast(true);
        try {
            const res = await fetch('/api/notify/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.sentCount > 0) {
                    toast.success(`Successfully broadcasted message to ${data.sentCount} users!`);
                } else {
                    toast.info(data.message || 'No broadcasts sent (no approved users with valid phone numbers found).');
                }
                setIsBroadcastModalOpen(false);
            } else {
                toast.error(data.error || 'Failed to send broadcast.');
                if (data.details) console.error(data.details);
            }
        } catch (error) {
            console.error('Error sending broadcast:', error);
            toast.error('An error occurred while sending the broadcast.');
        } finally {
            setIsSendingBroadcast(false);
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
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            onClick={() => setIsBroadcastModalOpen(true)}
                            variant="secondary"
                            className="bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                        >
                            💬 Broadcast SMS
                        </Button>
                        <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
                            + Add Session
                        </Button>
                    </div>
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

            <BroadcastSMSModal
                isOpen={isBroadcastModalOpen}
                onClose={() => setIsBroadcastModalOpen(false)}
                onSend={handleSendBroadcast}
                isSending={isSendingBroadcast}
            />
        </div>
    );
}

