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

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin - Use the session value directly if trusted, or double check DB if critical
        // Since we are using NextAuth, session.user should be populated from the token. 
        // We can double check the DB to be safe or just trust the session if user_type is in it.
        // Let's query DB to be super safe and consistent with the previous auth-helper logic which queried DB.

        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

        if (userError || user?.user_type !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { feedbackId, status } = body;

        if (!feedbackId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const validStatuses = ['pending', 'rejected', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('feedback')
            .update({ status })
            .eq('id', feedbackId);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
