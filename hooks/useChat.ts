import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ChatMessage {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    session_id: string | null;
    users?: {
        id: string;
        name: string;
        email: string;
        avatar_url?: string;
    };
}

export const useChat = (sessionId: string | null = null) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    // const { data: session } = useSession(); // Session unused in client-side hook for now
    const supabase = createClient();

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const url = sessionId
                    ? `/api/chat?sessionId=${sessionId}`
                    : '/api/chat';

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [sessionId]);

    // Subscribe to real-time updates
    useEffect(() => {
        // We only want to listen for INSERTs for now
        // Filter by session_id is trickier with simple channel filters if we don't have RLS set up perfectly for replication
        // But we can filter client-side or use Postgres filter syntax: "session_id=eq.uuid" or "session_id=is.null"

        const filter = sessionId
            ? `session_id=eq.${sessionId}`
            : `session_id=is.null`;

        const channel = supabase
            .channel(`chat:${sessionId || 'global'}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: filter
                },
                async (payload) => {
                    // Payload doesn't have the joined user data directly.
                    // We can either fetch the user or just construct a temporary object if we know who sent it
                    // But waiting for a quick fetch is safer to show the name immediately for others

                    // Optimization: If *I* sent it, I might have added it optimistically or via the POST response.
                    // But let's just fetch the single message details to be clean.

                    const { new: newMessage } = payload;

                    // Fetch the full message with user details
                    const { data, error } = await supabase
                        .from('chat_messages')
                        .select(`
                            *,
                            users (
                                id,
                                name,
                                email,
                                avatar_url
                            )
                        `)
                        .eq('id', newMessage.id)
                        .single();

                    if (data && !error) {
                        setMessages((prev) => {
                            // Avoid duplicates if we handled it elsewhere (though we aren't doing optimistic UI yet)
                            if (prev.some(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to chat:', sessionId || 'global');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, supabase]);

    const sendMessage = async (content: string) => {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, sessionId }),
            });

            if (!res.ok) {
                throw new Error('Failed to send message');
            }

            // We rely on real-time subscription to add the message to the list
            // Or we could return the data and add it manually for perceived speed.
            // Let's rely on realtime for simplicity first.
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    };

    return { messages, loading, sendMessage };
};
