import { createClient } from '@supabase/supabase-js';
import AdminQuickActions from '@/components/admin/AdminQuickActions';

// Initialize Supabase Admin client to bypass RLS
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

async function getStats() {
    // Run queries in parallel
    const [
        { count: pendingCount },
        { count: activeCount },
        { count: sessionCount },
        { count: capabilityCount }
    ] = await Promise.all([
        supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
        supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved'),
        supabaseAdmin
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .gte('date', new Date().toISOString()), // Upcoming sessions
        supabaseAdmin
            .from('capabilities')
            .select('*', { count: 'exact', head: true })
    ]);

    return {
        pendingCount: pendingCount || 0,
        activeCount: activeCount || 0,
        sessionCount: sessionCount || 0,
        capabilityCount: capabilityCount || 0
    };
}

export default async function AdminPage() {
    const stats = await getStats();

    return (
        <div>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-[25px]">
                <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm">Pending Approvals</p>
                            <p className="text-3xl font-bold text-text-primary mt-2">{stats.pendingCount}</p>
                        </div>
                        <div className="text-4xl">⏳</div>
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm">Active Users</p>
                            <p className="text-3xl font-bold text-text-primary mt-2">{stats.activeCount}</p>
                        </div>
                        <div className="text-4xl">👥</div>
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm">Upcoming Sessions</p>
                            <p className="text-3xl font-bold text-text-primary mt-2">{stats.sessionCount}</p>
                        </div>
                        <div className="text-4xl">📅</div>
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-secondary text-sm">Total Capabilities</p>
                            <p className="text-3xl font-bold text-text-primary mt-2">{stats.capabilityCount}</p>
                        </div>
                        <div className="text-4xl">🎸</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions (Client Component) */}
            <AdminQuickActions />
        </div>
    );
}
