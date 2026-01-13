'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useSortableData } from '@/hooks/useSortableData';

interface Player {
    name: string;
    capabilities: { icon: string; name: string }[];
}

interface Recording {
    id: string;
    title: string;
    url: string;
    created_at: string;
    session_date: string;
    players: Player[];
}

export default function RecordingsPage() {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const { items: sortedRecordings, requestSort, sortConfig } = useSortableData(recordings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecordings = async () => {
            try {
                const res = await fetch('/api/recordings');
                if (res.ok) {
                    const data = await res.json();
                    setRecordings(data);
                }
            } catch (error) {
                console.error('Failed to fetch recordings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecordings();
    }, []);

    const handlePlay = (url: string) => {
        window.open(url, '_blank');
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Unknown Date';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Recording Library</h1>
                <p className="text-text-secondary">Archive of all session recordings</p>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                        {sortedRecordings.map((rec) => (
                            <div key={rec.id} className="bg-surface-secondary rounded-lg p-4 border border-border shadow-sm">
                                <div className="mb-3">
                                    <div className="w-full">
                                        <h3 className="font-bold text-text-primary text-base leading-tight break-words">{rec.title}</h3>
                                        <p className="text-text-secondary text-sm mb-2">{formatDate(rec.session_date)}</p>

                                        <Button
                                            variant="primary"
                                            className="w-8 h-8 p-0 flex items-center justify-center rounded-full flex-shrink-0"
                                            onClick={() => handlePlay(rec.url)}
                                            title="Play"
                                        >
                                            <span className="text-xs">▶</span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border/50">
                                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Players</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {rec.players.map((player, idx) => (
                                            <div key={idx} className="flex items-center gap-1 bg-surface-tertiary rounded-full px-2 py-1 border border-border text-xs">
                                                <span className="font-medium text-text-primary">{player.name}</span>
                                                <div className="flex">
                                                    {player.capabilities.map((cap, cIdx) => (
                                                        <span key={cIdx} title={cap.name}>{cap.icon}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {rec.players.length === 0 && (
                                            <span className="text-text-secondary text-xs italic">No player data</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sortedRecordings.length === 0 && (
                            <div className="p-8 text-center text-text-secondary">
                                No recordings found.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-secondary border-b border-border">

                                <th className="p-4 text-sm font-semibold text-text-secondary cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('title')}>
                                    Title/Filename {sortConfig?.key === 'title' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 text-sm font-semibold text-text-secondary cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('session_date')}>
                                    Session Date {sortConfig?.key === 'session_date' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Players</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {recordings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-text-secondary">
                                        No recordings found. Upload recordings from a Session page.
                                    </td>
                                </tr>
                            ) : (
                                sortedRecordings.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-surface-hover transition-colors group">
                                        <td className="p-4">
                                            <div className="font-medium text-text-primary">{rec.title}</div>
                                        </td>
                                        <td className="p-4 text-text-secondary">
                                            {formatDate(rec.session_date)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                {rec.players.map((player, idx) => (
                                                    <div key={idx} className="flex items-center gap-1 bg-surface-secondary rounded-full px-2 py-1 border border-border text-xs">
                                                        <span className="font-medium text-text-primary">{player.name}</span>
                                                        <div className="flex">
                                                            {player.capabilities.map((cap, cIdx) => (
                                                                <span key={cIdx} title={cap.name}>{cap.icon}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {rec.players.length === 0 && (
                                                    <span className="text-text-secondary text-xs italic">No player data</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                variant="primary"
                                                className="text-xs px-3 py-1.5 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handlePlay(rec.url)}
                                            >
                                                ▶ Play
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
