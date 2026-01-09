import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

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

// POST /api/admin/approvals - Approve or reject users
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { userIds, action, capabilities } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
        }

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        // Update user status
        const { data: updatedUsers, error: updateError } = await supabaseAdmin
            .from('users')
            .update({ status: newStatus })
            .in('id', userIds)
            .select();

        if (updateError) {
            console.error('Error updating user status:', updateError);
            return NextResponse.json({ error: 'Failed to update users' }, { status: 500 });
        }

        // If approving and capabilities are provided, assign them
        if (action === 'approve' && capabilities && Array.isArray(capabilities) && capabilities.length > 0) {
            for (const userId of userIds) {
                // Remove existing capabilities
                await supabaseAdmin
                    .from('user_capabilities')
                    .delete()
                    .eq('user_id', userId);

                // Add new capabilities
                const capabilityRecords = capabilities.map(capId => ({
                    user_id: userId,
                    capability_id: capId
                }));

                await supabaseAdmin
                    .from('user_capabilities')
                    .insert(capabilityRecords);
            }
        }

        return NextResponse.json({
            success: true,
            updatedUsers,
            message: `Successfully ${action}d ${userIds.length} user(s)`
        });
    } catch (error) {
        console.error('Error in POST /api/admin/approvals:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
