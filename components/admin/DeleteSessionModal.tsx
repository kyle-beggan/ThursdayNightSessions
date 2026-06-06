'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SessionWithDetails } from '@/lib/types';
import { format } from 'date-fns';

interface DeleteSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: SessionWithDetails;
    onConfirm: (message: string) => void;
    isDeleting: boolean;
}

export default function DeleteSessionModal({ isOpen, onClose, session, onConfirm, isDeleting }: DeleteSessionModalProps) {
    const generateDefaultMessage = (session: SessionWithDetails) => {
        if (!session) return '';
        const date = format(new Date(session.date + 'T00:00:00'), 'EEEE, MMMM do');
        return `Hey, guys.  Unfortuantely, we're going to have to cancel the session on ${date}.  We'll get it back on the calendar soon.`;
    };

    const [message, setMessage] = useState(() => generateDefaultMessage(session));

    const confirmedPlayers = session?.commitments?.filter(c => !c.status || c.status === 'confirmed') || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete Session & Notify Players"
            size="lg"
        >
            <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                    ⚠️ Warning: This session has {confirmedPlayers.length} {"player(s) RSVP'd to attend. They will receive a text notification notifying them of this cancellation."}
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Players to be notified
                    </label>
                    <div className="max-h-24 overflow-y-auto bg-surface-secondary/50 rounded-lg p-3 border border-border flex flex-wrap gap-1.5">
                        {confirmedPlayers.map(c => (
                            <span key={c.user_id} className="text-xs px-2.5 py-1 bg-surface border border-border rounded-full font-medium text-text-primary">
                                {c.user?.name || 'Unknown Player'}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Cancellation Message Content
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-32 p-3 bg-surface-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Cancellation message..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button onClick={onClose} variant="ghost" disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(message)}
                        variant="primary"
                        disabled={isDeleting || !message.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete & Send Text'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
