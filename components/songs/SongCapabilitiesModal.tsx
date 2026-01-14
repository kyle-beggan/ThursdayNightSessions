import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CapabilityIcon from '@/components/ui/CapabilityIcon';
import { Song } from '@/lib/types';
import { useToast } from '@/hooks/useToast';

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
    const toast = useToast();
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
            const res = await fetch('/api/capabilities');
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

        if (!song || !song.id) {
            console.error('Invalid song object:', song);
            toast.error(`Error: Invalid Song ID. Value: "${song?.id}". Please refresh.`);
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
                toast.success('Capabilities saved successfully');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save capabilities');
            }
        } catch (error) {
            console.error('Error saving capabilities:', error);
            toast.error('Failed to save capabilities');
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                        {allCapabilities.map(cap => {
                            const isSelected = selectedCapabilities.includes(cap.id);
                            return (
                                <div
                                    key={cap.id}
                                    onClick={() => toggleCapability(cap.id)}
                                    className={`
                                        cursor-pointer flex items-center gap-2 p-3 rounded-lg border transition-colors relative group min-h-[48px]
                                        ${isSelected
                                            ? 'bg-primary/10 border-primary'
                                            : 'bg-surface border-border hover:bg-surface-secondary'
                                        }
                                    `}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <CapabilityIcon capability={cap} className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium text-text-primary capitalize">{cap.name}</span>
                                    {isSelected && (
                                        <div className="ml-auto flex items-center justify-center w-5 h-5 text-primary text-xs font-bold">
                                            ✓
                                        </div>
                                    )}
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
