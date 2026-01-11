import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId } = await request.json();

        // Initialize admin client to bypass RLS
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

        // Check if a receipt already exists
        const query = supabaseAdmin
            .from('chat_read_receipts')
            .select('id')
            .eq('user_id', session.user.id);

        if (sessionId) {
            query.eq('session_id', sessionId);
        } else {
            query.is('session_id', null);
        }

        const { data: existingReceipt } = await query.single();

        let error;
        if (existingReceipt) {
            // Update existing
            const updateQuery = supabaseAdmin
                .from('chat_read_receipts')
                .update({ last_read_at: new Date().toISOString() })
                .eq('id', existingReceipt.id);
            ({ error } = await updateQuery);
        } else {
            // Insert new
            const insertQuery = supabaseAdmin
                .from('chat_read_receipts')
                .insert({
                    user_id: session.user.id,
                    session_id: sessionId || null,
                    last_read_at: new Date().toISOString()
                });
            ({ error } = await insertQuery);
        }

        if (error) {
            console.error('Error updating read receipt:', error);
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in POST /api/chat/read:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
