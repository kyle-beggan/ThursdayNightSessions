import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import MessageBubble from './MessageBubble';
import Button from '@/components/ui/Button';

interface ChatWindowProps {
    sessionId?: string | null;
    className?: string;
}

export default function ChatWindow({ sessionId = null, className = '' }: ChatWindowProps) {
    const { messages, loading, sendMessage } = useChat(sessionId);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Mark as read on mount
    useEffect(() => {
        const markAsRead = async () => {
            try {
                await fetch('/api/chat/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                });
            } catch (error) {
                console.error('Failed to mark chat as read:', error);
            }
        };
        markAsRead();
    }, [sessionId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={`flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden ${className}`}>
            {/* Header (Optional, maybe for Title) */}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-background">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-text-secondary">
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-50">
                        <span className="text-4xl mb-2">💬</span>
                        <p>No messages yet. Say hello!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface border-t border-border">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-secondary"
                        disabled={isSending}
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!newMessage.trim() || isSending}
                        className="px-6"
                    >
                        {isSending ? '...' : 'Send'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
