import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fileName, fileType } = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
        }

        // Initialize admin client to sign URL (bypasses RLS for signing, 
        // but acts on behalf of the user's intent validation done above)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Generate a unique path: sessionId/timestamp-originalName
        // Note: filename passed from frontend already includes session ID and timestamp pathing
        const path = fileName;

        const { data, error } = await supabaseAdmin.storage
            .from('recordings')
            .createSignedUploadUrl(path);

        if (error) {
            console.error('Error creating signed url:', error);
            return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in POST /api/recordings/sign:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
