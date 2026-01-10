'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { SessionWithDetails, SessionCommitment, Capability } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

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
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const userId = sessionData?.user?.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userType = (sessionData?.user as any)?.userType;
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setIsUploading(true);
        setUploadError(null);

        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.id}/${Date.now()}.${fileExt}`;

            // 1. Get signed upload URL from key API (bypassing RLS issues for Supabase Auth vs NextAuth)
            const signRes = await fetch('/api/recordings/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName, fileType: file.type })
            });

            if (!signRes.ok) throw new Error('Failed to get upload permission');
            const { signedUrl, token, path } = await signRes.json();

            // 2. Upload to Supabase using the signed URL/token
            const { error: uploadError } = await supabase.storage
                .from('recordings')
                .uploadToSignedUrl(path, token, file);

            if (uploadError) throw uploadError;

            // 3. Get public URL for saving
            const { data: { publicUrl } } = supabase.storage
                .from('recordings')
                .getPublicUrl(path);

            // 4. Save metadata to DB
            const res = await fetch('/api/recordings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: session.id,
                    url: publicUrl,
                    title: file.name
                })
            });

            if (!res.ok) throw new Error('Failed to save metadata');

            onUpdate();
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadError('Failed to upload recording. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (e.target) e.target.value = '';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={step === 'details' ? "Session Details" : "Confirm RSVP"} size="xl" className="!p-5">
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
                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Songs</h4>
                            {session.songs && session.songs.length > 0 ? (
                                <div className="space-y-2">
                                    {session.songs.map((song) => (
                                        <div key={song.id} className="bg-surface/50 rounded-lg p-3">
                                            <div className="font-medium text-text-primary">{song.song_name}</div>
                                            {song.song_artist && (
                                                <div className="text-sm text-text-secondary">{song.song_artist}</div>
                                            )}
                                            {song.song_url && (
                                                <a
                                                    href={song.song_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-secondary hover:underline mt-1 inline-block"
                                                >
                                                    Listen →
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-secondary italic text-sm">Songs TBD</p>
                            )}
                        </div>

                        {/* Committed Players */}
                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">
                                Committed Players ({session.commitments?.length || 0})
                            </h4>
                            {session.commitments && session.commitments.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {session.commitments.map((commitment) => (
                                        <div key={commitment.id} className="bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] rounded-lg p-3 transition-all duration-200 group flex flex-col items-center text-center">
                                            <div className="font-medium text-text-primary mb-2 w-full truncate">
                                                {commitment.user?.name}
                                            </div>
                                            <div className="flex flex-wrap gap-1 justify-center">
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
                                                        <span className="capitalize">{cap.name}</span>
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

                        {/* Recordings */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-text-secondary">
                                    Recordings ({session.recordings?.length || 0})
                                </h4>
                                {userType === 'admin' && (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="audio/*,video/*"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                            className="hidden"
                                            id="recording-upload"
                                        />
                                        <label
                                            htmlFor="recording-upload"
                                            className={`
                                            cursor-pointer text-xs bg-surface border border-border px-2 py-1 rounded 
                                            hover:bg-surface-hover transition-colors
                                            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                        >
                                            {isUploading ? 'Uploading...' : '+ Add Recording'}
                                        </label>
                                    </div>
                                )}
                            </div>

                            {uploadError && (
                                <div className="text-red-500 text-xs mb-2">{uploadError}</div>
                            )}

                            <div className="space-y-2">
                                {session.recordings && session.recordings.length > 0 ? (
                                    session.recordings.map((rec: any) => (
                                        <div key={rec.id} className="flex items-center justify-between bg-surface/50 rounded-lg p-2 text-sm">
                                            <div className="truncate max-w-[200px] text-text-primary" title={rec.title}>
                                                {rec.title}
                                            </div>
                                            <a
                                                href={rec.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline text-xs"
                                            >
                                                Play
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-text-secondary text-xs italic">
                                        No recordings yet.
                                    </p>
                                )}
                            </div>
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
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {userCapabilities.map(cap => {
                                        const isSelected = selectedCapabilities.includes(cap.id);
                                        return (
                                            <div
                                                key={cap.id}
                                                onClick={() => handleCapabilityToggle(cap.id)}
                                                className={`
                                                cursor-pointer p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center h-[100px] relative group
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
                                                <div className="absolute top-2 left-2 text-xl">
                                                    {cap.icon || '🎵'}
                                                </div>
                                                <div className="mt-4 font-medium text-text-primary capitalize text-sm">
                                                    {cap.name}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {userCapabilities.length === 0 && (
                                        <p className="text-text-secondary text-sm col-span-full text-center">
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
