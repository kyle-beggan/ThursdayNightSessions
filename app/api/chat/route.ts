import { NextRequest, NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    try {
        // Use Admin Client to bypass RLS since we've already authenticated via NextAuth
        const supabase = createAdminClient();

        let query = supabase
            .from('chat_messages')
            .select(`
                id,
                content,
                created_at,
                user_id,
                session_id,
                users (
                    id,
                    name,
                    email,
                    avatar_url: image
                ),
                reactions:chat_reactions (
                    id,
                    message_id,
                    user_id,
                    emoji,
                    created_at
                )
            `)
            .order('created_at', { ascending: true })
            .limit(100);

        if (sessionId) {
            query = query.eq('session_id', sessionId);
        } else {
            // Global chat - session_id is null
            query = query.is('session_id', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error fetching messages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, sessionId } = await request.json();

    if (!content) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                content,
                user_id: session.user.id,
                session_id: sessionId || null, // null for global
            })
            .select(`
                *,
                users (
                    id,
                    name,
                    name,
                    email,
                    avatar_url: image
                ),
                reactions:chat_reactions (
                    id,
                    message_id,
                    user_id,
                    emoji,
                    created_at
                )
            `) // Return the inserted row with user details
            .single();

        if (error) {
            console.error('Supabase error sending message:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
