'use client';

import { useState } from 'react';
import { SessionWithDetails } from '@/lib/types';
import { format } from 'date-fns';

interface SessionIndicatorProps {
    session: SessionWithDetails;
    onClick: () => void;
    className?: string;
}

// Core capabilities typically needed for a session
const coreCapabilities = [
    'vocalist',
    'drums',
    'bass guitar',
    'keyboards',
    'lead guitar',
    'trumpet',
    'alto sax',
    'tenor sax',
];

export default function SessionIndicator({ session, onClick, className }: SessionIndicatorProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const committedCount = session.commitments?.length || 0;

    return (
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
                    {format(new Date(session.date + 'T00:00:00'), 'MMMM d')} <span className="text-lg font-normal text-text-secondary">({format(new Date(session.date + 'T00:00:00'), 'EEE')})</span>
                </div>

                <div className="text-xs font-medium text-primary mb-2">
                    {format(new Date(`2000-01-01T${session.start_time}`), 'h:mm a')}
                </div>

                {/* Player list with capability icons */}
                {committedCount > 0 ? (
                    <div className="space-y-1">
                        {session.commitments.slice(0, 5).map((commitment) => (
                            <div key={commitment.user_id} className="flex items-center gap-1 text-xs text-text-primary">
                                <span className="truncate flex-1">{commitment.user.name}</span>
                                <div className="flex gap-0.5">
                                    {(commitment.capabilities || []).slice(0, 3).map((cap, idx) => (
                                        <span key={idx} className="text-sm" title={cap.name}>
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
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-surface border border-border rounded-lg shadow-xl">
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
                                                <span>{cap.name}</span>
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
    );
}
