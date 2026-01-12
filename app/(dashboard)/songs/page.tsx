'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import AddSongModal from '@/components/songs/AddSongModal';
import FindSongModal from '@/components/songs/FindSongModal';
import SongCapabilitiesModal from '@/components/songs/SongCapabilitiesModal';
import { Song } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import SessionModal from '@/components/calendar/SessionModal';
import { SessionWithDetails } from '@/lib/types';
import { useSortableData } from '@/hooks/useSortableData';

export default function SongsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const { items: sortedSongs, requestSort, sortConfig } = useSortableData(songs);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFindModalOpen, setIsFindModalOpen] = useState(false);

    const handleAddRecommendedSongs = async (recommendedSongs: { title: string; artist: string; key: string; tempo: string; youtubeUrl: string }[]) => {
        try {
            setLoading(true);
            // Process each song sequentially
            for (const song of recommendedSongs) {
                const res = await fetch('/api/songs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: song.title,
                        artist: song.artist,
                        key: song.key,
                        tempo: song.tempo,
                        resource_url: song.youtubeUrl,
                    })
                });

                if (!res.ok) {
                    console.error('Failed to add song:', song.title);
                }
            }
            await fetchSongs();
        } catch (error) {
            console.error('Error adding recommended songs:', error);
            alert('Some songs may not have been added.');
        } finally {
            setLoading(false);
        }
    };

    // Capabilities Modal State
    const [selectedSongForCaps, setSelectedSongForCaps] = useState<Song | null>(null);
    const [isCapsModalOpen, setIsCapsModalOpen] = useState(false);

    // Session Modal State
    const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [, setIsLoadingSession] = useState(false);

    const handleSessionClick = async (sessionId: string) => {
        setIsLoadingSession(true);
        try {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (res.ok) {
                const sessionData = await res.json();
                setSelectedSession(sessionData);
                setIsSessionModalOpen(true);
            } else {
                alert('Failed to load session details');
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            alert('Error loading session details');
        } finally {
            setIsLoadingSession(false);
        }
    };

    const fetchSongs = useCallback(async () => {
        try {
            setLoading(true);
            const url = searchTerm
                ? `/api/songs?search=${encodeURIComponent(searchTerm)}`
                : '/api/songs';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setSongs(data);
            }
        } catch (error) {
            console.error('Error fetching songs:', error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, setSongs, setLoading]);

    useEffect(() => {
        fetchSongs();
    }, [fetchSongs]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchSongs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchSongs]); // Added fetchSongs to dependency array for completeness, though it's stable due to useCallback

    const [editingSong, setEditingSong] = useState<Song | null>(null);

    const handleEditSong = (song: Song) => {
        setEditingSong(song);
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setEditingSong(null);
    };

    const handleDeleteSong = async (songId: string) => {
        if (!confirm('Are you sure you want to delete this song?')) return;

        try {
            const res = await fetch(`/api/songs/${songId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchSongs();
            } else {
                alert('Failed to delete song');
            }
        } catch (error) {
            console.error('Error deleting song:', error);
            alert('Error deleting song');
        }
    };

    // ... existing handlers ...

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Song Library</h1>
                    <p className="text-text-secondary">Manage the band&apos;s backlog of songs to record</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsFindModalOpen(true)} variant="secondary">
                        Find Songs
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
                        + Add Song
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search songs by title or artist..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Song List */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-text-secondary">Loading songs...</div>
                ) : songs.length === 0 ? (
                    <div className="p-8 text-center text-text-secondary">
                        {searchTerm ? 'No songs found matching your search.' : 'No songs in the library yet.'}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-secondary border-b border-border text-text-secondary text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('title')}>
                                    Title {sortConfig?.key === 'title' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-medium cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('artist')}>
                                    Artist {sortConfig?.key === 'artist' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-medium w-32 cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('key')}>
                                    Key {sortConfig?.key === 'key' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-medium w-32 cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('tempo')}>
                                    Tempo {sortConfig?.key === 'tempo' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-medium w-40 cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('session_date')}>
                                    Session {sortConfig?.key === 'session_date' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="p-4 font-medium w-32">Requirements</th>
                                <th className="p-4 font-medium w-48 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sortedSongs.map((song) => (
                                <tr key={song.id} className="hover:bg-surface-hover transition-colors">
                                    <td className="p-4 text-text-primary font-medium">{song.title}</td>
                                    <td className="p-4 text-text-secondary">{song.artist || '-'}</td>
                                    <td className="p-4 text-text-secondary">{song.key || '-'}</td>
                                    <td className="p-4 text-text-secondary">{song.tempo || '-'}</td>
                                    <td className="p-4 text-text-secondary whitespace-nowrap">
                                        {song.session_date && song.session_id ? (
                                            <button
                                                onClick={() => handleSessionClick(song.session_id!)}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-hover text-primary border border-primary/30 hover:bg-surface transition-colors"
                                            >
                                                {formatDate(song.session_date)}
                                            </button>
                                        ) : (
                                            <span className="text-text-secondary italic">To Be Done</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <Button
                                            onClick={() => {
                                                setSelectedSongForCaps(song);
                                                setIsCapsModalOpen(true);
                                            }}
                                            variant="ghost"
                                            className="text-xs px-3 py-1.5 h-auto whitespace-nowrap"
                                        >
                                            {song.capabilities && song.capabilities.length > 0
                                                ? `${song.capabilities.length} Req.`
                                                : `+ Add Req.`}
                                            {/* Debug ID */}
                                            <span className="hidden group-hover:inline text-[8px] ml-1 text-gray-400">{song.id}</span>
                                        </Button>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            {song.resource_url && (
                                                <Button
                                                    variant="secondary"
                                                    className="text-xs px-3 py-1.5 h-auto text-green-400 hover:text-green-300 border-green-500/30 hover:bg-green-500/10"
                                                    onClick={() => window.open(song.resource_url, '_blank')}
                                                    title="Play"
                                                >
                                                    ▶ Play
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-text-primary"
                                                onClick={() => handleEditSong(song)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-red-400"
                                                onClick={() => handleDeleteSong(song.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <AddSongModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSongAdded={fetchSongs}
                initialData={editingSong}
            />

            <FindSongModal
                isOpen={isFindModalOpen}
                onClose={() => setIsFindModalOpen(false)}
                onAddSongs={handleAddRecommendedSongs}
            />

            <SongCapabilitiesModal
                isOpen={isCapsModalOpen}
                onClose={() => setIsCapsModalOpen(false)}
                song={selectedSongForCaps}
                onSave={fetchSongs}
            />

            {selectedSession && (
                <SessionModal
                    isOpen={isSessionModalOpen}
                    onClose={() => setIsSessionModalOpen(false)}
                    session={selectedSession}
                    onUpdate={() => {
                        handleSessionClick(selectedSession.id);
                    }}
                />
            )}
        </div>
    );
}
