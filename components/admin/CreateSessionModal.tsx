import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Song, SessionCommitment, SessionRecording, SessionPhoto } from '@/lib/types';
import PhotoGallery from '@/components/session/PhotoGallery';
import CapabilityIcon from '@/components/ui/CapabilityIcon';
import { createClient } from '@/lib/supabase/client';

import { FaInfoCircle, FaUserFriends, FaMicrophone, FaCamera } from 'react-icons/fa';

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionCreated: () => void;
    initialData?: {
        id: string;
        date: string;
        start_time: string;
        end_time: string;
        songs?: Song[];
        commitments?: SessionCommitment[];
        recordings?: SessionRecording[];
        photos?: SessionPhoto[];
    } | null;
}

export default function CreateSessionModal({ isOpen, onClose, onSessionCreated, initialData }: CreateSessionModalProps) {
    const router = useRouter();
    const toast = useToast();
    const [formData, setFormData] = useState({
        date: '',
        start_time: '20:00',
        end_time: '00:00',
    });
    const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
    const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
    const [songSearch, setSongSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSongs, setIsLoadingSongs] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'players' | 'recordings' | 'photos'>('details');
    const [isUploading, setIsUploading] = useState(false);
    const [photoCount, setPhotoCount] = useState(0);



    const handlePhotoUpdate = useCallback((count?: number) => {
        if (typeof count === 'number') {
            setPhotoCount(count);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchSongs();
            if (initialData) {
                setFormData({
                    date: initialData.date,
                    start_time: initialData.start_time.slice(0, 5),
                    end_time: initialData.end_time.slice(0, 5),
                });
                if (initialData.songs) {
                    setSelectedSongs(initialData.songs);
                }
                setPhotoCount(initialData.photos?.length || 0);
            } else {
                setFormData({
                    date: '',
                    start_time: '20:00',
                    end_time: '00:00',
                });
                setSelectedSongs([]);
            }
            setActiveTab('details');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialData]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !initialData?.id) return;
        const file = e.target.files[0];

        setIsUploading(true);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${initialData.id}/${Date.now()}.${fileExt}`;

            // 1. Get signed upload URL
            const signRes = await fetch('/api/recordings/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, fileType: file.type })
            });

            if (!signRes.ok) throw new Error('Failed to get upload permission');
            const { token, path } = await signRes.json();

            // 2. Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('recordings')
                .uploadToSignedUrl(path, token, file);

            if (uploadError) throw uploadError;

            // 3. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('recordings')
                .getPublicUrl(path);

            // 4. Save metadata
            const res = await fetch('/api/recordings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: initialData.id,
                    url: publicUrl,
                    title: file.name
                })
            });

            if (!res.ok) throw new Error('Failed to save metadata');

            toast.success('Recording uploaded');
            onSessionCreated(); // Refresh data
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload recording');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDeleteRecording = async (recordingId: string) => {
        if (!confirm('Are you sure you want to delete this recording?')) return;

        try {
            const res = await fetch(`/api/recordings/${recordingId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Recording deleted');
                onSessionCreated(); // Refresh data
            } else {
                toast.error('Failed to delete recording');
            }
        } catch (error) {
            console.error('Error deleting recording:', error);
            toast.error('Failed to delete recording');
        }
    };

    const fetchSongs = async () => {
        setIsLoadingSongs(true);
        try {
            const queryParams = !initialData ? '?available_only=true' : '';
            const res = await fetch(`/api/songs${queryParams}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableSongs(data);
            }
        } catch (error) {
            console.error('Error fetching songs:', error);
        } finally {
            setIsLoadingSongs(false);
        }
    };

    const handleSongToggle = (song: Song) => {
        if (selectedSongs.some(s => s.id === song.id)) {
            setSelectedSongs(selectedSongs.filter(s => s.id !== song.id));
        } else {
            setSelectedSongs([...selectedSongs, song]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = initialData?.id
                ? `/api/sessions/${initialData.id}`
                : '/api/sessions';

            const method = initialData?.id ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    start_time: formData.start_time + ':00',
                    end_time: formData.end_time + ':00',
                    songs: selectedSongs.map(s => ({
                        song_name: s.title,
                        song_url: s.resource_url
                    }))
                })
            });

            if (res.ok) {
                toast.success(initialData ? 'Session updated successfully' : 'Session created successfully');
                if (!initialData) {
                    setFormData({
                        date: '',
                        start_time: '19:30',
                        end_time: '23:30',
                    });
                    setSelectedSongs([]);
                }
                setSongSearch('');
                onSessionCreated();
                onClose();
            } else {
                toast.error('Failed to save session');
            }
        } catch (error) {
            console.error('Error saving session:', error);
            toast.error('Failed to save session');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredSongs = availableSongs.filter(song =>
    (song.title.toLowerCase().includes(songSearch.toLowerCase()) ||
        song.artist?.toLowerCase().includes(songSearch.toLowerCase()))
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Session" : "Create New Session"} size="xl" className="!p-5 h-[90dvh] md:h-[80vh] flex flex-col">
            <div className="flex flex-col flex-1 min-h-0">
                {initialData?.id && (
                    <div className="flex gap-2 p-1 bg-surface-secondary/30 border border-border rounded-xl mb-6 shrink-0 overflow-x-auto">
                        <button
                            type="button"
                            className={`flex-1 min-w-[100px] px-3 py-3 text-sm md:text-base font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'details'
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.02]'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                }`}
                            onClick={() => setActiveTab('details')}
                        >
                            <FaInfoCircle className="w-4 h-4" />
                            <span className="hidden md:inline">Details</span>
                        </button>
                        <button
                            type="button"
                            className={`flex-1 min-w-[100px] px-3 py-3 text-sm md:text-base font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'players'
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.02]'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                }`}
                            onClick={() => setActiveTab('players')}
                        >
                            <FaUserFriends className="w-4 h-4" />
                            <span className="hidden md:inline">Players ({initialData?.commitments?.length || 0})</span>
                        </button>
                        <button
                            type="button"
                            className={`flex-1 min-w-[100px] px-3 py-3 text-sm md:text-base font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'recordings'
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.02]'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                }`}
                            onClick={() => setActiveTab('recordings')}
                        >
                            <FaMicrophone className="w-4 h-4" />
                            <span className="hidden md:inline">Recs ({initialData?.recordings?.length || 0})</span>
                        </button>
                        <button
                            type="button"
                            className={`flex-1 min-w-[100px] px-3 py-3 text-sm md:text-base font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'photos'
                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.02]'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                }`}
                            onClick={() => setActiveTab('photos')}
                        >
                            <FaCamera className="w-4 h-4" />
                            <span className="hidden md:inline">Photos ({photoCount})</span>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-6">
                        {activeTab === 'details' && (
                            <>
                                {/* Date & Time Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Session Details</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Date *</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            min={initialData ? undefined : new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Start Time</label>
                                            <input
                                                type="time"
                                                required
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                                value={formData.start_time}
                                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">End Time</label>
                                            <input
                                                type="time"
                                                required
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                                                value={formData.end_time}
                                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Song Selection Section */}
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Select Songs</h3>

                                    <input
                                        type="text"
                                        placeholder="Search songs..."
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        value={songSearch}
                                        onChange={(e) => setSongSearch(e.target.value)}
                                    />

                                    <div className="max-h-[400px] overflow-y-auto rounded-lg bg-surface/50 border border-border p-4">
                                        {isLoadingSongs ? (
                                            <div className="text-center text-text-secondary py-8">Loading songs...</div>
                                        ) : filteredSongs.length === 0 ? (
                                            <div className="text-center text-text-secondary py-8">
                                                {songSearch ? 'No matching songs found' : 'No available songs'}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {filteredSongs.map(song => {
                                                    const isSelected = selectedSongs.some(s => s.id === song.id || s.title === song.title);
                                                    return (
                                                        <div
                                                            key={song.id}
                                                            onClick={() => handleSongToggle(song)}
                                                            className={`
                                                                cursor-pointer p-2 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center h-[80px] relative group
                                                                ${isSelected
                                                                    ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                                                    : 'bg-surface border-border hover:border-primary/50 hover:bg-surface-hover hover:shadow-lg'
                                                                }
                                                            `}
                                                        >
                                                            <div className="font-bold text-sm text-text-primary truncate w-full px-2">{song.title}</div>
                                                            <div className="text-xs text-text-secondary truncate w-full px-2">{song.artist}</div>
                                                            {isSelected && (
                                                                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Create New Song Button */}
                                    <div className="flex justify-center pt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-text-secondary hover:text-primary transition-colors text-xs"
                                            onClick={() => router.push('/songs')}
                                        >
                                            Don&apos;t see the song? Create it in the Song Library
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'players' && initialData && (
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-3">Committed Players</h3>
                                {initialData.commitments && initialData.commitments.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {initialData.commitments.map((commitment) => (
                                            <div key={commitment.id} className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-text-primary">{commitment.user?.name}</div>
                                                    <div className="flex gap-1 mt-1">
                                                        {(commitment.capabilities || []).map((cap) => (
                                                            <CapabilityIcon key={cap.id} capability={cap} className="w-3 h-3 text-primary" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-text-secondary italic">No players committed yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'recordings' && initialData && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold text-text-primary">Recordings</h3>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="audio/*,video/*"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                            className="hidden"
                                            id="admin-recording-upload"
                                        />
                                        <label
                                            htmlFor="admin-recording-upload"
                                            className={`
                                                cursor-pointer inline-flex items-center justify-center rounded-lg font-medium transition-colors
                                                text-xs h-6 px-2 text-primary bg-surface border border-border hover:bg-primary/10
                                                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            {isUploading ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-4 w-4 text-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Uploading...</span>
                                                </span>
                                            ) : (
                                                '+ Add Recording'
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {initialData.recordings && initialData.recordings.length > 0 ? (
                                        initialData.recordings.map((rec) => (
                                            <div key={rec.id} className="flex items-center justify-between p-3 bg-surface-secondary/30 rounded-lg border border-border">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                                                        <FaMicrophone className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-text-primary truncate">{rec.title}</div>
                                                        <a href={rec.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                                            View / Download
                                                        </a>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteRecording(rec.id)}
                                                    className="text-text-secondary hover:text-red-500"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-text-secondary italic text-sm">No recordings uploaded.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'photos' && initialData && (
                            <div className="pt-2">
                                <PhotoGallery
                                    sessionId={initialData.id}
                                    onUpdate={handlePhotoUpdate}
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                        >
                            {initialData ? 'Save Changes' : 'Create Session'}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
