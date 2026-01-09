import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client to bypass RLS
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

        const body = await request.json();
        const { session_id, user_id, capability_ids } = body;

        // Verify the user is acting for themselves or is an admin
        if (user_id !== session.user.id && session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Create commitment
        const { data: commitment, error: commitmentError } = await supabaseAdmin
            .from('session_commitments')
            .insert({
                session_id,
                user_id,
            })
            .select()
            .single();

        if (commitmentError) {
            console.error('Error creating commitment:', commitmentError);
            return NextResponse.json({ error: 'Failed to create commitment' }, { status: 500 });
        }

        // 2. Insert capabilities if provided
        if (capability_ids && capability_ids.length > 0) {
            const capabilitiesToInsert = capability_ids.map((capId: string) => ({
                session_commitment_id: commitment.id,
                capability_id: capId,
            }));

            const { error: capabilitiesError } = await supabaseAdmin
                .from('session_commitment_capabilities')
                .insert(capabilitiesToInsert);

            if (capabilitiesError) {
                console.error('Error inserting commitment capabilities:', capabilitiesError);
                // Try to cleanup the commitment if capabilities failed? 
                // Maybe, but for now just report error. The commitment exists though.
                // ideally we would run this in a transaction or cleanup.
                await supabaseAdmin.from('session_commitments').delete().eq('id', commitment.id);

                return NextResponse.json({ error: 'Failed to save capabilities' }, { status: 500 });
            }
        }

        return NextResponse.json(commitment);
    } catch (error) {
        console.error('Error in POST /api/commitments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { session_id, user_id } = body;

        // Verify the user is acting for themselves or is an admin
        if (user_id !== session.user.id && session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error } = await supabaseAdmin
            .from('session_commitments')
            .delete()
            .eq('session_id', session_id)
            .eq('user_id', user_id);

        if (error) {
            console.error('Error deleting commitment:', error);
            return NextResponse.json({ error: 'Failed to delete commitment' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/commitments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
