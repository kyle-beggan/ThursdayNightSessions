'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SessionWithDetails } from '@/lib/types';
import { format } from 'date-fns';

interface RemindPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: SessionWithDetails;
    onSend: (message: string) => void;
    isSending: boolean;
}

export default function RemindPreviewModal({ isOpen, onClose, session, onSend, isSending }: RemindPreviewModalProps) {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen && session) {
            setMessage(generateDefaultMessage(session));
        }
    }, [isOpen, session]);

    const generateDefaultMessage = (session: SessionWithDetails) => {
        const date = format(new Date(session.date + 'T00:00:00'), 'MMMM d');
        const time = format(new Date(`2000-01-01T${session.start_time}`), 'h:mm a');

        let msg = `Session Reminder 📅\n${date} @ ${time}\n\n`;

        // Songs
        if (session.songs && session.songs.length > 0) {
            msg += 'Setlist:\n';
            session.songs.forEach((song, i) => {
                const title = song.song_name;
                const link = song.song_url ? ` - ${song.song_url}` : '';
                msg += `${i + 1}. ${title}${link}\n`;
            });
            msg += '\n';
        }

        // Committed Players
        if (session.commitments && session.commitments.length > 0) {
            msg += 'Lineup:\n';
            session.commitments.forEach(commitment => {
                const name = commitment.user.name;
                const caps = commitment.capabilities?.map(c => c.name).join(', ') || 'General';
                msg += `${name}\n(${caps})\n\n`;
            });
        }

        return msg.trim();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Preview SMS Reminder"
            size="lg"
        >
            <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                    Review the message below before sending to all committed players.
                </p>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full h-80 p-4 bg-surface-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Message content..."
                />

                <div className="flex justify-end gap-3 pt-2">
                    <Button onClick={onClose} variant="ghost" disabled={isSending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSend(message)}
                        variant="primary"
                        disabled={isSending || !message.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {isSending ? 'Sending...' : 'Send Message'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
