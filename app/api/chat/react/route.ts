import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId, emoji } = await request.json();

        if (!messageId || !emoji) {
            return NextResponse.json({ error: 'Message ID and emoji are required' }, { status: 400 });
        }

        // Check if reaction already exists
        const { data: existingReaction } = await supabaseAdmin
            .from('chat_reactions')
            .select('id')
            .eq('message_id', messageId)
            .eq('user_id', session.user.id)
            .eq('emoji', emoji)
            .single();

        if (existingReaction) {
            // Remove reaction (toggle off)
            const { error: deleteError } = await supabaseAdmin
                .from('chat_reactions')
                .delete()
                .eq('id', existingReaction.id);

            if (deleteError) {
                console.error('Error removing reaction:', deleteError);
                return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
            }

            return NextResponse.json({ action: 'removed' });
        } else {
            // Add reaction (toggle on)
            const { error: insertError } = await supabaseAdmin
                .from('chat_reactions')
                .insert({
                    message_id: messageId,
                    user_id: session.user.id,
                    emoji
                });

            if (insertError) {
                console.error('Error adding reaction:', insertError);
                return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
            }

            return NextResponse.json({ action: 'added' });
        }
    } catch (error) {
        console.error('Error in POST /api/chat/react:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
