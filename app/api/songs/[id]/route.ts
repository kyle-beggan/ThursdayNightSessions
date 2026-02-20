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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        let { data: song, error } = await supabaseAdmin
            .from('songs')
            .select(`
                *,
                song_capabilities (
                    capability:capabilities (
                        id,
                        name,
                        icon
                    )
                )
            `)
            .eq('id', id)
            .single();

        // Fallback if relation doesn't exist yet
        if (error) {
            const fallback = await supabaseAdmin
                .from('songs')
                .select('*')
                .eq('id', id)
                .single();
            song = fallback.data;
            error = fallback.error;
        }

        if (error) {
            console.error('Error fetching song:', error);
            return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 });
        }

        if (!song) {
            return NextResponse.json({ error: 'Song not found' }, { status: 404 });
        }

        // Transform structure to match frontend expectations if needed
        const enrichedSong = {
            ...song,
            capabilities: song.song_capabilities?.map((sc: { capability: unknown }) => sc.capability) || []
        };
        delete enrichedSong.song_capabilities;

        return NextResponse.json(enrichedSong);
    } catch (error) {
        console.error('Error in GET /api/songs/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
        const body = await request.json();
        const { title, artist, key, tempo, resource_url, capabilities } = body;

        console.log(`[PATCH /api/songs/${id}] Update request. Body keys:`, Object.keys(body));
        if (capabilities) {
            console.log(`Capabilities to save:`, capabilities);
        }

        // Validate ID
        if (!id || id === 'undefined' || id === 'null') {
            return NextResponse.json({ error: 'Invalid song ID provided' }, { status: 400 });
        }

        // Filter out undefined values from update object to prevent accidental nulling or errors
        const updateData: Record<string, string | number | null> = {};
        if (title !== undefined) updateData.title = title;
        if (artist !== undefined) updateData.artist = artist;
        if (key !== undefined) updateData.key = key;
        if (tempo !== undefined) updateData.tempo = tempo;
        if (resource_url !== undefined) updateData.resource_url = resource_url;

        // Update basic song info only if there are fields to update
        if (Object.keys(updateData).length > 0) {
            const { error: songError } = await supabaseAdmin
                .from('songs')
                .update(updateData)
                .eq('id', id);

            if (songError) {
                console.error('Error updating song details:', songError);
                return NextResponse.json({ error: 'Failed to update song details' }, { status: 500 });
            }
        }

        // Update capabilities if provided
        if (capabilities) {
            // First, delete existing
            const { error: deleteError } = await supabaseAdmin
                .from('song_capabilities')
                .delete()
                .eq('song_id', id);

            if (deleteError) {
                console.error('Error clearing song capabilities:', deleteError);
                if (deleteError.code === '42P01') { // Postgres code for undefined_table
                    return NextResponse.json({ error: 'Database setup incomplete: song_capabilities table missing. Please run the migration.' }, { status: 500 });
                }
                // Return actual error for debugging
                return NextResponse.json({ error: `Failed to update capabilities: ${deleteError.message} (Code: ${deleteError.code})` }, { status: 500 });
            }

            // Insert new ones
            if (capabilities.length > 0) {
                const capsToInsert = capabilities.map((capId: string) => ({
                    song_id: id,
                    capability_id: capId
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('song_capabilities')
                    .insert(capsToInsert);

                if (insertError) {
                    console.error('Error inserting song capabilities:', insertError);
                    if (insertError.code === '42P01') {
                        return NextResponse.json({ error: 'Database setup incomplete: song_capabilities table missing. Please run the migration.' }, { status: 500 });
                    }
                    // Return actual error for debugging
                    return NextResponse.json({ error: `Failed to save capabilities: ${insertError.message} (Code: ${insertError.code})` }, { status: 500 });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/songs/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // 1. Fetch the song to check creator and title
        const { data: song, error: fetchError } = await supabaseAdmin
            .from('songs')
            .select('title, created_by')
            .eq('id', id)
            .single();

        if (fetchError || !song) {
            console.error('Error fetching song for deletion:', fetchError);
            return NextResponse.json({ error: 'Song not found' }, { status: 404 });
        }

        // 2. Authorization check: Admin or Creator
        const isAdmin = session.user.userType === 'admin';
        const isCreator = song.created_by === session.user.id;

        if (!isAdmin && !isCreator) {
            return NextResponse.json({ error: 'You do not have permission to delete this song' }, { status: 403 });
        }

        // 3. Check if recorded
        // Find all sessions containing this song
        const { data: usedInSessions } = await supabaseAdmin
            .from('session_songs')
            .select('session_id')
            .eq('song_name', song.title);

        if (usedInSessions && usedInSessions.length > 0) {
            const sessionIds = usedInSessions.map(s => s.session_id);

            // Check if any of these sessions have recordings
            const { data: recordings, error: recError } = await supabaseAdmin
                .from('session_recordings')
                .select('id')
                .in('session_id', sessionIds)
                .limit(1);

            if (recError) {
                console.error('Error checking recordings:', recError);
                return NextResponse.json({ error: 'Failed to verify recording status' }, { status: 500 });
            }

            if (recordings && recordings.length > 0) {
                return NextResponse.json({
                    error: 'Cannot delete song because it has already been recorded in a session'
                }, { status: 400 });
            }
        }

        // 4. Cleanup and Delete
        // Since we use admin client, we should manually clean up relations if they don't cascade

        // Delete capabilities
        await supabaseAdmin.from('song_capabilities').delete().eq('song_id', id);

        // Delete votes
        await supabaseAdmin.from('song_votes').delete().eq('song_id', id);

        // Delete the song itself
        const { error: deleteError } = await supabaseAdmin
            .from('songs')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting song:', deleteError);
            return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/songs/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
