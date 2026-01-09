import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: capabilities, error } = await supabase
            .from('capabilities')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching capabilities:', error);
            return NextResponse.json({ error: 'Failed to fetch capabilities' }, { status: 500 });
        }

        return NextResponse.json(capabilities);
    } catch (error) {
        console.error('Error in GET /api/capabilities:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
