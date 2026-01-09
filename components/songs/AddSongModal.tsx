'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface AddSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSongAdded: () => void;
}

export default function AddSongModal({ isOpen, onClose, onSongAdded }: AddSongModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        key: '',
        tempo: '',
        resource_url: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to add song');

            setFormData({ title: '', artist: '', key: '', tempo: '', resource_url: '' });
            onSongAdded();
            onClose();
        } catch (error) {
            console.error('Error adding song:', error);
            alert('Failed to add song');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Song">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Song Title"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Artist</label>
                    <input
                        type="text"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.artist}
                        onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                        placeholder="Artist Name"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Key</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.key}
                            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                            placeholder="e.g. Cm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Tempo</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.tempo}
                            onChange={(e) => setFormData({ ...formData, tempo: e.target.value })}
                            placeholder="e.g. 120 BPM"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Link (Chords/Tabs)</label>
                    <input
                        type="url"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.resource_url}
                        onChange={(e) => setFormData({ ...formData, resource_url: e.target.value })}
                        placeholder="https://..."
                    />
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
                        {isSubmitting ? 'Adding...' : 'Add Song'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
