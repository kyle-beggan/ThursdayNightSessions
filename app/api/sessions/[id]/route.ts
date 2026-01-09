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
                )
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
            commitments: session.commitments?.map((c: any) => ({
                ...c,
                user: {
                    ...c.user,
                    capabilities: c.user?.capabilities?.map((uc: any) => uc.capability) || []
                },
                capabilities: c.capabilities?.map((cc: any) => cc.capability) || []
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
