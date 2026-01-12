import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ChatReaction } from '@/lib/types';

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    users?: {
        name: string;
        avatar_url?: string;
    };
    reactions?: ChatReaction[];
}

interface MessageBubbleProps {
    message: Message;
    onReact: (emoji: string) => void;
}

export default function MessageBubble({ message, onReact }: MessageBubbleProps) {
    const { data: session } = useSession();
    const isMe = session?.user?.id === message.user_id;
    const senderName = message.users?.name || 'Unknown User';
    const avatarUrl = message.users?.avatar_url; // Use if available later

    const [showPicker, setShowPicker] = useState(false);

    const handleReaction = (emoji: string) => {
        onReact(emoji);
        setShowPicker(false);
    };

    // Group reactions by emoji
    const reactionCounts = (message.reactions || []).reduce((acc, curr) => {
        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className={`flex gap-3 mb-6 relative group ${isMe ? 'flex-row-reverse' : 'flex-row'}`} onMouseLeave={() => setShowPicker(false)}>
            {/* Avatar Circle */}
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative overflow-hidden mt-1
                ${isMe ? 'bg-primary text-white' : 'bg-surface-tertiary text-text-secondary'}
            `}>
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt={senderName}
                        fill
                        className="object-cover"
                        sizes="32px"
                    />
                ) : (
                    // Generic User Icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-70">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                )}
            </div>

            {/* Message Body & Reactions */}
            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-xs text-text-secondary mb-1 px-1">
                    {senderName} • {format(new Date(message.created_at), 'h:mm a')}
                </div>

                <div className="relative group/message">
                    <div className={`
                        rounded-2xl px-4 py-2 text-sm break-words
                        ${isMe
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-surface-secondary text-text-primary border border-border rounded-tl-none'
                        }
                    `}>
                        {message.content}
                    </div>

                    {/* Reaction Picker Trigger */}
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className={`
                            absolute top-1/2 -translate-y-1/2 p-1 rounded-full bg-surface border border-border text-text-secondary hover:text-primary opacity-0 group-hover/message:opacity-100 transition-opacity shadow-sm
                            ${isMe ? '-left-8' : '-right-8'}
                        `}
                        title="Add reaction"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                        </svg>
                    </button>

                    {/* Emoji Picker Popover */}
                    {showPicker && (
                        <div className={`
                            absolute bottom-full mb-2 bg-surface text-text-primary rounded-full shadow-lg border border-border flex gap-1 p-1 z-10
                            ${isMe ? 'right-0' : 'left-0'}
                        `}>
                            {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-surface-hover rounded-full transition-colors text-lg"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reactions Display */}
                {Object.keys(reactionCounts).length > 0 && (
                    <div className={`flex gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <div
                                key={emoji}
                                className="bg-surface-hover border border-border text-text-secondary text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:border-primary/50"
                                onClick={() => handleReaction(emoji)}
                            >
                                <span>{emoji}</span>
                                <span className="font-medium">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
