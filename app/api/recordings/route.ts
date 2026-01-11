import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { session_id, url, title } = await request.json();

        if (!session_id || !url || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Initialize user-context client to respect RLS
        // We use the service key here just to be safe with permissions if RLS logic is complex, 
        // BUT strict adherence to "Users can upload recordings" policy checks `auth.uid()`.
        // Since we are server-side, we can simulate the user or just use admin and manually enforce.
        // The policy `auth.uid() = created_by` works if we use `supabase.auth.setSession` or similar, 
        // but easier to just use Admin client and insert `created_by` manually since we trusted `session.user.id`.

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabaseAdmin
            .from('session_recordings')
            .insert({
                session_id,
                url,
                title,
                created_by: session.user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving recording:', error);
            return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in POST /api/recordings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch recordings with session date and player capabilities
        const { data, error } = await supabaseAdmin
            .from('session_recordings')
            .select(`
                id,
                title,
                url,
                created_at,
                session_id,
                sessions (
                    date,
                    session_commitments (
                        users ( name ),
                        session_commitment_capabilities (
                            capabilities ( icon, name )
                        )
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching recordings:', error);
            return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
        }

        // Define expected DB shape
        interface RecordingDB {
            id: string;
            title: string;
            url: string;
            created_at: string;
            sessions: {
                date: string;
                session_commitments: {
                    users: { name: string } | null;
                    session_commitment_capabilities: {
                        capabilities: { icon: string; name: string } | null;
                    }[];
                }[];
            } | null;
        }

        // Transform data for easier frontend consumption
        const formattedRecordings = (data as unknown as RecordingDB[]).map((rec) => {
            const players = rec.sessions?.session_commitments?.map((commitment) => {
                const caps = commitment.session_commitment_capabilities?.map((cc) => ({
                    icon: cc.capabilities?.icon,
                    name: cc.capabilities?.name
                })) || [];

                return {
                    name: commitment.users?.name || 'Unknown',
                    capabilities: caps
                };
            }) || [];

            return {
                id: rec.id,
                title: rec.title,
                url: rec.url,
                created_at: rec.created_at,
                session_date: rec.sessions?.date,
                players
            };
        });

        return NextResponse.json(formattedRecordings);

    } catch (error) {
        console.error('Error in GET /api/recordings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
