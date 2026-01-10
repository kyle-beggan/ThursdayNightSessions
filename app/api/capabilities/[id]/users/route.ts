import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Initialize admin client to bypass RLS
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

        // Fetch user_capabilities joined with users
        const { data, error } = await supabaseAdmin
            .from('user_capabilities')
            .select(`
                user:users (
                    id,
                    name,
                    email,
                    phone
                )
            `)
            .eq('capability_id', id);

        if (error) {
            console.error('Error fetching candidates:', error);
            return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
        }

        // Extract users from the join result
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidates = data?.map((item: any) => item.user).filter(Boolean) || [];

        return NextResponse.json(candidates);
    } catch (error) {
        console.error('Error in GET /api/capabilities/[id]/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
