import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

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

// Initialize Twilio Client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export async function POST(request: Request) {
    try {
        // 1. Auth Check (Admin Only)
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Validate Twilio Config
        if (!twilioClient || !twilioPhoneNumber) {
            console.error('Twilio configuration missing');
            return NextResponse.json({
                error: 'SMS service not configured',
                details: 'Missing TWILIO credentials'
            }, { status: 503 });
        }

        const body = await request.json();
        const { message } = body;

        if (!message || !message.trim()) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        const messageBody = message.trim();

        // 3. Fetch All Approved Users
        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, name, phone')
            .eq('status', 'approved');

        if (usersError || !users) {
            console.error('Error fetching approved users:', usersError);
            return NextResponse.json({ error: 'Failed to retrieve recipients' }, { status: 500 });
        }

        // 4. Filter Users with Phones
        const recipients = users.filter((u: { name: string; phone: string }) => u.phone && u.phone.trim().replace(/\D/g, '').length >= 10);

        if (recipients.length === 0) {
            return NextResponse.json({
                message: 'No approved users with valid phone numbers found',
                sentCount: 0
            });
        }

        // 5. Send Messages in Parallel
        let sentCount = 0;
        let failCount = 0;

        await Promise.all(recipients.map(async (user: { name: string; phone: string }) => {
            try {
                // Formatting: remove all non-digits
                let cleanPhone = user.phone.replace(/\D/g, '');

                // Assuming US/Canada: if 10 digits, add +1. If 11 digits starting with 1, add +.
                if (cleanPhone.length === 10) {
                    cleanPhone = `+1${cleanPhone}`;
                } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
                    cleanPhone = `+${cleanPhone}`;
                } else {
                    // Fallback: Just ensure it has a plus if it looks like a full international number
                    if (!user.phone.startsWith('+')) {
                        cleanPhone = `+${cleanPhone}`;
                    } else {
                        cleanPhone = user.phone;
                    }
                }

                console.log(`[SMS Broadcast] Sending to ${user.name} (${cleanPhone})...`);

                const result = await twilioClient.messages.create({
                    body: messageBody,
                    from: twilioPhoneNumber,
                    to: cleanPhone
                });

                console.log(`[SMS Broadcast] Success! SID: ${result.sid}`);
                sentCount++;
            } catch (err: unknown) {
                console.error(`[SMS Broadcast] Failed to send to ${user.name} (${user.phone}):`, (err as Error).message || String(err));
                failCount++;
            }
        }));

        // 6. Log to notifications audit trail if any messages were successfully sent
        if (sentCount > 0) {
            const { error: logError } = await supabaseAdmin
                .from('notifications')
                .insert({
                    sent_by: session.user.id,
                    notification_type: 'broadcast',
                    channel: 'sms',
                    message: messageBody,
                    recipient_count: sentCount
                });

            if (logError) {
                console.error('[SMS Broadcast] Error logging notification to DB:', logError);
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failCount,
            totalRecipients: recipients.length
        });

    } catch (error: unknown) {
        console.error('Error in /api/notify/broadcast:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
