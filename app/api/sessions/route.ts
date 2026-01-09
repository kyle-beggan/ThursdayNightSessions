import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        // TODO: Implement proper session check with next-auth beta
        // For now, sessions API is open - will be secured after auth is properly configured

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

        // Fetch sessions with songs and commitments
        const { data: sessions, error } = await supabaseAdmin
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
        )
      `)
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching sessions:', error);
            return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
        }

        // Transform the data to match our types
        const transformedSessions = sessions?.map(session => ({
            ...session,
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
        })) || [];

        return NextResponse.json(transformedSessions);
    } catch (error) {
        console.error('Error in GET /api/sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
                console.error('Error creating songs:', songsError);
            }
        }

        return NextResponse.json(newSession);
    } catch (error) {
        console.error('Error in POST /api/sessions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
