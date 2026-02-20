'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useConfirm } from '@/providers/ConfirmProvider';
import Button from '@/components/ui/Button';
import AddSongModal from '@/components/songs/AddSongModal';
import FindSongModal from '@/components/songs/FindSongModal';
import SongCapabilitiesModal from '@/components/songs/SongCapabilitiesModal';
import { Song } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import SessionModal from '@/components/calendar/SessionModal';
import { SessionWithDetails } from '@/lib/types';
import { useSortableData } from '@/hooks/useSortableData';
import { useToast } from '@/hooks/useToast';

export default function SongsPage() {
    const { data: session } = useSession();
    const toast = useToast();
    const { confirm } = useConfirm();
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
            toast.error('Some songs may not have been added.');
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
                toast.error('Failed to load session details');
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            toast.error('Error loading session details');
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
        if (!await confirm({
            title: 'Delete Song',
            message: 'Are you sure you want to delete this song? This action cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger'
        })) return;

        try {
            const res = await fetch(`/api/songs/${songId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Song deleted successfully');
                fetchSongs();
            } else {
                toast.error('Failed to delete song');
            }
        } catch (error) {
            console.error('Error deleting song:', error);
            toast.error('Error deleting song');
        }
    };

    const handleVote = async (song: Song) => {
        // Optimistic update
        setSongs(prev => prev.map(s => {
            if (s.id === song.id) {
                const hasVoted = !!s.user_has_voted;
                return {
                    ...s,
                    user_has_voted: !hasVoted,
                    vote_count: (s.vote_count || 0) + (hasVoted ? -1 : 1)
                };
            }
            return s;
        }));

        try {
            await fetch('/api/songs/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ songId: song.id })
            });
        } catch (error) {
            console.error('Error voting:', error);
            // Revert on error (could reuse fetchSongs but that's heavy, simpler to flip back)
            setSongs(prev => prev.map(s => {
                if (s.id === song.id) {
                    const hasVoted = !!s.user_has_voted; // This is the *new* state we just set
                    return {
                        ...s,
                        user_has_voted: !hasVoted, // Flip back
                        vote_count: (s.vote_count || 0) + (hasVoted ? -1 : 1)
                    };
                }
                return s;
            }));
        }
    };

    // ... existing handlers ...

    return (
        <div className="p-0 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-text-primary">Song Library</h1>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button onClick={() => setIsFindModalOpen(true)} variant="secondary" className="flex-1 md:flex-none justify-center">
                        Find Songs
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} variant="primary" className="flex-1 md:flex-none justify-center">
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

            <div className="space-y-8">
                {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const upcomingSongs = sortedSongs.filter(song => !song.session_date || song.session_date >= today);
                    const pastSongs = sortedSongs.filter(song => song.session_date && song.session_date < today);

                    const renderSongList = (songsToRender: Song[]) => (
                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            {songsToRender.length === 0 ? (
                                <div className="p-8 text-center text-text-secondary">
                                    No songs in this category.
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                                        {songsToRender.map((song) => (
                                            <div key={song.id} className="bg-primary/20 rounded-lg p-4 border border-border shadow-sm hover:bg-primary/30 transition-colors">
                                                <div className="mb-3">
                                                    <div className="w-full">
                                                        <h3 className="font-bold text-text-primary text-base leading-tight break-words">{song.title}</h3>
                                                        <p className="text-text-secondary text-sm break-words mb-2">{song.artist || 'Unknown Artist'}</p>

                                                        {/* Play Button */}
                                                        {song.resource_url && (
                                                            <Button
                                                                variant="primary"
                                                                className="w-8 h-8 p-0 flex items-center justify-center rounded-full flex-shrink-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(song.resource_url, '_blank');
                                                                }}
                                                                title="Play"
                                                            >
                                                                <span className="text-xs">▶</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mb-4 text-sm text-text-secondary">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="bg-surface-tertiary px-2 py-1 rounded inline-flex items-center">
                                                            <span className="font-medium text-text-primary min-w-[20px] text-center">{song.key || '?'}</span>
                                                            <span className="text-[10px] ml-1 opacity-70 uppercase tracking-wide">Key</span>
                                                        </div>
                                                        <div className="bg-surface-tertiary px-2 py-1 rounded inline-flex items-center">
                                                            <span className="font-medium text-text-primary min-w-[20px] text-center">{song.tempo || '?'}</span>
                                                            <span className="text-[10px] ml-1 opacity-70 uppercase tracking-wide">BPM</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                                    {/* Left: Added By */}
                                                    <div className="flex items-center gap-2 max-w-[40%]">
                                                        {song.creator ? (
                                                            <>
                                                                <div className="w-5 h-5 rounded-full overflow-hidden relative border border-border flex-shrink-0">
                                                                    {song.creator.image ? (
                                                                        <Image
                                                                            src={song.creator.image}
                                                                            alt={song.creator.name}
                                                                            fill
                                                                            className="object-cover"
                                                                            sizes="20px"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-surface-tertiary flex items-center justify-center text-[8px]">
                                                                            {song.creator.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-text-secondary truncate">
                                                                    {song.creator.name.split(' ')[0]}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] text-text-secondary">Added by: -</span>
                                                        )}
                                                    </div>

                                                    {/* Right Actions: Voting & Optional Delete */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center bg-surface rounded-full px-1 py-0.5 border border-border flex-shrink-0">
                                                            <button
                                                                onClick={() => !song.user_has_voted && handleVote(song)}
                                                                className={`p-1 rounded-full ${song.user_has_voted ? 'text-green-500' : 'text-text-secondary'}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                    <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.16-1.779A10.55 10.55 0 0011 3z" />
                                                                </svg>
                                                            </button>
                                                            <span className={`text-xs font-medium mx-1 min-w-[12px] text-center ${song.user_has_voted ? 'text-green-500' : 'text-text-secondary'}`}>
                                                                {song.vote_count || 0}
                                                            </span>
                                                            <button
                                                                onClick={() => song.user_has_voted && handleVote(song)}
                                                                disabled={!song.user_has_voted}
                                                                className={`p-1 rounded-full ${!song.user_has_voted ? 'text-text-secondary/30' : 'text-text-secondary hover:text-red-400'}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                    <path d="M18.905 12.75a1.25 1.25 0 01-2.5 0v-7.5a1.25 1.25 0 112.5 0v7.5zM8.905 17v1.3c0 .268-.14.526-.395.607A2 2 0 015.905 17c0-.995.182-1.948.514-2.826.204-.54-.166-1.174-.744-1.174h-2.52c-1.243 0-2.261-1.01-2.146-2.247.193-2.08.652-4.082 1.341-5.974C2.752 3.677 3.833 3 5.005 3h3.192a3 3 0 011.341.317l2.734 1.366A3 3 0 0013.613 5h1.292v7h-.963c-.685 0-1.258.483-1.612 1.068a4.011 4.011 0 01-2.16 1.779 10.55 10.55 0 00-1.265 2.153z" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Mobile Delete Option */}
                                                        {(session?.user?.userType === 'admin' || song.created_by === session?.user?.id) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!song.is_recorded) handleDeleteSong(song.id);
                                                                }}
                                                                disabled={song.is_recorded}
                                                                className={`p-1 lg:hidden rounded-full border border-border transition-colors ${song.is_recorded ? 'opacity-30 cursor-not-allowed' : 'text-red-400 hover:bg-red-400/10'}`}
                                                                title={song.is_recorded ? 'Cannot delete recorded song' : 'Delete song'}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <table className="hidden md:table w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-secondary border-b border-border text-text-secondary text-sm uppercase tracking-wider">
                                                <th className="p-4 font-medium cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('title')}>
                                                    Song {sortConfig?.key === 'title' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                                </th>
                                                <th className="p-4 font-medium w-48 cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('key')}>
                                                    Key / Tempo
                                                </th>
                                                <th className="p-4 font-medium w-40 cursor-pointer hover:text-text-primary transition-colors" onClick={() => requestSort('session_date')}>
                                                    Session {sortConfig?.key === 'session_date' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                                </th>
                                                <th className="p-4 font-medium w-32">Requirements</th>
                                                <th className="p-4 font-medium w-32 text-center text-xs">Interested?</th>
                                                <th className="p-4 font-medium w-32 text-center">Added By</th>
                                                <th className="p-4 font-medium w-32 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {songsToRender.map((song) => (
                                                <tr key={song.id} className="hover:bg-surface-hover transition-colors">
                                                    <td className="p-4 max-w-[200px]">
                                                        <div>
                                                            <div className="text-text-primary font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={song.title}>{song.title}</div>
                                                            <div className="text-text-secondary text-sm whitespace-nowrap overflow-hidden text-ellipsis" title={song.artist}>{song.artist || '-'}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-text-secondary">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-text-primary">{song.key || '-'}</span>
                                                            <span className="text-xs">{song.tempo ? `${song.tempo} bpm` : '-'}</span>
                                                        </div>
                                                    </td>
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
                                                    <td className="p-4 text-center">
                                                        <div className="inline-flex items-center bg-surface-tertiary rounded-full p-1 border border-border">
                                                            <button
                                                                onClick={() => !song.user_has_voted && handleVote(song)}
                                                                className={`
                                                                p-1.5 rounded-full transition-colors
                                                                ${song.user_has_voted
                                                                        ? 'text-green-500 bg-green-500/10'
                                                                        : 'text-text-secondary hover:text-green-500 hover:bg-surface-hover'
                                                                    }
                                                            `}
                                                                title="I'm interested"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                    <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.16-1.779A10.55 10.55 0 0011 3z" />
                                                                </svg>
                                                            </button>

                                                            <span className={`text-xs font-medium mx-1.5 min-w-[12px] ${song.user_has_voted ? 'text-green-500' : 'text-text-secondary'}`}>
                                                                {song.vote_count || 0}
                                                            </span>

                                                            <button
                                                                onClick={() => song.user_has_voted && handleVote(song)}
                                                                className={`
                                                                p-1.5 rounded-full transition-colors text-text-secondary hover:text-red-400 hover:bg-surface-hover
                                                                ${!song.user_has_voted ? 'opacity-50 cursor-not-allowed' : ''}
                                                            `}
                                                                disabled={!song.user_has_voted}
                                                                title="Not interested"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                                    <path d="M18.905 12.75a1.25 1.25 0 01-2.5 0v-7.5a1.25 1.25 0 112.5 0v7.5zM8.905 17v1.3c0 .268-.14.526-.395.607A2 2 0 015.905 17c0-.995.182-1.948.514-2.826.204-.54-.166-1.174-.744-1.174h-2.52c-1.243 0-2.261-1.01-2.146-2.247.193-2.08.652-4.082 1.341-5.974C2.752 3.677 3.833 3 5.005 3h3.192a3 3 0 011.341.317l2.734 1.366A3 3 0 0013.613 5h1.292v7h-.963c-.685 0-1.258.483-1.612 1.068a4.011 4.011 0 01-2.16 1.779 10.55 10.55 0 00-1.265 2.153z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {song.creator ? (
                                                                <div className="flex items-center gap-2 group relative">
                                                                    <div className="w-8 h-8 rounded-full overflow-hidden relative border border-border">
                                                                        {song.creator.image ? (
                                                                            <Image
                                                                                src={song.creator.image}
                                                                                alt={song.creator.name}
                                                                                fill
                                                                                className="object-cover"
                                                                                sizes="32px"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-surface-tertiary flex items-center justify-center text-xs">
                                                                                {song.creator.name.charAt(0)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {/* Tooltip */}
                                                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black/80 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                                        {song.creator.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-text-secondary text-xs">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {song.resource_url && (
                                                                <Button
                                                                    variant="primary"
                                                                    className="w-8 h-8 p-0 flex items-center justify-center rounded-full flex-shrink-0"
                                                                    onClick={() => window.open(song.resource_url, '_blank')}
                                                                    title="Play"
                                                                >
                                                                    ▶
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                className="text-xs px-3 py-1.5 h-auto text-text-secondary hover:text-text-primary"
                                                                onClick={() => handleEditSong(song)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            {(session?.user?.userType === 'admin' || song.created_by === session?.user?.id) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    className={`text-xs px-3 py-1.5 h-auto ${song.is_recorded ? 'text-text-secondary/30 cursor-not-allowed' : 'text-text-secondary hover:text-red-400'}`}
                                                                    onClick={() => !song.is_recorded && handleDeleteSong(song.id)}
                                                                    disabled={song.is_recorded}
                                                                    title={song.is_recorded ? 'Cannot delete recorded song' : 'Delete song'}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    );

                    return loading ? (
                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            <div className="p-8 text-center text-text-secondary">Loading songs...</div>
                        </div>
                    ) : songs.length === 0 ? (
                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            <div className="p-8 text-center text-text-secondary">
                                {searchTerm ? 'No songs found matching your search.' : 'No songs in the library yet.'}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Upcoming / To Be Done Section */}
                            <div className="space-y-3">
                                <h2 className="text-lg font-semibold text-text-primary pl-1 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Upcoming / To Be Done
                                    <span className="text-sm font-normal text-text-secondary ml-1 count-badge bg-surface-tertiary px-2 py-0.5 rounded-full">
                                        {upcomingSongs.length}
                                    </span>
                                </h2>
                                {renderSongList(upcomingSongs)}
                            </div>

                            {/* Past Performances Section */}
                            {pastSongs.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-border/50">
                                    <h2 className="text-lg font-semibold text-text-primary pl-1 flex items-center gap-2 opacity-80">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        Past Performances
                                        <span className="text-sm font-normal text-text-secondary ml-1 count-badge bg-surface-tertiary px-2 py-0.5 rounded-full">
                                            {pastSongs.length}
                                        </span>
                                    </h2>
                                    <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">
                                        {renderSongList(pastSongs)}
                                    </div>
                                </div>
                            )}
                        </>
                    );
                })()}
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
