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

// GET /api/songs/[id]/comments
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('song_comments')
            .select(`
                *,
                user:users (
                    name,
                    image
                )
            `)
            .eq('song_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching song comments:', error);
            return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in GET /api/songs/[id]/comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/songs/[id]/comments
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { message } = body;

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('song_comments')
            .insert({
                song_id: id,
                user_id: session.user.id,
                message: message.trim()
            })
            .select(`
                *,
                user:users (
                    name,
                    image
                )
            `)
            .single();

        if (error) {
            console.error('Error creating song comment:', error);
            return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in POST /api/songs/[id]/comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
