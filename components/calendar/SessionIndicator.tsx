'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { SessionWithDetails } from '@/lib/types';
import { format } from 'date-fns';
import CandidateListModal from './CandidateListModal';
import RemindPreviewModal from './RemindPreviewModal';
import CapabilityIcon from '@/components/ui/CapabilityIcon';
import { useToast } from '@/hooks/useToast';

interface SessionIndicatorProps {
    session: SessionWithDetails;
    onClick: () => void;
    className?: string;
}



const toProperCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

export default function SessionIndicator({ session, onClick, className }: SessionIndicatorProps) {
    const { data: authSession } = useSession();
    const toast = useToast();
    const [showTooltip, setShowTooltip] = useState(false);
    const [candidateModal, setCandidateModal] = useState<{ isOpen: boolean; capabilityId: string | null; capabilityName: string | null }>({
        isOpen: false,
        capabilityId: null,
        capabilityName: null,
    });
    const [isRemindModalOpen, setIsRemindModalOpen] = useState(false);
    const [isSendingRemind, setIsSendingRemind] = useState(false);

    const committedCount = session.commitments?.length || 0;
    const isAdmin = authSession?.user?.userType === 'admin';

    const handleRemindClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRemindModalOpen(true);
    };

    const handleSendRemind = async (message: string) => {
        setIsSendingRemind(true);
        try {
            const res = await fetch('/api/notify/remind', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: session.id,
                    message: message
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.sentCount > 0) {
                    toast.success(`Sent reminders to ${data.sentCount} players!`);
                } else {
                    toast.info(data.message || 'No reminders sent (no valid phone numbers found).');
                }
                setIsRemindModalOpen(false);
            } else {
                toast.error(data.error || 'Failed to send reminders.');
                if (data.details) console.error(data.details);
            }
        } catch (error) {
            console.error('Error sending reminders:', error);
            toast.error('An error occurred while sending reminders.');
        } finally {
            setIsSendingRemind(false);
        }
    };

    const handleMissingCapabilityClick = (e: React.MouseEvent, capId: string, capName: string) => {
        e.stopPropagation(); // Prevent opening session details
        setCandidateModal({
            isOpen: true,
            capabilityId: capId,
            capabilityName: capName,
        });
    };



    return (
        <>
            <div
                className={`relative h-full ${className || ''}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <button
                    onClick={onClick}
                    className="w-full h-full text-left p-3 bg-primary/20 border border-primary/20 hover:bg-primary/30 hover:border-primary/50 rounded-lg transition-all duration-200 flex flex-col group"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xl font-bold text-text-primary">
                            {format(new Date(session.date + 'T00:00:00'), 'MMMM d')} <span className="text-sm font-normal text-text-secondary">({format(new Date(session.date + 'T00:00:00'), 'EEE')})</span>
                        </div>
                        <div className="text-lg font-bold text-primary">
                            {format(new Date(`2000-01-01T${session.start_time}`), 'h:mm a')}
                        </div>
                    </div>

                    <div className="mb-3">
                        {session.songs && session.songs.length > 0 ? (
                            <div className="space-y-0.5">
                                {session.songs.slice(0, 3).map((song, i) => (
                                    <div key={song.id || i} className="flex flex-col gap-0.5">
                                        <div className="flex gap-1.5 items-start min-w-0">
                                            <span className="text-[10px] bg-white text-black rounded px-1 py-0.5 mt-0.5 shrink-0">🎵</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-text-primary font-medium truncate leading-tight">
                                                    {song.song_name}
                                                </div>
                                                {song.song_artist && (
                                                    <div className="text-xs text-text-secondary truncate leading-tight mt-0.5">
                                                        {song.song_artist}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Remind Button for Admins (First Song Only) */}
                                            {i === 0 && isAdmin && (
                                                <div
                                                    onClick={handleRemindClick}
                                                    className="shrink-0 ml-2 px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors"
                                                    title="Send SMS reminder to all RSVP'd players"
                                                >
                                                    Remind
                                                </div>
                                            )}
                                        </div>
                                        {/* Song Capabilities */}
                                        {song.capabilities && song.capabilities.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 ml-0 mt-1 mb-[10px]">
                                                {(() => {
                                                    const presentCapabilityIds = new Set(
                                                        session.commitments?.flatMap(c => c.capabilities?.map(cap => cap.id)) || []
                                                    );

                                                    return song.capabilities.map((cap, capIdx) => {
                                                        const isMissing = !presentCapabilityIds.has(cap.id);
                                                        return (
                                                            <div
                                                                key={cap.id || capIdx}
                                                                title={isMissing ? `${toProperCase(cap.name)} (Missing) - Click to find candidates` : toProperCase(cap.name)}
                                                                onClick={(e) => isMissing && handleMissingCapabilityClick(e, cap.id, toProperCase(cap.name))}
                                                                className={`
                                                                    flex items-center justify-center
                                                                    w-6 h-6 rounded-[3px] 
                                                                    bg-surface-secondary/50 text-text-secondary
                                                                    ${isMissing ? 'border-b-2 border-red-500 shadow-none cursor-pointer hover:bg-red-500/10' : 'border border-border/50'}
                                                                `}
                                                            >
                                                                <CapabilityIcon capability={cap} className="w-4 h-4" />
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {session.songs.length > 3 && (
                                    <div className="text-[10px] text-text-secondary pl-4 opacity-75">
                                        +{session.songs.length - 3} more songs
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-text-secondary/60 italic flex items-center gap-1.5">
                                <span className="text-[10px] bg-white text-black rounded px-1 py-0.5">🎵</span> Songs TBD
                            </div>
                        )}
                    </div>

                    {/* Player list with capability icons */}
                    {committedCount > 0 ? (
                        <div className="space-y-1">
                            {session.commitments.slice(0, 10).map((commitment) => (
                                <div key={commitment.user_id} className="flex items-center gap-1 text-xs text-text-primary">
                                    <span className="truncate flex-1">{commitment.user.name}</span>
                                    <div className="flex gap-0.5">
                                        {(commitment.capabilities || []).slice(0, 6).map((cap, idx) => (
                                            <span key={idx} title={toProperCase(cap.name)}>
                                                <CapabilityIcon capability={cap} className="w-4 h-4" />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {committedCount > 10 && (
                                <div className="text-xs text-text-secondary">
                                    +{committedCount - 10} more
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-xs text-text-secondary">No commitments</div>
                    )}
                </button>

                {/* Tooltip */}
                {showTooltip && committedCount > 0 && (
                    <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-surface border border-border rounded-lg shadow-xl pointer-events-none">
                        <div className="text-sm font-semibold text-text-primary mb-2">
                            Committed Players ({committedCount})
                        </div>
                        <div className="space-y-2">
                            {session.commitments.map((commitment) => (
                                <div key={commitment.user_id} className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <div className="text-sm text-text-primary font-medium">
                                            {commitment.user.name}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(commitment.capabilities || []).map((cap) => (
                                                <span
                                                    key={cap.id}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full"
                                                >
                                                    <CapabilityIcon capability={cap} className="w-3 h-3" />
                                                    <span className="capitalize">{cap.name}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <CandidateListModal
                isOpen={candidateModal.isOpen}
                capabilityId={candidateModal.capabilityId}
                capabilityName={candidateModal.capabilityName}
                onClose={() => setCandidateModal(prev => ({ ...prev, isOpen: false }))}
                sessionDetails={{
                    dateFormatted: format(new Date(session.date + 'T00:00:00'), 'MMMM d, yyyy'),
                    timeFormatted: format(new Date(`2000-01-01T${session.start_time}`), 'h:mm a'),
                    songCount: session.songs?.length || 0,
                }}
            />
            <RemindPreviewModal
                isOpen={isRemindModalOpen}
                onClose={() => setIsRemindModalOpen(false)}
                session={session}
                onSend={handleSendRemind}
                isSending={isSendingRemind}
            />
        </>
    );
}
