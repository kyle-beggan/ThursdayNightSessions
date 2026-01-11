import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch current user's profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user:', userError);
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
        }

        // Fetch user capabilities
        const { data: userCapabilities, error: capError } = await supabase
            .from('user_capabilities')
            .select(`
                capability_id,
                capabilities (
                    id,
                    name,
                    icon
                )
            `)
            .eq('user_id', userId);

        if (capError) {
            console.error('Error fetching capabilities:', capError);
            return NextResponse.json({ error: 'Failed to fetch capabilities' }, { status: 500 });
        }

        // Format capabilities
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = userCapabilities?.map((uc: any) => ({
            id: uc.capabilities.id,
            name: uc.capabilities.name,
            icon: uc.capabilities.icon
        })) || [];

        return NextResponse.json({
            ...user,
            capabilities
        });
    } catch (error) {
        console.error('Error in GET /api/profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update current user's profile
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();
        const { name, email, phone, image, capabilities } = body;

        // Update user basic info
        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (image !== undefined) updates.image = image;

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId);

            if (updateError) {
                console.error('Error updating user:', updateError);
                return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
            }
        }

        // Update capabilities if provided
        if (capabilities !== undefined && Array.isArray(capabilities)) {
            // Delete existing capabilities
            const { error: deleteError } = await supabase
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

                const { error: insertError } = await supabase
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
        console.error('Error in PATCH /api/profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
