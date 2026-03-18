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

// DELETE /api/songs/comments/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Fetch comment to check ownership
        const { data: comment, error: fetchError } = await supabaseAdmin
            .from('song_comments')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchError || !comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }

        // Allow deletion if owner or admin
        const isAdmin = session.user.userType === 'admin';
        const isOwner = comment.user_id === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error: deleteError } = await supabaseAdmin
            .from('song_comments')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting song comment:', deleteError);
            return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/songs/comments/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
