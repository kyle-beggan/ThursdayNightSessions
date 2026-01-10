import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Admin client for cross-table aggregation bypassing RLS
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

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const currentYear = new Date().getFullYear();

        // Default to current year Dec 31 if not provided
        const endDate = endDateParam ? new Date(endDateParam) : new Date(currentYear, 11, 31);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);

        const startDate = startDateParam ? new Date(startDateParam) : new Date(currentYear, 0, 1);
        // Set start date to start of day
        startDate.setHours(0, 0, 0, 0);

        const startIso = startDate.toISOString();
        const endIso = endDate.toISOString();

        // 1. Fetch Key Counts (Filtered by date for Sessions)
        const { count: sessionCount, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .gte('date', startIso)
            .lte('date', endIso);

        const { count: userCount, error: userError } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved'); // Count total active users (independent of date range usually)

        if (sessionError || userError) {
            console.error('Error fetching counts:', sessionError || userError);
            throw new Error('Failed to fetch counts');
        }

        // 2. Fetch Sessions for Attendance History
        const { data: sessionsData, error: sessionsError } = await supabaseAdmin
            .from('sessions')
            .select(`
                id,
                date,
                session_commitments (count)
            `)
            .gte('date', startIso)
            .lte('date', endIso)
            .order('date', { ascending: true });

        if (sessionsError) throw sessionsError;

        const attendanceHistory = sessionsData?.map(s => ({
            date: s.date,
            attendees: s.session_commitments[0]?.count || 0
        })) || [];

        // Calculate Average Attendance
        const totalAttendance = attendanceHistory.reduce((sum, item) => sum + item.attendees, 0);
        const avgAttendance = attendanceHistory.length > 0
            ? Math.round((totalAttendance / attendanceHistory.length) * 10) / 10
            : 0;


        // 3. Fetch Member Attendance (Filtered by Sessions in Date Range)
        // We need session_ids from the filtered sessions above
        const sessionIds = sessionsData?.map(s => s.id) || [];

        // Fetch all users to map names (avoids JOIN issues if FK missing)
        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, name');

        if (usersError) throw usersError;

        const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

        let memberAttendance: { name: string; count: number }[] = [];

        if (sessionIds.length > 0) {
            const { data: commitmentData, error: commitmentError } = await supabaseAdmin
                .from('session_commitments')
                .select('user_id')
                .in('session_id', sessionIds);

            if (commitmentError) throw commitmentError;

            const attendanceCounts: Record<string, number> = {};
            commitmentData?.forEach(c => {
                const name = userMap.get(c.user_id) || 'Unknown';
                attendanceCounts[name] = (attendanceCounts[name] || 0) + 1;
            });

            memberAttendance = Object.entries(attendanceCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        }


        // 4. Fetch Capabilities Distribution (Keep global for now as "Band Composition")
        const { data: capabilitiesData, error: capError } = await supabaseAdmin
            .from('user_capabilities')
            .select(`
                capabilities (name)
            `);

        if (capError) throw capError;

        const capCounts: Record<string, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        capabilitiesData?.forEach((item: any) => {
            const name = item.capabilities?.name;
            if (name) {
                capCounts[name] = (capCounts[name] || 0) + 1;
            }
        });

        const instrumentDistribution = Object.entries(capCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // 5. Fetch Global Date Range (Earliest and Latest Session)
        const { data: dateRangeData, error: dateRangeError } = await supabaseAdmin
            .from('sessions')
            .select('date')
            .order('date', { ascending: true });

        // Simple min/max extraction (PostgREST doesn't support aggregate min/max directly in select without group by usually, 
        // ensuring order and taking first/last is efficient enough for this scale)
        let allTimeStart = new Date(currentYear, 0, 1).toISOString();
        let allTimeEnd = new Date(currentYear, 11, 31).toISOString();

        if (!dateRangeError && dateRangeData && dateRangeData.length > 0) {
            allTimeStart = dateRangeData[0].date;
            allTimeEnd = dateRangeData[dateRangeData.length - 1].date;
        }

        // 6. Fetch Songs Stats (Total count & Key Distribution)
        const { data: songsData, error: songsError } = await supabaseAdmin
            .from('songs')
            .select('key');

        if (songsError) {
            console.error('Error fetching songs stats:', songsError);
        }

        const totalSongs = songsData?.length || 0;

        // Calculate Key Distribution
        const keyCounts: Record<string, number> = {};
        songsData?.forEach(s => {
            if (s.key) {
                // Normalize slightly if needed, but assuming standard format
                const key = s.key.trim();
                keyCounts[key] = (keyCounts[key] || 0) + 1;
            }
        });

        const songKeyDistribution = Object.entries(keyCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 keys

        // 7. Fetch Total Recordings
        const { count: recordingsCount, error: recordingsError } = await supabaseAdmin
            .from('session_recordings')
            .select('*', { count: 'exact', head: true });

        if (recordingsError) {
            console.error('Error fetching recordings count:', recordingsError);
        }

        return NextResponse.json({
            stats: {
                totalSessions: sessionCount || 0,
                activeUsers: userCount || 0,
                avgAttendance,
                totalSongs,
                totalRecordings: recordingsCount || 0
            },
            charts: {
                attendanceHistory,
                memberAttendance,
                instrumentDistribution,
                songKeyDistribution
            },
            meta: {
                allTime: {
                    start: allTimeStart,
                    end: allTimeEnd
                }
            }
        });

    } catch (error) {
        console.error('Error in GET /api/analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
