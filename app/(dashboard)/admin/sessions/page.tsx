'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

type Session = {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    created_at: string;
    commitments_count?: number;
};

import CreateSessionModal from '@/components/admin/CreateSessionModal';

export default function SessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, []);

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
            setLoading(false);
        }
    };

    const handleDeleteSession = async (id: string, date: string) => {
        if (!confirm(`Are you sure you want to delete the session on ${new Date(date).toLocaleDateString()}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/sessions/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchSessions();
            } else {
                alert('Failed to delete session');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Failed to delete session');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-text-secondary">Loading sessions...</p>
            </div>
        );
    }

    const upcomingSessions = sessions.filter(s => new Date(s.date) >= new Date());
    const pastSessions = sessions.filter(s => new Date(s.date) < new Date());

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
                >
                    <span className="text-xl">←</span>
                    <span>Back to Admin</span>
                </Link>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">Manage Sessions</h1>
                    <p className="text-text-secondary">Create, edit, and delete studio sessions</p>
                </div>
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>Create New Session</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-text-secondary text-sm">Total Sessions</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{sessions.length}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-text-secondary text-sm">Upcoming</p>
                    <p className="text-2xl font-bold text-primary mt-1">{upcomingSessions.length}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-text-secondary text-sm">Past</p>
                    <p className="text-2xl font-bold text-text-secondary mt-1">{pastSessions.length}</p>
                </div>
            </div>

            {/* Upcoming Sessions */}
            <div>
                <h2 className="text-xl font-semibold text-text-primary mb-4">Upcoming Sessions</h2>
                {upcomingSessions.length === 0 ? (
                    <div className="bg-surface border border-border rounded-lg p-8 text-center">
                        <div className="text-4xl mb-2">📅</div>
                        <p className="text-text-secondary">No upcoming sessions scheduled</p>
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-surface-secondary">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Commitments
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {upcomingSessions.map(session => (
                                    <tr key={session.id} className="hover:bg-surface-secondary transition-colors">
                                        <td className="px-4 py-3 font-medium text-text-primary">
                                            {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {session.start_time} - {session.end_time}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {session.commitments_count || 0} committed
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/dashboard?date=${session.date}`}
                                                    className="text-primary hover:text-primary-light text-sm"
                                                    title="View in Calendar"
                                                >
                                                    👁️
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteSession(session.id, session.date)}
                                                    className="text-red-400 hover:text-red-300 text-sm"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Past Sessions</h2>
                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-surface-secondary">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Commitments
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pastSessions.slice(0, 10).map(session => (
                                    <tr key={session.id} className="hover:bg-surface-secondary transition-colors opacity-60">
                                        <td className="px-4 py-3 font-medium text-text-primary">
                                            {new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {session.start_time} - {session.end_time}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {session.commitments_count || 0} attended
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDeleteSession(session.id, session.date)}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <CreateSessionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSessionCreated={fetchSessions}
            />
        </div>
    );
}
