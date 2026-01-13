'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import CreateSessionModal from '@/components/admin/CreateSessionModal';
import { Song } from '@/lib/types';
import { useSortableData } from '@/hooks/useSortableData';

type Session = {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    created_at: string;
    commitments_count?: number;
    songs?: { id: string; song_name: string; song_url?: string }[];
};

type FormSession = Omit<Session, 'songs'> & {
    songs?: Song[];
};

export default function SessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Add state for filtration
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

    // Add state for editing
    const [editingSession, setEditingSession] = useState<FormSession | null>(null);

    const upcomingSessions = sessions.filter(s => new Date(s.date) >= new Date());
    const pastSessions = sessions.filter(s => new Date(s.date) < new Date());

    const { items: sortedUpcoming, requestSort: sortUpcoming, sortConfig: upcomingConfig } = useSortableData(upcomingSessions);
    const { items: sortedPast, requestSort: sortPast, sortConfig: pastConfig } = useSortableData(pastSessions);

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

    const handleEditSession = (session: Session) => {
        // Prepare session data for modal
        // We need to transform session.songs to match Song type expected by modal
        // session.songs from API is usually session_songs table rows { song_name, song_url, ... }
        // The modal matches by ID or Title. Since we might not have original ID here, we rely on Title match.

        const preparedSession: FormSession = {
            ...session,
            songs: session.songs?.map((s, index) => ({
                id: s.id || `temp-${index}`, // Fallback ID
                title: s.song_name,
                artist: '', // Information lost in session_songs table
                resource_url: s.song_url
            })) as Song[]
        };

        setEditingSession(preparedSession);
        setIsCreateModalOpen(true);
    };

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setEditingSession(null);
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

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-text-secondary">Loading sessions...</p>
            </div>
        );
    }



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

            {/* Filters */}
            <div className="flex justify-end mb-4">
                <div className="grid grid-cols-3 md:flex items-center gap-2 bg-surface border border-border p-1 rounded-lg w-full md:w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'all'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'upcoming'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter('past')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === 'past'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                            }`}
                    >
                        Past
                    </button>
                </div>
            </div>

            {/* Upcoming Sessions */}
            {(filter === 'all' || filter === 'upcoming') && (
                <div>
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Sessions</h2>
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
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => sortUpcoming('date')}>
                                            Date {upcomingConfig?.key === 'date' && (upcomingConfig.direction === 'ascending' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => sortUpcoming('start_time')}>
                                            Time {upcomingConfig?.key === 'start_time' && (upcomingConfig.direction === 'ascending' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => sortUpcoming('commitments_count')}>
                                            Commitments {upcomingConfig?.key === 'commitments_count' && (upcomingConfig.direction === 'ascending' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {sortedUpcoming.map(session => (
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
                                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary">
                                                {session.commitments_count || 0} committed
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleEditSession(session)}
                                                        variant="ghost"
                                                        className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-text-primary"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDeleteSession(session.id, session.date)}
                                                        variant="ghost"
                                                        className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-red-400"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Past Sessions */}
            {(filter === 'all' || filter === 'past') && pastSessions.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-text-primary mb-4">Past Sessions</h2>
                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-surface-secondary">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => sortPast('date')}>
                                        Date {pastConfig?.key === 'date' && (pastConfig.direction === 'ascending' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => sortPast('start_time')}>
                                        Time {pastConfig?.key === 'start_time' && (pastConfig.direction === 'ascending' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => sortPast('commitments_count')}>
                                        Commitments {pastConfig?.key === 'commitments_count' && (pastConfig.direction === 'ascending' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sortedPast.slice(0, 10).map(session => (
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
                                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">
                                            {session.commitments_count || 0} attended
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleEditSession(session)}
                                                    variant="ghost"
                                                    className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-text-primary"
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteSession(session.id, session.date)}
                                                    variant="ghost"
                                                    className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-red-400"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
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
                onClose={handleModalClose}
                onSessionCreated={fetchSessions}
                initialData={editingSession}
            />
        </div>
    );
}
