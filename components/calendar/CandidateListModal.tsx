'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { User } from '@/lib/types';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface CandidateListModalProps {
    isOpen: boolean;
    onClose: () => void;
    capabilityId: string | null;
    capabilityName: string | null;
    sessionDetails?: {
        dateFormatted: string;
        timeFormatted: string;
        songCount: number;
    };
}

export default function CandidateListModal({
    isOpen,
    onClose,
    capabilityId,
    capabilityName,
    sessionDetails,
}: CandidateListModalProps) {
    const toast = useToast();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [sending, setSending] = useState(false);
    const [candidates, setCandidates] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) setSelectedUserIds([]);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && capabilityId) {
            fetchCandidates(capabilityId);
        }
    }, [isOpen, capabilityId]);

    const fetchCandidates = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/capabilities/${id}/users`);
            if (response.ok) {
                const data = await response.json();
                setCandidates(data);
            } else {
                console.error('Failed to fetch candidates');
                setCandidates([]);
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
            setCandidates([]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSendInvite = async () => {
        if (selectedUserIds.length === 0) return;
        setSending(true);
        try {
            const res = await fetch('/api/notifications/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: selectedUserIds,
                    candidates,
                    sessionDetails: {
                        ...sessionDetails,
                        missingCapability: capabilityName
                    }
                })
            });
            // Show success via alert for now, or toast
            // Ideally we'd have a toast notification
            if (res.ok) {
                toast.success(`Invites sent to ${selectedUserIds.length} users!`);
                onClose();
            } else {
                toast.error('Failed to send invites.');
            }
        } catch (error) {
            console.error('Error sending invites:', error);
            toast.error('Failed to send invites.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Candidates: ${capabilityName || 'Role'}`} size="xl">
            <div className="space-y-6">
                <p className="text-text-secondary text-sm">
                    Select players to invite for this session. They match the <strong>{capabilityName}</strong> requirement.
                </p>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : candidates.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-1">
                        {candidates.map((user) => {
                            const isSelected = selectedUserIds.includes(user.id);
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
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
                                    <div className="text-xl font-bold text-text-primary mb-1 truncate w-full px-2">
                                        {user.name}
                                    </div>
                                    <div className="text-xs text-text-secondary truncate w-full px-2">
                                        {user.email}
                                    </div>
                                    {user.phone && (
                                        <div className="text-xs text-text-secondary mt-1 opacity-70">
                                            {user.phone}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-text-secondary bg-surface/50 rounded-lg">
                        No users found with this capability.
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button onClick={onClose} variant="ghost" disabled={sending}>
                        Close
                    </Button>
                    <Button
                        onClick={handleSendInvite}
                        variant="primary"
                        disabled={sending || selectedUserIds.length === 0}
                    >
                        {sending ? 'Sending...' : `Send Invite (${selectedUserIds.length})`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
