'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

import CapabilityIcon from '@/components/ui/CapabilityIcon';

import CapabilityModal from '@/components/admin/CapabilityModal';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/providers/ConfirmProvider';

type Capability = {
    id: string;
    name: string;
    icon: string;
    created_at: string;
};

export default function AdminCapabilitiesPage() {
    const toast = useToast();
    const { confirm } = useConfirm();
    const [capabilities, setCapabilities] = useState<Capability[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCapability, setEditingCapability] = useState<Capability | null>(null);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

    useEffect(() => {
        fetchCapabilities();
    }, []);

    const fetchCapabilities = async () => {
        try {
            const response = await fetch('/api/admin/capabilities');
            if (response.ok) {
                const data = await response.json();
                setCapabilities(data);
            }
        } catch (error) {
            console.error('Error fetching capabilities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setModalMode('add');
        setEditingCapability(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (capability: Capability) => {
        setModalMode('edit');
        setEditingCapability(capability);
        setIsModalOpen(true);
    };

    const handleSave = async (name: string, icon: string) => {
        if (modalMode === 'add') {
            // Add new capability
            try {
                const response = await fetch('/api/admin/capabilities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, icon }),
                });

                if (response.ok) {
                    await fetchCapabilities();
                    setIsModalOpen(false);
                    toast.success('Capability created successfully');
                } else {
                    const error = await response.json();
                    toast.error(error.error || 'Failed to create capability');
                }
            } catch (error) {
                console.error('Error creating capability:', error);
                toast.error('Failed to create capability');
            }
        } else {
            // Edit existing capability
            if (!editingCapability) return;

            try {
                const response = await fetch(`/api/admin/capabilities?id=${editingCapability.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, icon }),
                });

                if (response.ok) {
                    await fetchCapabilities();
                    setEditingCapability(null);
                    setIsModalOpen(false);
                    toast.success('Capability updated successfully');
                } else {
                    const error = await response.json();
                    toast.error(error.error || 'Failed to update capability');
                }
            } catch (error) {
                console.error('Error updating capability:', error);
                toast.error('Failed to update capability');
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!await confirm({
            title: 'Delete Capability',
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger'
        })) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/capabilities?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchCapabilities();
                toast.success('Capability deleted successfully');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to delete capability');
            }
        } catch (error) {
            console.error('Error deleting capability:', error);
            toast.error('Failed to delete capability');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-text-secondary">Loading capabilities...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
                >
                    <span className="text-xl">←</span>
                    <span>Back to Admin</span>
                </Link>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Manage Capabilities</h1>
            </div>

            {/* Add New Capability */}
            <div className="bg-surface border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary mb-2">Add New Capability</h2>
                        <p className="text-sm text-text-secondary">Create a new capability with a custom name and icon</p>
                    </div>
                    <Button onClick={handleAddClick} variant="primary">
                        Add Capability
                    </Button>
                </div>
            </div>

            {/* Capabilities List */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-surface-secondary border-b border-border grid grid-cols-[1fr_200px] gap-4">
                    <h2 className="text-lg font-semibold text-text-primary">
                        All Capabilities ({capabilities.length})
                    </h2>
                    <h2 className="text-lg font-semibold text-text-primary text-center">
                        Actions
                    </h2>
                </div>
                <div className="divide-y divide-border">
                    {capabilities.length === 0 ? (
                        <div className="px-6 py-12 text-center text-text-secondary">
                            No capabilities found. Add your first capability above.
                        </div>
                    ) : (
                        capabilities.map(capability => {
                            const capWithOptionalIcon = { ...capability, icon: capability.icon || undefined };
                            return (
                                <div
                                    key={capability.id}
                                    className="px-6 py-4 grid grid-cols-[1fr_200px] gap-4 items-center hover:bg-surface-secondary transition-colors"
                                >
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-8 h-8 md:w-12 md:h-12 bg-primary/20 rounded-lg flex items-center justify-center text-sm md:text-2xl">
                                            <CapabilityIcon capability={capWithOptionalIcon} className="w-4 h-4 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-sm md:text-base text-text-primary capitalize">
                                                <div className="font-medium text-text-primary capitalize">{capability.name}</div>
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 md:gap-2 justify-center">
                                        <Button
                                            onClick={() => handleEditClick(capability)}
                                            variant="ghost"
                                            className="text-[10px] md:text-xs px-2 md:px-3 py-1 h-auto text-text-secondary hover:text-text-primary"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(capability.id, capability.name)}
                                            variant="ghost"
                                            className="text-[10px] md:text-xs px-2 md:px-3 py-1 h-auto text-text-secondary hover:text-red-400"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                    <div className="text-2xl">ℹ️</div>
                    <div>
                        <h3 className="font-semibold text-blue-400 mb-1">About Capabilities</h3>
                        <p className="text-sm text-blue-300/80">
                            Capabilities represent the skills and instruments that users can perform.
                            You cannot delete a capability that is currently assigned to any user.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <CapabilityModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCapability(null);
                }}
                onSave={handleSave}
                initialName={editingCapability?.name || ''}
                initialIcon={editingCapability?.icon || '🎸'}
                title={modalMode === 'add' ? 'Add Capability' : 'Edit Capability'}
            />
        </div>
    );
}
