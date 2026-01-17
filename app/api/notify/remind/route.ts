import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { format } from 'date-fns';

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
        const { sessionId, message } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        // 3. Fetch Session Details & Commitments
        const { data: sessionData, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                session_commitments (
                    user_id,
                    users (
                        name,
                        phone
                    )
                )
            `)
            .eq('id', sessionId)
            .single();

        if (sessionError || !sessionData) {
            console.error('Error fetching session:', sessionError);
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 4. Filter Users with Phones
        // 4. Filter Users with Phones
        const recipients = sessionData.session_commitments
            .map((c: { users: { name: string; phone: string } }) => c.users)
            .filter((u: { name: string; phone: string }) => u.phone && u.phone.length >= 10);

        if (recipients.length === 0) {
            return NextResponse.json({
                message: 'No players with phone numbers found for this session',
                sentCount: 0
            });
        }

        // 5. Format Message (Use provided message or default)
        let messageBody = message;
        if (!messageBody) {
            const sessionDate = format(new Date(sessionData.date + 'T00:00:00'), 'MMMM d');
            const sessionTime = format(new Date(`2000-01-01T${sessionData.start_time}`), 'h:mm a');
            messageBody = `Reminder: You have a session at Sleepy Hollows on ${sessionDate} at ${sessionTime}. See you there! 🎸`;
        }

        // 6. Send Messages
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

                console.log(`[SMS] Sending to ${user.name} (${cleanPhone})...`);

                const result = await twilioClient.messages.create({
                    body: messageBody,
                    from: twilioPhoneNumber,
                    to: cleanPhone
                });

                console.log(`[SMS] Success! SID: ${result.sid}`);
                sentCount++;
            } catch (err: unknown) {
                console.error(`[SMS] Failed to send to ${user.name} (${user.phone}):`, (err as Error).message || String(err));
                failCount++;
            }
        }));

        return NextResponse.json({
            success: true,
            sentCount,
            failCount,
            totalRecipients: recipients.length
        });

    } catch (error: unknown) {
        console.error('Error in /api/notify/remind:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
