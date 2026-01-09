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

// GET /api/admin/capabilities - List all capabilities
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { data: capabilities, error } = await supabaseAdmin
            .from('capabilities')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching capabilities:', error);
            return NextResponse.json({ error: 'Failed to fetch capabilities' }, { status: 500 });
        }

        return NextResponse.json(capabilities);
    } catch (error) {
        console.error('Error in GET /api/admin/capabilities:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/capabilities - Create new capability
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, icon = '🎸' } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Capability name is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('capabilities')
            .insert({ name: name.trim().toLowerCase(), icon })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return NextResponse.json({ error: 'Capability already exists' }, { status: 409 });
            }
            console.error('Error creating capability:', error);
            return NextResponse.json({ error: 'Failed to create capability' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in POST /api/admin/capabilities:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/capabilities - Update capability
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const capabilityId = searchParams.get('id');

        if (!capabilityId) {
            return NextResponse.json({ error: 'Capability ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { name, icon } = body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Capability name is required' }, { status: 400 });
        }

        const updates: Record<string, unknown> = { name: name.trim().toLowerCase() };
        if (icon) {
            updates.icon = icon;
        }

        const { data, error } = await supabaseAdmin
            .from('capabilities')
            .update(updates)
            .eq('id', capabilityId)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return NextResponse.json({ error: 'Capability name already exists' }, { status: 409 });
            }
            console.error('Error updating capability:', error);
            return NextResponse.json({ error: 'Failed to update capability' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in PATCH /api/admin/capabilities:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/capabilities - Delete capability
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const capabilityId = searchParams.get('id');

        if (!capabilityId) {
            return NextResponse.json({ error: 'Capability ID is required' }, { status: 400 });
        }

        // Check if capability is assigned to any users
        const { data: assignments, error: checkError } = await supabaseAdmin
            .from('user_capabilities')
            .select('id')
            .eq('capability_id', capabilityId)
            .limit(1);

        if (checkError) {
            console.error('Error checking capability assignments:', checkError);
            return NextResponse.json({ error: 'Failed to check capability usage' }, { status: 500 });
        }

        if (assignments && assignments.length > 0) {
            return NextResponse.json({
                error: 'Cannot delete capability that is assigned to users'
            }, { status: 409 });
        }

        const { error } = await supabaseAdmin
            .from('capabilities')
            .delete()
            .eq('id', capabilityId);

        if (error) {
            console.error('Error deleting capability:', error);
            return NextResponse.json({ error: 'Failed to delete capability' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/admin/capabilities:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
