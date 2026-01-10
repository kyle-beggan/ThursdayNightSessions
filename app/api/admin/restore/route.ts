import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Admin client to bypass RLS
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

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Define table order for restoration to respect Foreign Key constraints
        // 1. Independent tables (users, songs, capabilities)
        // 2. Dependent tables (sessions, user_capabilities)
        // 3. Junction tables (session_songs, session_commitments, song_capabilities)
        const tables = [
            'users',
            'songs',
            'capabilities',
            'sessions',
            'user_capabilities',
            'session_commitments',
            'session_songs',
            'song_capabilities'
        ];

        const results: Record<string, any> = {};

        for (const tableName of tables) {
            const sheet = workbook.Sheets[tableName];
            if (sheet) {
                const data = XLSX.utils.sheet_to_json(sheet);
                if (data.length > 0) {
                    console.log(`Restoring ${data.length} rows to ${tableName}`);

                    // Upsert data
                    const { error } = await supabaseAdmin
                        .from(tableName)
                        .upsert(data, { onConflict: 'id', ignoreDuplicates: false }); // ignoreDuplicates: false means UPDATE if exists

                    if (error) {
                        console.error(`Error restoring ${tableName}:`, error);
                        results[tableName] = { status: 'error', error: error.message };
                    } else {
                        results[tableName] = { status: 'success', count: data.length };
                    }
                } else {
                    results[tableName] = { status: 'skipped', reason: 'empty sheet' };
                }
            } else {
                results[tableName] = { status: 'skipped', reason: 'sheet not found' };
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Error in restore route:', error);
        return NextResponse.json({ error: `Restore failed: ${error.message}` }, { status: 500 });
    }
}
