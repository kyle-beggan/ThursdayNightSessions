'use client';

import { useState } from 'react';
import { SessionWithDetails } from '@/lib/types';
import { format } from 'date-fns';
import CandidateListModal from './CandidateListModal';

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
    const [showTooltip, setShowTooltip] = useState(false);
    const [candidateModal, setCandidateModal] = useState<{ isOpen: boolean; capabilityId: string | null; capabilityName: string | null }>({
        isOpen: false,
        capabilityId: null,
        capabilityName: null,
    });
    const committedCount = session.commitments?.length || 0;

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
                    className="w-full h-full text-left p-3 bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] rounded-lg transition-all duration-200 flex flex-col group"
                >
                    <div className="text-xl font-bold text-text-primary mb-2">
                        {format(new Date(session.date + 'T00:00:00'), 'MMMM d')} <span className="text-sm font-normal text-text-secondary">({format(new Date(session.date + 'T00:00:00'), 'EEE')})</span>
                    </div>

                    {/* New Message Badge */}
                    {session.newMessageCount && session.newMessageCount > 0 ? (
                        <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg border-2 border-surface animate-bounce-in">
                            {session.newMessageCount > 9 ? '9+' : session.newMessageCount}
                        </div>
                    ) : null}

                    <div className="text-xs font-medium text-primary mb-2">
                        {format(new Date(`2000-01-01T${session.start_time}`), 'h:mm a')}
                    </div>

                    <div className="mb-3">
                        {session.songs && session.songs.length > 0 ? (
                            <div className="space-y-0.5">
                                {session.songs.slice(0, 3).map((song, i) => (
                                    <div key={song.id || i} className="flex flex-col gap-0.5">
                                        <div className="text-sm text-text-secondary truncate flex items-center gap-1.5">
                                            <span className="text-[10px] bg-white text-black rounded px-1 py-0.5">🎵</span>
                                            {song.song_name}
                                        </div>
                                        {/* Song Capabilities */}
                                        {song.capabilities && song.capabilities.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 ml-5 mb-[10px]">
                                                {(() => {
                                                    const presentCapabilityIds = new Set(
                                                        session.commitments?.flatMap(c => c.capabilities?.map(cap => cap.id)) || []
                                                    );

                                                    return song.capabilities.slice(0, 4).map((cap, capIdx) => {
                                                        const isMissing = !presentCapabilityIds.has(cap.id);
                                                        return (
                                                            <span
                                                                key={cap.id || capIdx}
                                                                title={isMissing ? `${toProperCase(cap.name)} (Missing) - Click to find candidates` : toProperCase(cap.name)}
                                                                onClick={(e) => isMissing && handleMissingCapabilityClick(e, cap.id, toProperCase(cap.name))}
                                                                className={`
                                                                    text-sm px-1 py-0 rounded-[3px] 
                                                                    bg-surface-secondary/50 text-text-secondary
                                                                    ${isMissing ? 'border-b-2 border-red-500 shadow-none cursor-pointer hover:bg-red-500/10' : 'border border-border/50'}
                                                                `}
                                                            >
                                                                {cap.icon || '🎸'}
                                                            </span>
                                                        );
                                                    });
                                                })()}
                                                {song.capabilities.length > 4 && (
                                                    <span className="text-[8px] text-text-secondary opacity-60 self-center">...</span>
                                                )}
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
                            {session.commitments.slice(0, 5).map((commitment) => (
                                <div key={commitment.user_id} className="flex items-center gap-1 text-xs text-text-primary">
                                    <span className="truncate flex-1">{commitment.user.name}</span>
                                    <div className="flex gap-0.5">
                                        {(commitment.capabilities || []).slice(0, 6).map((cap, idx) => (
                                            <span key={idx} className="text-sm" title={toProperCase(cap.name)}>
                                                {cap.icon || '🎵'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {committedCount > 5 && (
                                <div className="text-xs text-text-secondary">
                                    +{committedCount - 5} more
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
                                                    <span>{cap.icon || '🎵'}</span>
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
        </>
    );
}
