'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import AddSongModal from '@/components/songs/AddSongModal';
import SongCapabilitiesModal from '@/components/songs/SongCapabilitiesModal';
import { Song } from '@/lib/types';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import SessionModal from '@/components/calendar/SessionModal';
import { SessionWithDetails } from '@/lib/types';

export default function SongsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Capabilities Modal State
    const [selectedSongForCaps, setSelectedSongForCaps] = useState<Song | null>(null);
    const [isCapsModalOpen, setIsCapsModalOpen] = useState(false);

    // Session Modal State
    const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);

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

    const fetchSongs = async () => {
        try {
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
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchSongs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Song Library</h1>
                    <p className="text-text-secondary">Manage the band's repertoire</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
                    + Add Song
                </Button>
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
                                <th className="p-4 font-medium">Title</th>
                                <th className="p-4 font-medium">Artist</th>
                                <th className="p-4 font-medium w-32">Key</th>
                                <th className="p-4 font-medium w-32">Tempo</th>
                                <th className="p-4 font-medium w-40">Session</th>
                                <th className="p-4 font-medium w-32">Requirements</th>
                                <th className="p-4 font-medium w-24">Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {songs.map((song) => (
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
                                    <td className="p-4">
                                        {song.resource_url && (
                                            <a
                                                href={song.resource_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary-light hover:underline"
                                                title="Open resource"
                                            >
                                                🔗
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <AddSongModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSongAdded={fetchSongs}
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
                        // If anything changed in the session (like Rsvp), maybe refresh something?
                        // For now just re-fetch the session to update view if needed, 
                        // but handleSessionClick re-fetches on open.
                        // We might want to refresh the song list if assignment changed, but
                        // modal is mostly for RSVP/Details.
                        handleSessionClick(selectedSession.id);
                    }}
                />
            )}
        </div>
    );
}
