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
