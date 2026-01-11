import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ count: 0 });
        }

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

        // Fetch user's last_sign_in_at
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('last_sign_in_at')
            .eq('id', session.user.id)
            .single();

        const lastSignInAt = userData?.last_sign_in_at;

        // Fetch global read receipt
        const { data: readReceipt } = await supabaseAdmin
            .from('chat_read_receipts')
            .select('last_read_at')
            .eq('user_id', session.user.id)
            .is('session_id', null)
            .single();

        let thresholdRaw = lastSignInAt;
        if (readReceipt?.last_read_at) {
            // If read receipt is newer than sign in (or sign in is null), use receipt
            if (!lastSignInAt || new Date(readReceipt.last_read_at) > new Date(lastSignInAt)) {
                thresholdRaw = readReceipt.last_read_at;
            }
        }

        if (!thresholdRaw) {
            return NextResponse.json({ count: 0 });
        }

        // Count global messages (session_id is null) created after threshold
        const { count, error } = await supabaseAdmin
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .is('session_id', null)
            .gt('created_at', thresholdRaw);

        if (error) {
            console.error('Error counting unread messages:', error);
            return NextResponse.json({ count: 0 });
        }

        return NextResponse.json({ count: count || 0 });
    } catch (error) {
        console.error('Error in GET /api/chat/unread:', error);
        return NextResponse.json({ count: 0 });
    }
}
