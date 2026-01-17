import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize admin client to ensure we can delete bypassing RLS (since we manually checked permissions)
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

    try {
        // 1. Get the photo details to verify ownership and get storage path
        // We use admin client here too just in case RLS blocks SELECT for some reason (though it shouldn't for public read)
        const { data: photo, error: fetchError } = await supabaseAdmin
            .from('session_photos')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        // 2. Check permissions (Admin or Owner)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const isOwner = photo.user_id === session.user.id;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const isAdmin = session.user.userType === 'admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 3. Delete from Storage
        if (photo.storage_path) {
            const { error: storageError } = await supabaseAdmin.storage
                .from('session-media')
                .remove([photo.storage_path]);

            if (storageError) {
                console.error('Error deleting from storage:', storageError);
            }
        }

        // 4. Delete from Database
        const { error: deleteError } = await supabaseAdmin
            .from('session_photos')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting photo:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
