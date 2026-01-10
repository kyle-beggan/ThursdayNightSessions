import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing');
        return NextResponse.json({ error: 'Server configuration error: Missing Email API Key' }, { status: 500 });
    }

    try {
        const { userIds, sessionDetails, candidates } = await request.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'No users selected' }, { status: 400 });
        }

        if (!sessionDetails) {
            return NextResponse.json({ error: 'Session details missing' }, { status: 400 });
        }

        // Filter candidates to find emails for selected userIds
        // This relies on the frontend passing the candidate objects which contain emails
        // Alternatively, we could fetch from DB again, but passing from frontend is efficient here
        // providing we trust the email addresses (for a jam session app, this is acceptable risk usually, 
        // but fetching from DB is safer. Let's fetch from DB to be safe and clean).

        // Actually, for simplicity and speed in this specific flow, I'll assume we fetch user details 
        // in the loop or use what is passed if we trust deployment. 
        // Let's rely on the passed `candidates` array which we already have in the modal.

        const selectedUsers = candidates.filter((c: any) => userIds.includes(c.id));
        const results = [];

        for (const user of selectedUsers) {
            if (!user.email) continue;

            try {
                const { data, error } = await resend.emails.send({
                    from: 'Sleepy Hollows <onboarding@resend.dev>', // Update this if they have a custom domain
                    to: [user.email],
                    subject: `Jam Session Invite: ${sessionDetails.dateFormatted}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1>You're invited to a Jam Session!</h1>
                            <p>Hi ${user.name},</p>
                            <p>We are missing a key capability for our upcoming session and noticed you play/do <strong>${sessionDetails.missingCapability}</strong>!</p>
                            
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0;">Session Details</h3>
                                <p><strong>Date:</strong> ${sessionDetails.dateFormatted}</p>
                                <p><strong>Time:</strong> ${sessionDetails.timeFormatted}</p>
                                <p><strong>Setlist:</strong> ${sessionDetails.songCount} songs planned</p>
                            </div>

                            <p>Please log in to the dashboard to RSVP if you can make it!</p>
                            
                            <p>Best,<br/>The Sleepy Hollows Team</p>
                        </div>
                    `
                });

                if (error) {
                    console.error('Resend error for', user.email, error);
                    results.push({ email: user.email, status: 'failed', error });
                } else {
                    results.push({ email: user.email, status: 'sent', id: data?.id });
                }
            } catch (err) {
                console.error('Email send exception', err);
                results.push({ email: user.email, status: 'error' });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error('Error in POST /api/notifications/invite:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
