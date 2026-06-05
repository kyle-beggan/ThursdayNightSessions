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

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        // Allow unauthenticated fetch? No, stick to authenticated for now to show user votes
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch feedback with votes
        // Note: Supabase JS doesn't do deep aggregation easily in one query without a view or rpc function.
        // We will fetch feedback and all votes, then aggregate in code (server-side).
        // For a larger app, we'd use a SQL View or .rpc().

        const { data: feedbackData, error: feedbackError } = await supabaseAdmin
            .from('feedback')
            .select(`
                *,
                user:users(name),
                votes:feedback_votes(user_id, vote_type),
                replies:feedback_replies(*, user:users(name, image))
            `)
            .order('created_at', { ascending: false });

        if (feedbackError) {
            console.error('Error fetching feedback:', feedbackError);
            return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
        }

        interface FeedbackVote {
            user_id: string;
            vote_type: 'up' | 'down';
        }

        interface FeedbackReply {
            id: string;
            created_at: string;
            user: { name: string; image: string | null } | null;
        }

        interface FeedbackItemRaw {
            id: string;
            category: string;
            message: string;
            status: string;
            created_at: string;
            user: { name: string } | null;
            votes: FeedbackVote[];
            replies: FeedbackReply[];
        }

        // Transform data to include counts and user status
        const enrichedFeedback = (feedbackData as unknown as FeedbackItemRaw[]).map((item) => {
            const votes = item.votes || [];
            const upvotes = votes.filter((v) => v.vote_type === 'up').length;
            const downvotes = votes.filter((v) => v.vote_type === 'down').length;
            const userVote = votes.find((v) => v.user_id === userId)?.vote_type || null;

            return {
                ...item,
                upvotes,
                downvotes,
                user_vote: userVote,
                user_name: item.user?.name || 'Unknown User',
                replies: item.replies?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
            };
        });

        // Optional: Sort by popularity? Or just keep chronological.
        // Let's stick to chronological (newest first) as requested by .order above.

        return NextResponse.json(enrichedFeedback);

    } catch (error) {
        console.error('Error in GET /api/feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const feedbackId = searchParams.get('id');

        if (!feedbackId) {
            return NextResponse.json({ error: 'Missing feedback id' }, { status: 400 });
        }

        // Fetch user type to check if they are an admin
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

        if (userError) {
            console.error('Error verifying user type:', userError);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch feedback to check creator
        const { data: feedback, error: feedbackError } = await supabaseAdmin
            .from('feedback')
            .select('user_id')
            .eq('id', feedbackId)
            .single();

        if (feedbackError) {
            console.error('Error verifying feedback ownership:', feedbackError);
            return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
        }

        const isAdmin = user?.user_type === 'admin';
        const isCreator = feedback?.user_id === session.user.id;

        if (!isAdmin && !isCreator) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete the feedback item (cascades automatically delete replies and votes in db)
        const { error: deleteError } = await supabaseAdmin
            .from('feedback')
            .delete()
            .eq('id', feedbackId);

        if (deleteError) {
            console.error('Error deleting feedback:', deleteError);
            return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE /api/feedback:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
