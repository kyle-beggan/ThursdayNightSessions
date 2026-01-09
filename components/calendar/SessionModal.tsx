'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SessionWithDetails, SessionCommitment, Capability } from '@/lib/types';
// ... (skipping lines, I have to be careful not to overwrite too much if I use huge range)
// I will use two replacements via AllowMultiple: false? No, I need multiple chunks or just one big chunk?
// "Do NOT make multiple parallel calls to this tool"
// I will just use one replacement for the import, and then another tool call for the logic?
// No, I can use multi_replace checks.
// But I'll do it in one tool call if the lines are close? No, lines 4 and 27.
// Use multi_replace_file_content.
import { formatDate, formatTime } from '@/lib/utils';

interface SessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: SessionWithDetails;
    onUpdate: () => void;
}

export default function SessionModal({ isOpen, onClose, session, onUpdate }: SessionModalProps) {
    const { data: sessionData } = useSession();
    const [isCommitting, setIsCommitting] = useState(false);
    const [step, setStep] = useState<'details' | 'rsvp'>('details');
    const [userCapabilities, setUserCapabilities] = useState<Capability[]>([]);
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
    const [isLoadingCapabilities, setIsLoadingCapabilities] = useState(false);

    const userId = sessionData?.user?.id;
    const userCommitment = session.commitments?.find((c: SessionCommitment) => c.user_id === userId);
    const isCommitted = !!userCommitment;

    const fetchUserCapabilities = async () => {
        setIsLoadingCapabilities(true);
        try {
            const res = await fetch('/api/capabilities');
            if (res.ok) {
                const data = await res.json();
                setUserCapabilities(data || []);
                // If user has only one capability, pre-select it
                if (data?.length === 1) {
                    setSelectedCapabilities([data[0].id]);
                }
            }
        } catch (error) {
            console.error('Error fetching capabilities:', error);
        } finally {
            setIsLoadingCapabilities(false);
        }
    };

    const handleRsvpClick = () => {
        if (userCapabilities.length === 0) {
            fetchUserCapabilities();
        }
        setStep('rsvp');
    };

    const handleCapabilityToggle = (capId: string) => {
        setSelectedCapabilities(prev =>
            prev.includes(capId)
                ? prev.filter(id => id !== capId)
                : [...prev, capId]
        );
    };

    const [validationError, setValidationError] = useState<string | null>(null);

    const handleConfirmRsvp = async () => {
        if (!userId) return;

        setIsCommitting(true);
        setValidationError(null);
        try {
            const response = await fetch('/api/commitments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: session.id,
                    user_id: userId,
                    capability_ids: selectedCapabilities
                }),
            });

            if (response.ok) {
                onUpdate();
                handleClose();
            } else {
                const data = await response.json();
                setValidationError(data.error || 'Failed to confirm RSVP');
            }
        } catch (error) {
            console.error('Error confirming RSVP:', error);
            setValidationError('An unexpected error occurred');
        } finally {
            setIsCommitting(false);
        }
    };

    const handleCancelRsvp = async () => {
        if (!userId) return;

        setIsCommitting(true);
        try {
            const response = await fetch('/api/commitments', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: session.id,
                    user_id: userId,
                }),
            });

            if (response.ok) {
                onUpdate();
                handleClose();
            }
        } catch (error) {
            console.error('Error cancelling RSVP:', error);
        } finally {
            setIsCommitting(false);
        }
    };

    const handleClose = () => {
        setStep('details');
        setSelectedCapabilities([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={step === 'details' ? "Session Details" : "Confirm RSVP"} size="lg" className="!p-5">
            <div className="space-y-6">
                {step === 'details' ? (
                    <>
                        {/* Date and Time */}
                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Date & Time</h4>
                            <p className="text-text-primary">
                                {formatDate(session.date)}
                            </p>
                            <p className="text-text-secondary">
                                {formatTime(session.start_time)} - {formatTime(session.end_time)} EST
                            </p>
                        </div>

                        {/* Songs */}
                        {session.songs && session.songs.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Songs</h4>
                                <div className="space-y-2">
                                    {session.songs.map((song) => (
                                        <div key={song.id} className="bg-surface/50 rounded-lg p-3">
                                            <div className="font-medium text-text-primary">{song.song_name}</div>
                                            {song.song_url && (
                                                <a
                                                    href={song.song_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-secondary hover:underline"
                                                >
                                                    Listen →
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Committed Players */}
                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">
                                Committed Players ({session.commitments?.length || 0})
                            </h4>
                            {session.commitments && session.commitments.length > 0 ? (
                                <div className="space-y-3">
                                    {session.commitments.map((commitment) => (
                                        <div key={commitment.id} className="bg-surface/50 rounded-lg p-3">
                                            <div className="font-medium text-text-primary mb-2">
                                                {commitment.user?.name}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {/* Use capabilities from the commitment, fallback to user capabilities if migration not fully applied for old data */}
                                                {(commitment.capabilities && commitment.capabilities.length > 0
                                                    ? commitment.capabilities
                                                    : commitment.user?.capabilities
                                                )?.map((cap) => (
                                                    <span
                                                        key={cap.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                                                    >
                                                        <span className="text-base">{cap.icon || '🎵'}</span>
                                                        <span>{cap.name}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-secondary text-sm">No commitments yet</p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-3 pt-4 border-t border-border">
                            {isCommitted ? (
                                <Button
                                    onClick={handleCancelRsvp}
                                    variant="danger"
                                    disabled={isCommitting}
                                    className="w-[150px]"
                                >
                                    {isCommitting ? 'Cancelling...' : 'Cancel RSVP'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleRsvpClick}
                                    variant="primary"
                                    disabled={isCommitting}
                                    className="w-[150px]"
                                >
                                    RSVP
                                </Button>
                            )}
                            <Button
                                onClick={handleClose}
                                variant="ghost"
                                className="w-[150px] bg-gray-500 hover:bg-black text-white hover:text-white border-transparent"
                            >
                                Close
                            </Button>
                        </div>

                    </>
                ) : (
                    <>
                        <div className="bg-surface/50 rounded-lg p-4 mb-4">
                            <p className="text-text-primary mb-4">
                                What will you be playing/doing for this session?
                            </p>

                            {isLoadingCapabilities ? (
                                <div className="text-center py-4 text-text-secondary">Loading capabilities...</div>
                            ) : (
                                <div className="space-y-2">
                                    {userCapabilities.map(cap => (
                                        <label
                                            key={cap.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedCapabilities.includes(cap.id)
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-surface border-border hover:border-text-secondary'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedCapabilities.includes(cap.id)}
                                                onChange={() => handleCapabilityToggle(cap.id)}
                                            />
                                            <div className="w-5 h-5 rounded border border-text-secondary flex items-center justify-center">
                                                {selectedCapabilities.includes(cap.id) && (
                                                    <div className="w-3 h-3 bg-primary rounded-sm" />
                                                )}
                                            </div>
                                            <span className="text-xl">{cap.icon || '🎵'}</span>
                                            <span className="font-medium text-text-primary capitalize">{cap.name}</span>
                                        </label>
                                    ))}

                                    {userCapabilities.length === 0 && (
                                        <p className="text-text-secondary text-sm">
                                            No capabilities found.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {validationError && (
                            <div className="text-red-500 text-sm text-center mb-2">
                                {validationError}
                            </div>
                        )}

                        <div className="flex justify-center gap-3 pt-4 border-t border-border">
                            <Button
                                onClick={handleConfirmRsvp}
                                variant="primary"
                                disabled={isCommitting || selectedCapabilities.length === 0}
                                className="w-[150px]"
                            >
                                {isCommitting ? 'Confirming...' : 'Confirm RSVP'}
                            </Button>
                            <Button
                                onClick={() => setStep('details')}
                                variant="ghost"
                                disabled={isCommitting}
                                className="w-[150px] bg-gray-500 hover:bg-black text-white hover:text-white border-transparent"
                            >
                                Back
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
