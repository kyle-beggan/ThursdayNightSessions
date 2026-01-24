import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!session?.user?.id || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fileName, fileType } = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
        }

        // Initialize admin client to sign URL
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Generate a unique path: timestamp-original
        // We probably want to keep names relatively clean
        const path = fileName;

        // Ensure 'icons' bucket exists
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'icons')) {
            await supabaseAdmin.storage.createBucket('icons', {
                public: true,
                fileSizeLimit: 2097152, // 2MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
            });
        }

        const { data, error } = await supabaseAdmin.storage
            .from('icons')
            .createSignedUploadUrl(path);

        if (error) {
            console.error('Error creating signed url for icon:', error);
            return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in POST /api/admin/capabilities/icon/sign:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
