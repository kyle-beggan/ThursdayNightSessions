'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import { Song } from '@/lib/types';

interface Comment {
    id: string;
    message: string;
    created_at: string;
    user: {
        name: string;
        image?: string;
    };
    user_id: string;
}

interface SongCommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    song: Song | null;
    onCommentAdded?: () => void;
}

export default function SongCommentsModal({ isOpen, onClose, song, onCommentAdded }: SongCommentsModalProps) {
    const { data: session } = useSession();
    const toast = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && song) {
            fetchComments();
        }
    }, [isOpen, song]);

    const fetchComments = useCallback(async () => {
        if (!song) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/songs/${song.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    }, [song, toast]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !song || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/songs/${song.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage })
            });

            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [...prev, newComment]);
                setNewMessage('');
                onCommentAdded?.();
            } else {
                toast.error('Failed to post comment');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Error posting comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            const res = await fetch(`/api/songs/comments/${commentId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                onCommentAdded?.();
                toast.success('Comment deleted');
            } else {
                toast.error('Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Error deleting comment');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={song ? `Conversation: ${song.title}` : 'Conversation'}
            size="lg"
        >
            <div className="flex flex-col h-[60vh]">
                {/* Comments List */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border"
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-text-secondary">
                            Loading conversation...
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-60">
                            <span className="text-4xl mb-2">💬</span>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3 group">
                                <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0 border border-border">
                                    {comment.user.image ? (
                                        <Image
                                            src={comment.user.image}
                                            alt={comment.user.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-surface-tertiary flex items-center justify-center text-[10px] font-bold">
                                            {comment.user.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-text-primary">{comment.user.name}</span>
                                            <span className="text-[10px] text-text-tertiary">{formatDate(comment.created_at)}</span>
                                        </div>
                                        {(session?.user?.id === comment.user_id || session?.user?.userType === 'admin') && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-red-400 hover:text-red-500"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-surface-secondary/50 rounded-lg p-3 text-sm text-text-primary break-words leading-relaxed">
                                        {comment.message}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-surface">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-surface-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none h-10 min-h-[40px] max-h-[120px]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!newMessage.trim() || isSubmitting}
                            className="px-4 h-10"
                        >
                            {isSubmitting ? '...' : 'Send'}
                        </Button>
                    </form>
                    <p className="text-[10px] text-text-tertiary mt-2">
                        Press Enter to send, Shift + Enter for new line
                    </p>
                </div>
            </div>
        </Modal>
    );
}
