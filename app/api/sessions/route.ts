import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Initialize admin client to ensure we can fetch all data including capabilities (bypassing RLS)
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

        // Fetch user's last_sign_in_at, user_type, and read receipts if logged in
        let lastSignInAt: string | null = null;
        let currentUserType: string | null = null;
        const readReceipts: Record<string, string> = {}; // sessionId -> last_read_at

        if (session?.user?.id) {
            const { data: userData } = await supabaseAdmin
                .from('users')
                .select('last_sign_in_at, user_type')
                .eq('id', session.user.id)
                .single();
            lastSignInAt = userData?.last_sign_in_at;
            currentUserType = userData?.user_type;

            const { data: receipts } = await supabaseAdmin
                .from('chat_read_receipts')
                .select('session_id, last_read_at')
                .eq('user_id', session.user.id)
                .not('session_id', 'is', null);

            if (receipts) {
                receipts.forEach((r: { session_id: string; last_read_at: string }) => {
                    readReceipts[r.session_id] = r.last_read_at;
                });
            }
        }

        // Fetch sessions with songs and commitments
        const query = supabaseAdmin
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
                photos:session_photos(*),
                visibility:session_visibility(user_id)
            `)
            .order('date', { ascending: true });

        const { data: sessions, error } = await query;

        if (error) {
            console.error('Error fetching sessions:', error);
            return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
        }

        // Filter sessions based on visibility
        const filteredSessions = sessions?.filter(sessionItem => {
            // Admin sees everything (check DB role first, then session as fallback)
            if (currentUserType === 'admin' || session?.user?.userType === 'admin') return true;

            // Public sessions visible to everyone
            if (sessionItem.is_public) return true;

            // Private sessions visible to users in visibility list
            const allowedUserIds = sessionItem.visibility?.map((v: { user_id: string }) => v.user_id) || [];
            if (session?.user?.id && allowedUserIds.includes(session.user.id)) return true;

            return false;
        }) || [];

        // Calculate new message counts (Moved logical block here and using filteredSessions)
        const newMessageCounts: Record<string, number> = {};

        // ... (rest of message count logic using filteredSessions instead of sessions)


        // Calculate new message counts
        // Logic: Count messages where created_at > MAX(last_sign_in_at, last_read_at_for_session)


        // We need to fetch messages for all visible sessions to count efficiently
        // Or we can do a grouped query. Let's try a grouped query for all messages newer than the global last_sign_in_at first
        // But since each session has a different "last read" time, we might need to be smarter.
        // Simple approach: Fetch all recent messages (e.g. last 30 days) and filter in memory, OR
        // fetch counts per session.

        // Let's fetch all messages created after the user's *oldest* relevant timestamp (likely last_sign_in_at)
        // AND match the session IDs we just fetched.
        if (lastSignInAt || Object.keys(readReceipts).length > 0) {
            // Find the baseline timestamp to fetch messages from. 
            // If we have read receipts, usage that. If not, use sign in.
            // Safest is to just fetch messages for the displayed sessions.
            const sessionIds = filteredSessions.map(s => s.id);

            if (sessionIds.length > 0) {
                const { data: messages } = await supabaseAdmin
                    .from('chat_messages')
                    .select('session_id, created_at')
                    .in('session_id', sessionIds); // This might be heavy if lots of messages. ideally filter by date.

                if (messages) {
                    messages.forEach((msg: { session_id: string; created_at: string }) => {
                        const sessionReadTime = readReceipts[msg.session_id];
                        // Effective read time is the LATER of (last_sign_in, last_read_receipt)
                        // If no read receipt, it defaults to last_sign_in
                        let threshold = lastSignInAt ? new Date(lastSignInAt).getTime() : 0;

                        if (sessionReadTime) {
                            const readTime = new Date(sessionReadTime).getTime();
                            if (readTime > threshold) {
                                threshold = readTime;
                            }
                        }

                        if (new Date(msg.created_at).getTime() > threshold) {
                            newMessageCounts[msg.session_id] = (newMessageCounts[msg.session_id] || 0) + 1;
                        }
                    });
                }
            }
        }

        // Fetch artist info AND capabilities for all songs in these sessions
        // We have to match by name since session_songs doesn't seem to have a proper FK in the current schema assumption
        const allSongNames = filteredSessions.flatMap(s => s.songs?.map((ss: { song_name: string }) => ss.song_name)) || [];
        const uniqueSongNames = [...new Set(allSongNames)];

        const songDetailsMap: Record<string, { artist: string, capabilities: unknown[] }> = {};

        if (uniqueSongNames.length > 0) {
            const { data: songsData } = await supabaseAdmin
                .from('songs')
                .select(`
                    title, 
                    artist,
                    song_capabilities (
                        capability:capabilities (
                            id,
                            name,
                            icon
                        )
                    )
                `)
                .in('title', uniqueSongNames);

            if (songsData) {
                songsData.forEach(s => {
                    songDetailsMap[s.title] = {
                        artist: s.artist,
                        capabilities: s.song_capabilities?.map((sc: { capability: unknown }) => sc.capability) || []
                    };
                });
            }
        }

        // Transform the data to match our types
        const transformedSessions = filteredSessions.map(session => ({
            ...session,
            songs: session.songs?.map((s: Record<string, unknown>) => {
                const details = songDetailsMap[s.song_name as string];
                return {
                    ...s,
                    song_artist: details?.artist || null,
                    capabilities: details?.capabilities || []
                };
            }),
            commitments: session.commitments?.map((c: Record<string, unknown>) => ({
                ...c,
                user: {
                    ...(c.user as Record<string, unknown>),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    capabilities: (c.user as any)?.capabilities?.map((uc: Record<string, unknown>) => (uc as any).capability) || [],
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                capabilities: (c.capabilities as any[])?.map((cc: Record<string, unknown>) => (cc as any).capability) || [],
            })) || [],
            commitments_count: session.commitments?.length || 0,
            newMessageCount: newMessageCounts[session.id] || 0,
        }));

        return NextResponse.json(transformedSessions);
    } catch (error) {
        console.error('Error in GET /api/sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}



export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Initialize admin client to ensure we can create sessions (bypassing RLS)
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

        const body = await request.json();
        const { date, start_time, end_time, songs } = body;

        // Use the authenticated user's ID or fall back to the first admin user found (if needed for testing)
        // Ideally we should enforce session.user.id
        const createdBy = session?.user?.id;

        if (!createdBy) {
            console.error('Unauthorized: No user session found');
            // Proceeding without ID usually fails DB constraints, but let's try to handle graceful fail or fallback if absolutely necessary for dev
            // For now, return 401
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create session
        const { data: newSession, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .insert({
                date,
                start_time: start_time || '19:30:00',
                end_time: end_time || '00:00:00',
                created_by: createdBy,
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Error creating session:', sessionError);
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
        }

        // Add songs if provided
        if (songs && songs.length > 0) {
            const songsToInsert = songs.map((song: Record<string, unknown>, index: number) => ({
                session_id: newSession.id,
                song_name: song.song_name,
                song_url: song.song_url || null,
                order: index,
            }));

            const { error: songsError } = await supabaseAdmin
                .from('session_songs')
                .insert(songsToInsert);

            if (songsError) {
                console.error('Error adding songs:', songsError);
            }

        }

        // Handle visibility if private
        const { is_public, visible_user_ids } = body;

        // Update is_public flag if provided (default true)
        if (is_public !== undefined) {
            const { error: updateError } = await supabaseAdmin
                .from('sessions')
                .update({ is_public })
                .eq('id', newSession.id);

            if (updateError) console.error('Error updating session visibility flag:', updateError);
        }

        if (is_public === false && visible_user_ids && visible_user_ids.length > 0) {
            const inserts = visible_user_ids.map((uid: string) => ({
                session_id: newSession.id,
                user_id: uid
            }));

            const { error: visError } = await supabaseAdmin
                .from('session_visibility')
                .insert(inserts);

            if (visError) {
                console.error('Error creating session visibility:', visError);
            }
        }

        return NextResponse.json(newSession);
    } catch (error) {
        console.error('Error in POST /api/sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

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
        console.error('Error in DELETE /api/sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
