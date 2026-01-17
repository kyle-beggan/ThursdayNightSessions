import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: photos, error } = await supabase
        .from('session_photos')
        .select(`
            *,
            user:users (
                id,
                name,
                image
            )
        `)
        .eq('session_id', id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching session photos:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(photos);
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { storage_path } = body;

        if (!storage_path) {
            return NextResponse.json({ error: 'Storage path is required' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data: photo, error } = await supabase
            .from('session_photos')
            .insert({
                session_id: id,
                user_id: session.user.id,
                storage_path,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating photo record:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(photo);
    } catch (error) {
        console.error('Error in POST /api/sessions/[id]/photos:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
