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

        const { songId } = await request.json();

        if (!songId) {
            return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
        }

        // Check if vote already exists
        const { data: existingVote } = await supabaseAdmin
            .from('song_votes')
            .select('id')
            .eq('song_id', songId)
            .eq('user_id', session.user.id)
            .single();

        if (existingVote) {
            // Remove vote (toggle off)
            const { error: deleteError } = await supabaseAdmin
                .from('song_votes')
                .delete()
                .eq('id', existingVote.id);

            if (deleteError) {
                console.error('Error removing vote:', deleteError);
                return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
            }

            return NextResponse.json({ action: 'removed' });
        } else {
            // Add vote (toggle on)
            const { error: insertError } = await supabaseAdmin
                .from('song_votes')
                .insert({
                    song_id: songId,
                    user_id: session.user.id
                });

            if (insertError) {
                console.error('Error adding vote:', insertError);
                return NextResponse.json({ error: 'Failed to add vote' }, { status: 500 });
            }

            return NextResponse.json({ action: 'added' });
        }
    } catch (error) {
        console.error('Error in POST /api/songs/vote:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
