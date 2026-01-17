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

// context: { params: { id: string } }
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const { data: session, error } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                songs:session_songs(*),
                commitments:session_commitments(
                  *,
                  user:users(
                    id,
                    name,
                    email,
                    capabilities:user_capabilities(
                      capability:capabilities(*)
                    )
                  ),
                  capabilities:session_commitment_capabilities(
                     capability:capabilities(*)
                  )
                ),
                recordings:session_recordings(*),
                photos:session_photos(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching session:', error);
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Transform data to match frontend types (handling capabilities nesting)
        const transformedSession = {
            ...session,
            commitments: session.commitments?.map((c: { user?: { capabilities?: { capability: unknown }[] }; capabilities?: { capability: unknown }[] } & Record<string, unknown>) => ({
                ...c,
                user: {
                    ...c.user,
                    capabilities: c.user?.capabilities?.map((uc) => uc.capability) || []
                },
                capabilities: c.capabilities?.map((cc) => cc.capability) || []
            })) || []
        };

        return NextResponse.json(transformedSession);

    } catch (error) {
        console.error('Error in GET /api/sessions/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// context: { params: { id: string } }
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure user is authenticated
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Await params as required in newer Next.js versions
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('sessions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting session:', error);
            return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/sessions/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// context: { params: { id: string } }
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { date, start_time, end_time, songs } = body;

        // 1. Update Session Details
        const { error: sessionError } = await supabaseAdmin
            .from('sessions')
            .update({
                date,
                start_time,
                end_time
            })
            .eq('id', id);

        if (sessionError) {
            console.error('Error updating session:', sessionError);
            return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }

        // 2. Update Songs (if provided)
        // Strategy: Delete all existing songs for this session and re-insert the new list.
        // This handles additions, removals, and reordering in one go.
        if (songs) {
            // Delete existing songs
            const { error: deleteError } = await supabaseAdmin
                .from('session_songs')
                .delete()
                .eq('session_id', id);

            if (deleteError) {
                console.error('Error deleting old session songs:', deleteError);
                return NextResponse.json({ error: 'Failed to update session songs' }, { status: 500 });
            }

            // Insert new songs
            if (songs.length > 0) {
                const songsToInsert = songs.map((song: { song_name: string; song_url?: string }, index: number) => ({
                    session_id: id,
                    song_name: song.song_name,
                    song_url: song.song_url || null,
                    order: index,
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('session_songs')
                    .insert(songsToInsert);

                if (insertError) {
                    console.error('Error inserting new session songs:', insertError);
                    return NextResponse.json({ error: 'Failed to update session songs' }, { status: 500 });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/sessions/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
