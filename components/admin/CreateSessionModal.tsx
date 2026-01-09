import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Song } from '@/lib/types';

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionCreated: () => void;
}

export default function CreateSessionModal({ isOpen, onClose, onSessionCreated }: CreateSessionModalProps) {
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
        }
    }, [isOpen]);

    const fetchSongs = async () => {
        setIsLoadingSongs(true);
        try {
            const res = await fetch('/api/songs?available_only=true');
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
            const res = await fetch('/api/sessions', {
                method: 'POST',
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

            if (!res.ok) throw new Error('Failed to create session');

            setFormData({
                date: '',
                start_time: '19:30',
                end_time: '23:30',
            });
            setSelectedSongs([]);
            setSongSearch('');
            onSessionCreated();
            onClose();
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredSongs = availableSongs.filter(song =>
        !selectedSongs.some(s => s.id === song.id) &&
        (song.title.toLowerCase().includes(songSearch.toLowerCase()) ||
            song.artist?.toLowerCase().includes(songSearch.toLowerCase()))
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Session" size="lg">
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
                            min={new Date().toISOString().split('T')[0]}
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
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Add Songs</h3>

                    {/* Selected Songs */}
                    {selectedSongs.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <label className="block text-sm font-medium text-text-secondary">Selected Songs:</label>
                            <div className="flex flex-wrap gap-2">
                                {selectedSongs.map(song => (
                                    <div key={song.id} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                                        <span>{song.title}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleSongToggle(song)}
                                            className="hover:text-primary-dark font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search & List */}
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Search available songs..."
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            value={songSearch}
                            onChange={(e) => setSongSearch(e.target.value)}
                        />

                        <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-surface/50">
                            {isLoadingSongs ? (
                                <div className="p-4 text-center text-text-secondary text-sm">Loading songs...</div>
                            ) : filteredSongs.length === 0 ? (
                                <div className="p-4 text-center text-text-secondary text-sm">
                                    {songSearch ? 'No matching songs found' : 'No available songs to add'}
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredSongs.map(song => (
                                        <div
                                            key={song.id}
                                            className="p-3 hover:bg-surface-hover cursor-pointer flex justify-between items-center group"
                                            onClick={() => handleSongToggle(song)}
                                        >
                                            <div>
                                                <div className="text-sm font-medium text-text-primary">{song.title}</div>
                                                <div className="text-xs text-text-secondary">{song.artist}</div>
                                            </div>
                                            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xl">+</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
                        {isSubmitting ? 'Creating...' : 'Create Session'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
