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

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { feedback_id, message } = body;

        if (!feedback_id || !message) {
            return NextResponse.json({ error: 'Feedback ID and message are required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('feedback_replies')
            .insert({
                user_id: session.user.id,
                feedback_id,
                message
            })
            .select('*, user:users(name, image)')
            .single();

        if (error) {
            console.error('Error submitting reply:', error);
            return NextResponse.json({ error: 'Failed to submit reply' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in POST /api/feedback/reply:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
