import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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

            {/* Quick Actions */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-text-primary mt-[25px]">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 mt-[25px]">
                    <Link
                        href="/admin/approvals"
                        className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">✅</div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-1">
                                    User Approvals
                                </h3>
                                <p className="text-text-secondary text-sm">
                                    Review and approve pending user registrations
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/admin/users"
                        className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">👥</div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-1">
                                    Manage Users
                                </h3>
                                <p className="text-text-secondary text-sm">
                                    View, edit, and manage all user accounts
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/admin/sessions"
                        className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">📅</div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-1">
                                    Manage Sessions
                                </h3>
                                <p className="text-text-secondary text-sm">
                                    Create, edit, and delete studio sessions
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/admin/capabilities"
                        className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">🎸</div>
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary mb-1">
                                    Manage Capabilities
                                </h3>
                                <p className="text-text-secondary text-sm">
                                    Add, edit, and remove user capabilities
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
