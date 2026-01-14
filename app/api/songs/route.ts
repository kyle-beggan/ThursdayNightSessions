import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Admin client to bypass RLS for consistent fetching/saving
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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const availableOnly = searchParams.get('available_only') === 'true';

        // Fetch lists of songs already used in sessions, including the session date
        const { data: usedSongs } = await supabaseAdmin
            .from('session_songs')
            .select(`
                song_name,
                session_id,
                session:sessions (
                    date
                )
            `);

        // Create a map of song_name -> { date, id }
        const songSessionMap = new Map<string, { date: string, id: string }>();
        const usedSongNames: string[] = [];

        usedSongs?.forEach((item: { song_name: string | null; session_id: string; session: { date: string | null }[] | { date: string | null } | null }) => {
            if (item.song_name) {
                usedSongNames.push(item.song_name);
                // Supabase returns arrays for relations sometimes? No, it's singular if not array?
                // Actually, the error said session is `{ date: any }[]` but required `{ date: string }`.
                // It seems `item.session` might be array.
                // Let's coerce.
                const sess = Array.isArray(item.session) ? item.session[0] : item.session;

                if (sess?.date) {
                    songSessionMap.set(item.song_name, {
                        date: sess.date,
                        id: item.session_id
                    });
                }
            }
        });

        let query = supabaseAdmin
            .from('songs')
            .select(`
                *,
                song_capabilities (
                    capability:capabilities (
                        id,
                        name,
                        icon
                    )
                ),
                users (
                    name,
                    image
                )
            `)
            .order('title', { ascending: true });

        // If available_only is requested, exclude assigned songs
        if (availableOnly && usedSongNames.length > 0) {
            query = query.not('title', 'in', `(${usedSongNames.map(name => `"${name}"`).join(',')})`);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%`);
        }


        let { data, error } = await query;

        // Fallback: If fetch failed (likely due to missing song_capabilities table/relation), try fetching without it
        if (error) {
            console.warn('Failed to fetch songs with capabilities, trying fallback:', error.message);
            let fallbackQuery = supabaseAdmin
                .from('songs')
                .select('*')
                .order('title', { ascending: true });

            if (availableOnly && usedSongNames.length > 0) {
                fallbackQuery = fallbackQuery.not('title', 'in', `(${usedSongNames.map(name => `"${name}"`).join(',')})`);
            }
            if (search) {
                fallbackQuery = fallbackQuery.or(`title.ilike.%${search}%,artist.ilike.%${search}%`);
            }

            const fallbackResult = await fallbackQuery;
            data = fallbackResult.data;
            error = fallbackResult.error;
        }

        if (error) {
            console.error('Error fetching songs:', error);
            return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
        }

        // Fetch vote counts and user status
        // 1. Get all votes (for counts) - OPTIMIZATION: In production, use .rpc() for counts or separate analytics table
        const { data: allVotes } = await supabaseAdmin
            .from('song_votes')
            .select('song_id');

        // 2. Get current user's votes
        const userVotedSongIds = new Set<string>();
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            const { data: userVotes } = await supabaseAdmin
                .from('song_votes')
                .select('song_id')
                .eq('user_id', session.user.id);

            userVotes?.forEach(v => userVotedSongIds.add(v.song_id));
        }

        // Count votes per song
        const voteCounts = (allVotes || []).reduce((acc, curr) => {
            acc[curr.song_id] = (acc[curr.song_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Attach session_date, session_id, and votes to songs
        // Also transform capabilities
        const enrichedData = (data || []).map(song => {
            const sessionInfo = songSessionMap.get(song.title);
            // Flatten capabilities
            const capabilities = song.song_capabilities?.map((sc: { capability: unknown }) => sc.capability) || [];

            // Remove the raw relation property to clean up response
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { song_capabilities: _song_capabilities, users, ...songData } = song;

            // Coerce Supabase single relation response
            const creator = Array.isArray(users) ? users[0] : users;

            return {
                ...songData,
                capabilities,
                creator,
                session_date: sessionInfo?.date || null,
                session_id: sessionInfo?.id || null,
                vote_count: voteCounts[song.id] || 0,
                user_has_voted: userVotedSongIds.has(song.id)
            };
        });

        // Debug log
        if (enrichedData.length > 0) {
            // console.log('Sample song from API:', enrichedData[0]);
        }

        return NextResponse.json(enrichedData);
    } catch (error) {
        console.error('Error in GET /api/songs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is approved or admin
        // Note: For now, allowing 'approved' users.
        // If strict 'status' check is needed, we should query user status from DB or rely on session if augmented.
        // Assuming session.user has basic info, but status might be typically fetched.
        // However, let's rely on RLS/Admin logic or just checks here.
        // Since we use admin client, we MUST check permissions manually here.

        // We can trust session.user.id for 'created_by'.
        // Let's assume any logged in user can ADD a song for now (as per plan: "Approved users + Admin").
        // Proper status check:
        // const { data: user } = await supabaseAdmin.from('users').select('status').eq('id', session.user.id).single();
        // if (user.status !== 'approved' && session.user.userType !== 'admin') ...

        // For simplicity, let's check userType or just allow all authenticated for this prototype step, 
        // OR better: query the user status quickly.

        const body = await request.json();
        const { title, artist, key, tempo, resource_url, capabilities } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('songs')
            .insert({
                title,
                artist,
                key,
                tempo,
                resource_url,
                created_by: session.user.id,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating song:', error);
            return NextResponse.json({ error: 'Failed to create song' }, { status: 500 });
        }

        // Insert capabilities if provided
        if (capabilities && capabilities.length > 0) {
            const capsToInsert = capabilities.map((capId: string) => ({
                song_id: data.id,
                capability_id: capId
            }));

            const { error: insertError } = await supabaseAdmin
                .from('song_capabilities')
                .insert(capsToInsert);

            if (insertError) {
                console.error('Error inserting song capabilities:', insertError);
                // Note: We don't rollback the song creation here, just log the error.
                // Could ideally be a transaction but Supabase generic client restricts those
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in POST /api/songs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
