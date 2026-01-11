import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    users?: {
        name: string;
        avatar_url?: string;
    };
}

interface MessageBubbleProps {
    message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const { data: session } = useSession();
    const isMe = session?.user?.id === message.user_id;
    const senderName = message.users?.name || 'Unknown User';
    const avatarUrl = message.users?.avatar_url; // Use if available later

    return (
        <div className={`flex gap-3 mb-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar Circle */}
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${isMe ? 'bg-primary text-white' : 'bg-surface-tertiary text-text-secondary'}
            `}>
                {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={senderName} className="w-full h-full rounded-full object-cover" />
                ) : (
                    // Generic User Icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-70">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                )}
            </div>

            {/* Message Body */}
            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-xs text-text-secondary mb-1 px-1">
                    {senderName} • {format(new Date(message.created_at), 'h:mm a')}
                </div>
                <div className={`
                    rounded-2xl px-4 py-2 text-sm break-words
                    ${isMe
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-surface-secondary text-text-primary border border-border rounded-tl-none'
                    }
                `}>
                    {message.content}
                </div>
            </div>
        </div>
    );
}
