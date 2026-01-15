'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Song, Capability } from '@/lib/types';
import CapabilityIcon from '@/components/ui/CapabilityIcon';

interface AddSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSongAdded: () => void;
    initialData?: Song | null;
}

export default function AddSongModal({ isOpen, onClose, onSongAdded, initialData }: AddSongModalProps) {
    const toast = useToast();
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        key: '',
        tempo: '',
        resource_url: '',
        capabilities: [] as string[]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableCapabilities, setAvailableCapabilities] = useState<Capability[]>([]);
    const [isLoadingCaps, setIsLoadingCaps] = useState(false);

    // Fetch capabilities on mount
    useEffect(() => {
        const fetchCapabilities = async () => {
            setIsLoadingCaps(true);
            try {
                const res = await fetch('/api/capabilities');
                if (res.ok) {
                    const data = await res.json();
                    // Filter out 'hanging out' capability
                    const filtered = data.filter((c: Capability) => c.name.toLowerCase() !== 'hanging out');
                    setAvailableCapabilities(filtered);
                }
            } catch (error) {
                console.error('Error fetching capabilities:', error);
            } finally {
                setIsLoadingCaps(false);
            }
        };

        if (isOpen) {
            fetchCapabilities();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                title: initialData.title,
                artist: initialData.artist || '',
                key: initialData.key || '',
                tempo: initialData.tempo || '',
                resource_url: initialData.resource_url || '',
                capabilities: initialData.capabilities?.map(c => c.id) || []
            });
        } else if (isOpen && !initialData) {
            setFormData({
                title: '',
                artist: '',
                key: '',
                tempo: '',
                resource_url: '',
                capabilities: []
            });
        }
    }, [isOpen, initialData]);

    // Set default capabilities for new songs
    useEffect(() => {
        if (isOpen && !initialData && availableCapabilities.length > 0) {
            const engineerCap = availableCapabilities.find(c => c.name.toLowerCase() === 'engineer');
            if (engineerCap) {
                setFormData(prev => {
                    // Only apply default if capabilities list is empty (fresh form)
                    if (prev.capabilities.length === 0) {
                        return { ...prev, capabilities: [engineerCap.id] };
                    }
                    return prev;
                });
            }
        }
    }, [availableCapabilities, isOpen, initialData]);

    const handleCapabilityToggle = (capId: string) => {
        setFormData(prev => {
            const current = prev.capabilities;
            if (current.includes(capId)) {
                return { ...prev, capabilities: current.filter(id => id !== capId) };
            } else {
                return { ...prev, capabilities: [...current, capId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = initialData ? `/api/songs/${initialData.id}` : '/api/songs';
            const method = initialData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(initialData ? 'Song updated successfully' : 'Song added successfully');
                setFormData({ title: '', artist: '', key: '', tempo: '', resource_url: '', capabilities: [] });
                onSongAdded();
                onClose();
            } else {
                toast.error(initialData ? 'Failed to update song' : 'Failed to add song');
            }
        } catch (error) {
            console.error(initialData ? 'Error updating song:' : 'Error adding song:', error);
            toast.error(initialData ? 'Failed to update song' : 'Failed to add song');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Song" : "Add New Song"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
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
                    </div>

                    {/* Capabilities Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-secondary">Required Capabilities</label>
                        <div className="bg-surface-secondary/30 rounded-lg p-3 border border-border h-[280px] overflow-y-auto">
                            {isLoadingCaps ? (
                                <div className="text-center py-8 text-text-secondary text-sm">Loading...</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {availableCapabilities.map(cap => {
                                        const isSelected = formData.capabilities.includes(cap.id);
                                        return (
                                            <div
                                                key={cap.id}
                                                onClick={() => handleCapabilityToggle(cap.id)}
                                                className={`
                                                    cursor-pointer flex items-center gap-2 p-2 rounded-lg border transition-colors relative group
                                                    ${isSelected
                                                        ? 'bg-primary/10 border-primary'
                                                        : 'bg-surface border-border hover:bg-surface-secondary'
                                                    }
                                                `}
                                            >
                                                <div className="w-4 h-4 flex items-center justify-center">
                                                    <CapabilityIcon capability={cap} className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-medium text-text-primary capitalize">{cap.name}</span>
                                                {isSelected && (
                                                    <div className="ml-auto text-primary text-xs font-bold">✓</div>
                                                )}
                                            </div>
                                        );
                                    })}
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
                        {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Song')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
