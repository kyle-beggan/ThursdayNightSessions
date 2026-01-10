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
                    senderName.charAt(0).toUpperCase()
                )}
            </div>

            {/* Message Body */}
            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-xs text-text-secondary mb-1 px-1">
                    {isMe ? 'You' : senderName} • {format(new Date(message.created_at), 'h:mm a')}
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
