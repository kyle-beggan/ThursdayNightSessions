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

// GET /api/admin/users - List all users with optional filtering
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        let query = supabaseAdmin
            .from('users')
            .select(`
                *,
                user_capabilities (
                    capability_id,
                    capabilities (
                        id,
                        name,
                        icon
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: users, error } = await query;

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Transform the data to flatten capabilities
        const transformedUsers = users?.map(user => ({
            ...user,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            capabilities: user.user_capabilities?.map((uc: any) => ({
                id: uc.capabilities.id,
                name: uc.capabilities.name,
                icon: uc.capabilities.icon
            })) || []
        }));

        return NextResponse.json(transformedUsers);
    } catch (error) {
        console.error('Error in GET /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/users - Update user (used for individual user updates)
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, updates } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Separate capabilities from other updates if present
        const { capabilities, ...userUpdates } = updates;

        // Update user basic info
        if (Object.keys(userUpdates).length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update(userUpdates)
                .eq('id', userId);

            if (updateError) {
                console.error('Error updating user:', updateError);
                return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
            }
        }

        // Update capabilities if provided
        if (capabilities && Array.isArray(capabilities)) {
            // Delete existing capabilities
            const { error: deleteError } = await supabaseAdmin
                .from('user_capabilities')
                .delete()
                .eq('user_id', userId);

            if (deleteError) {
                console.error('Error deleting capabilities:', deleteError);
                return NextResponse.json({ error: 'Failed to update capabilities' }, { status: 500 });
            }

            // Insert new capabilities
            if (capabilities.length > 0) {
                const capabilityInserts = capabilities.map((capId: string) => ({
                    user_id: userId,
                    capability_id: capId
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('user_capabilities')
                    .insert(capabilityInserts);

                if (insertError) {
                    console.error('Error inserting capabilities:', insertError);
                    return NextResponse.json({ error: 'Failed to update capabilities' }, { status: 500 });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.warn('Error deleting auth user (may not exist):', authError);
            // Continue to delete from public.users even if auth deletion failed
            // This handles cases where the user exists in public.users but not in auth.users (e.g. seeded data)
        }

        // Delete from public.users (explicitly, though cascade might handle it)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (dbError) {
            console.error('Error deleting user record:', dbError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/admin/users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
