import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Song } from '@/lib/types';

interface Capability {
    id: string;
    name: string;
    icon?: string;
}

interface SongCapabilitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    song: Song | null;
    onSave: () => void;
}

export default function SongCapabilitiesModal({ isOpen, onClose, song, onSave }: SongCapabilitiesModalProps) {
    const [allCapabilities, setAllCapabilities] = useState<Capability[]>([]);
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && song) {
            fetchCapabilities();
            setSelectedCapabilities(song.capabilities?.map((c) => c.id) || []);
        }
    }, [isOpen, song]);

    const fetchCapabilities = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/capabilities');
            if (res.ok) {
                const data = await res.json();
                setAllCapabilities(data);
            }
        } catch (error) {
            console.error('Error fetching capabilities:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCapability = (capId: string) => {
        setSelectedCapabilities(prev =>
            prev.includes(capId)
                ? prev.filter(id => id !== capId)
                : [...prev, capId]
        );
    };

    const handleSave = async () => {
        console.log('Modal handleSave, song:', song);
        if (!song) return;

        if (!song.id || String(song.id) === 'undefined' || String(song.id) === 'null') {
            console.error('Song object missing ID:', song);
            alert(`Error: Invalid Song ID. Value: "${song.id}", Type: ${typeof song.id}. Please refresh and try again.`);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/songs/${song.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    capabilities: selectedCapabilities
                })
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save capabilities');
            }
        } catch (error) {
            console.error('Error saving capabilities:', error);
            alert('Failed to save capabilities');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Required Capabilities: ${song?.title || ''}`} size="xl">
            <div className="space-y-6">
                <p className="text-text-secondary text-sm">
                    Select the instruments and skills required for this song.
                </p>

                {loading ? (
                    <div className="text-center py-8 text-text-secondary">Loading capabilities...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                        {allCapabilities.map(cap => {
                            const isSelected = selectedCapabilities.includes(cap.id);
                            return (
                                <div
                                    key={cap.id}
                                    onClick={() => toggleCapability(cap.id)}
                                    className={`
                                        cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center h-[120px] relative group
                                        ${isSelected
                                            ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                            : 'bg-surface border-border hover:border-primary/50 hover:bg-surface-hover hover:shadow-lg'
                                        }
                                    `}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full text-xs font-bold">
                                            ✓
                                        </div>
                                    )}
                                    <div className="text-3xl mb-2">
                                        {cap.icon || '🎵'}
                                    </div>
                                    <h4 className={`font-medium text-sm capitalize ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                                        {cap.name}
                                    </h4>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button onClick={onClose} variant="ghost" disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
