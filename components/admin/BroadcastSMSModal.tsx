'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface BroadcastSMSModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => void;
    isSending: boolean;
}

export default function BroadcastSMSModal({ isOpen, onClose, onSend, isSending }: BroadcastSMSModalProps) {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMessage('');
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Broadcast SMS to All Users"
            size="lg"
        >
            <div className="space-y-4">
                <p className="text-sm text-text-secondary leading-relaxed">
                    Compose a text message below to send to <strong className="text-text-primary">all approved users</strong>. Please make sure the content is correct before sending.
                </p>

                <div className="relative">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-64 p-4 bg-surface-secondary border border-border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all duration-200"
                        placeholder="Type your announcement here..."
                        maxLength={1600}
                        disabled={isSending}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-text-secondary select-none">
                        {message.length} characters
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button onClick={onClose} variant="ghost" disabled={isSending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSend(message)}
                        variant="primary"
                        disabled={isSending || !message.trim()}
                        className="bg-purple-600 hover:bg-purple-700 font-semibold shadow-purple-600/20"
                    >
                        {isSending ? 'Sending Broadcast...' : '📣 Send Broadcast'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
