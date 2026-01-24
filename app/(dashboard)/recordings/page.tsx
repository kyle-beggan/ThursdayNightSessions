'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useSortableData } from '@/hooks/useSortableData';
import { useSession } from 'next-auth/react';
import CapabilityIcon from '@/components/ui/CapabilityIcon';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/providers/ConfirmProvider';

interface Player {
    name: string;
    capabilities: { id?: string; icon: string; name: string }[];
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
    const { data: session } = useSession();
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const { items: sortedRecordings, requestSort, sortConfig } = useSortableData(recordings);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const { confirm } = useConfirm();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const isAdmin = session?.user?.userType === 'admin';

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

    const handleDelete = async (id: string, title: string) => {
        if (!await confirm({
            title: 'Delete Recording',
            message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger'
        })) return;

        try {
            const res = await fetch(`/api/recordings/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setRecordings(prev => prev.filter(r => r.id !== id));
                toast.success('Recording deleted successfully');
            } else {
                toast.error('Failed to delete recording');
            }
        } catch (error) {
            console.error('Error deleting recording:', error);
            toast.error('An error occurred while deleting');
        }
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab if blob fetch fails
            window.open(url, '_blank');
        }
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
        <div className="p-0 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div>
                <h1 className="text-xl md:text-3xl font-bold text-text-primary">Recording Library</h1>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                        {sortedRecordings.map((rec) => (
                            <div key={rec.id} className="bg-primary/20 rounded-lg p-4 border border-border shadow-sm hover:bg-primary/30 transition-colors relative group">
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(rec.id, rec.title)}
                                        className="absolute top-2 right-2 w-6 h-6 bg-surface border border-border rounded-full text-text-secondary hover:text-red-500 hover:border-red-500 flex items-center justify-center shadow-sm z-10"
                                        title="Delete recording"
                                        aria-label="Delete recording"
                                    >
                                        ✕
                                    </button>
                                )}
                                <div className="mb-3 pr-8">
                                    <div className="w-full">
                                        <h3 className="font-bold text-text-primary text-base leading-tight break-words">{rec.title}</h3>
                                        <p className="text-text-secondary text-sm mb-2">{formatDate(rec.session_date)}</p>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="primary"
                                                className="w-8 h-8 p-0 flex items-center justify-center rounded-full flex-shrink-0"
                                                onClick={() => handlePlay(rec.url)}
                                                title="Play"
                                            >
                                                <span className="text-xs">▶</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-8 h-8 p-0 flex items-center justify-center rounded-full flex-shrink-0 border border-border/50 text-text-secondary"
                                                onClick={() => handleDownload(rec.url, rec.title)}
                                                title="Download"
                                            >
                                                <span className="text-xs">⬇</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border/50">
                                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Players</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {rec.players.map((player, idx) => (
                                            <div key={idx} className="flex items-center gap-1 bg-surface-tertiary rounded-full px-2 py-1 border border-border text-xs">
                                                <span className="font-medium text-text-primary">{player.name}</span>
                                                <div className="flex gap-0.5">
                                                    {player.capabilities.map((cap, cIdx) => (
                                                        <span key={cIdx} title={cap.name}>
                                                            <CapabilityIcon capability={cap} className="w-3 h-3" />
                                                        </span>
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
                                <th className="p-4 text-sm font-semibold text-text-secondary text-center">Actions</th>
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
                                                        <div className="flex gap-0.5">
                                                            {player.capabilities.map((cap, cIdx) => (
                                                                <span key={cIdx} title={cap.name}>
                                                                    <CapabilityIcon capability={cap} className="w-3 h-3" />
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {rec.players.length === 0 && (
                                                    <span className="text-text-secondary text-xs italic">No player data</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="primary"
                                                    className="text-xs px-3 py-1.5 h-auto transition-opacity whitespace-nowrap flex items-center justify-center gap-1"
                                                    onClick={() => handlePlay(rec.url)}
                                                >
                                                    <span>▶</span> <span>Play</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-text-primary border border-border/50"
                                                    onClick={() => handleDownload(rec.url, rec.title)}
                                                    title="Download"
                                                >
                                                    Download
                                                </Button>
                                                {isAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-red-400"
                                                        onClick={() => handleDelete(rec.id, rec.title)}
                                                        title="Delete"
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
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
