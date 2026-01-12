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
        const { category, message } = body;

        if (!category || !message) {
            return NextResponse.json({ error: 'Category and message are required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('feedback')
            .insert({
                user_id: session.user.id,
                category,
                message,
                status: 'pending' // Default status
            });

        if (error) {
            console.error('Error submitting feedback:', error);
            return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in POST /api/feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
