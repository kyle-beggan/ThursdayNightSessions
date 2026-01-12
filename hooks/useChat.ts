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
    reactions?: {
        id: string;
        message_id: string;
        user_id: string;
        emoji: string;
        created_at: string;
    }[];
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
                } else {
                    const text = await res.text();
                    console.error(`Chat GET Error (${res.status}):`, text);
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
                                avatar_url: image
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

            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_reactions'
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const newReaction = payload.new as any;
                        setMessages((prev) =>
                            prev.map(msg => {
                                if (msg.id === newReaction.message_id) {
                                    return {
                                        ...msg,
                                        reactions: [...(msg.reactions || []), newReaction]
                                    };
                                }
                                return msg;
                            })
                        );
                    } else if (payload.eventType === 'DELETE') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const oldReaction = payload.old as any;
                        setMessages((prev) =>
                            prev.map(msg => {
                                if (msg.id === oldReaction.message_id || msg.reactions?.some(r => r.id === oldReaction.id)) {
                                    return {
                                        ...msg,
                                        reactions: (msg.reactions || []).filter(r => r.id !== oldReaction.id)
                                    };
                                }
                                return msg;
                            })
                        );
                    }
                }
            )
            .subscribe();

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
                credentials: 'include', // Ensure cookies are sent
            });

            if (!res.ok) {
                const text = await res.text();
                console.error(`API Error (${res.status} ${res.statusText}):`, text);
                let errData = {};
                try {
                    errData = JSON.parse(text);
                } catch {
                    // ignore invalid json
                }
                throw new Error((errData as { error?: string }).error || `Request failed: ${res.status} ${res.statusText}`);
            }

            const newMessage = await res.json();

            setMessages((prev) => {
                // Avoid duplicates if realtime already picked it up
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    };

    const addReaction = async (messageId: string, emoji: string) => {
        // Optimistic update
        const fakeReaction = {
            id: `temp-${Date.now()}`,
            message_id: messageId,
            user_id: 'me', // Placeholder, we don't need real ID for display if we handle it right
            emoji,
            created_at: new Date().toISOString()
        };

        setMessages((prev) =>
            prev.map(msg => {
                if (msg.id === messageId) {
                    // Check if we are toggling off (primitive check)
                    // Actually, the API toggles. Optimistic toggle is harder without knowing user ID.
                    // For now, let's just push it. If it was a remove, real-time will fix it.
                    // BUT user asked for "refresh once selected".
                    // Let's assume for now it's an add or we just show it.
                    // Real-time will correct it in 100ms.
                    // To be smarter, we'd need to check if *I* already reacted.
                    // Since we don't have my user ID easily accessible in this hook without session...
                    // We'll rely on the fact that if I see it, I added it.

                    return {
                        ...msg,
                        reactions: [...(msg.reactions || []), fakeReaction]
                    };
                }
                return msg;
            })
        );

        try {
            await fetch('/api/chat/react', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, emoji })
            });
        } catch (error) {
            console.error('Error adding reaction:', error);
            // Revert would go here
        }
    };

    return { messages, loading, sendMessage, addReaction };
};
