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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipients = sessionData.session_commitments
            .map((c: any) => c.users)
            .filter((u: any) => u.phone && u.phone.length >= 10);

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

        await Promise.all(recipients.map(async (user: any) => {
            try {
                await twilioClient.messages.create({
                    body: messageBody,
                    from: twilioPhoneNumber,
                    to: user.phone
                });
                sentCount++;
            } catch (err) {
                console.error(`Failed to send SMS to ${user.name}:`, err);
                failCount++;
            }
        }));

        return NextResponse.json({
            success: true,
            sentCount,
            failCount,
            totalRecipients: recipients.length
        });

    } catch (error) {
        console.error('Error in /api/notify/remind:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
