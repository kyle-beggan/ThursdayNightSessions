import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: user } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

        if (user?.user_type !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { feedbackId, status } = await request.json();

        if (!feedbackId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const validStatuses = ['pending', 'rejected', 'in_progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const { error } = await supabase
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
