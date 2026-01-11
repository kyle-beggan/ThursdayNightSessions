import { NextResponse } from 'next/server';
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

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) { // add userType check if strictly admin
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch data from all key tables
        // We use Promise.all for parallel fetching
        const [
            { data: users, error: usersError },
            { data: songs, error: songsError },
            { data: sessions, error: sessionsError },
            { data: capabilities, error: capsError },
            { data: commitments, error: commsError },
            { data: userCapabilities, error: userCapsError },
            { data: sessionSongs, error: sessionSongsError },
            { data: songCapabilities, error: songCapsError }
        ] = await Promise.all([
            supabaseAdmin.from('users').select('*'),
            supabaseAdmin.from('songs').select('*'),
            supabaseAdmin.from('sessions').select('*'),
            supabaseAdmin.from('capabilities').select('*'),
            supabaseAdmin.from('session_commitments').select('*'),
            supabaseAdmin.from('user_capabilities').select('*'),
            supabaseAdmin.from('session_songs').select('*'),
            supabaseAdmin.from('song_capabilities').select('*')
        ]);

        if (usersError || songsError || sessionsError || capsError || commsError || userCapsError || sessionSongsError || songCapsError) {
            console.error('Error fetching backup data:', { usersError, songsError, sessionsError, capsError, userCapsError });
            return NextResponse.json({ error: 'Failed to fetch database data' }, { status: 500 });
        }

        // 2. Create Workbook
        const wb = XLSX.utils.book_new();

        // 3. Add Sheets
        if (users) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(users), 'users');
        if (songs) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(songs), 'songs');
        if (sessions) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessions), 'sessions');
        if (capabilities) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(capabilities), 'capabilities');
        if (commitments) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(commitments), 'session_commitments');
        if (userCapabilities) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(userCapabilities), 'user_capabilities');
        if (sessionSongs) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionSongs), 'session_songs');
        if (songCapabilities) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(songCapabilities), 'song_capabilities');

        // 4. Generate Buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // 5. Return Response
        const dateStr = new Date().toISOString().split('T')[0];
        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="sleepyhollows-backup-${dateStr}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error) {
        console.error('Error in backup route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
