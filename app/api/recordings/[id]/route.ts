import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // IMPORTANT: Verify admin status (as per user request: "edit and delete buttons should only be visible to admins")
        // We enforce this on the server side as well.
        if (session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        const recordingId = params.id;

        if (!recordingId) {
            return NextResponse.json({ error: 'Missing recording ID' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Get the recording to find the file path (url) for storage deletion
        const { data: recording, error: fetchError } = await supabaseAdmin
            .from('session_recordings')
            .select('url')
            .eq('id', recordingId)
            .single();

        if (fetchError || !recording) {
            console.error('Error fetching recording for deletion:', fetchError);
            return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
        }

        // 2. Delete from Storage
        // Extract path from URL. URL format: .../storage/v1/object/public/recordings/session_id/filename.ext
        // We need 'session_id/filename.ext'
        const urlParts = recording.url.split('/recordings/');
        if (urlParts.length > 1) {
            const storagePath = urlParts[1];
            const { error: storageError } = await supabaseAdmin.storage
                .from('recordings')
                .remove([storagePath]);

            if (storageError) {
                console.warn('Failed to delete file from storage, but proceeding to delete DB record:', storageError);
            }
        }

        // 3. Delete from Database
        const { error: deleteError } = await supabaseAdmin
            .from('session_recordings')
            .delete()
            .eq('id', recordingId);

        if (deleteError) {
            console.error('Error deleting recording from DB:', deleteError);
            return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in DELETE /api/recordings/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
