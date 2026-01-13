import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Song } from '@/lib/types';

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
    } | null;
}

export default function CreateSessionModal({ isOpen, onClose, onSessionCreated, initialData }: CreateSessionModalProps) {
    const toast = useToast();
    const [formData, setFormData] = useState({
        date: '',
        start_time: '19:30',
        end_time: '23:30',
    });
    const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
    const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
    const [songSearch, setSongSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSongs, setIsLoadingSongs] = useState(false);

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
            } else {
                setFormData({
                    date: '',
                    start_time: '19:30',
                    end_time: '23:30',
                });
                setSelectedSongs([]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialData]);

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
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Session" : "Create New Session"} size="xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date & Time Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Session Details</h3>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Date *</label>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
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
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">End Time</label>
                            <input
                                type="time"
                                required
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
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
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-primary text-white rounded-full text-[10px] font-bold">
                                                    ✓
                                                </div>
                                            )}
                                            <div className="w-full px-1">
                                                <h4 className={`font-medium text-xs mb-0.5 line-clamp-2 leading-tight ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                                                    {song.title}
                                                </h4>
                                                {song.artist && (
                                                    <p className="text-[10px] text-text-secondary line-clamp-1">{song.artist}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Selection Summary */}
                    <div className="text-xs text-text-secondary text-right">
                        {selectedSongs.length} song{selectedSongs.length !== 1 ? 's' : ''} selected
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="ghost"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Session' : 'Create Session')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
