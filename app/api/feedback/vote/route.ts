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
        const { feedback_id, vote_type } = body;

        if (!feedback_id) {
            return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
        }

        const userId = session.user.id;

        // If vote_type is null or 'none', remove the vote
        if (!vote_type || vote_type === 'none') {
            const { error } = await supabaseAdmin
                .from('feedback_votes')
                .delete()
                .eq('user_id', userId)
                .eq('feedback_id', feedback_id);

            if (error) throw error;
        } else {
            // Upsert the vote
            if (!['up', 'down'].includes(vote_type)) {
                return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
            }

            const { error } = await supabaseAdmin
                .from('feedback_votes')
                .upsert({
                    user_id: userId,
                    feedback_id,
                    vote_type
                }, {
                    onConflict: 'user_id,feedback_id'
                });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in POST /api/feedback/vote:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
