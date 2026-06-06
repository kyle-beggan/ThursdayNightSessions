import { NextRequest, NextResponse } from 'next/server';
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

// context: { params: { id: string } }
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const { data: session, error } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                songs:session_songs(*),
                commitments:session_commitments(
                  *,
                  user:users(
                    id,
                    name,
                    email,
                    capabilities:user_capabilities(
                      capability:capabilities(*)
                    )
                  ),
                  capabilities:session_commitment_capabilities(
                     capability:capabilities(*)
                  )
                ),
                recordings:session_recordings(*),
                photos:session_photos(*),
                visibility:session_visibility(user_id)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching session:', error);
            return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
        }

        // Transform data to match frontend types (handling capabilities nesting)
        const transformedSession = {
            ...session,
            commitments: session.commitments?.map((c: { user?: { capabilities?: { capability: unknown }[] }; capabilities?: { capability: unknown }[] } & Record<string, unknown>) => ({
                ...c,
                user: {
                    ...c.user,
                    capabilities: c.user?.capabilities?.map((uc) => uc.capability) || []
                },
                capabilities: c.capabilities?.map((cc) => cc.capability) || []
            })) || [],
            visibility: session.visibility?.map((v: { user_id: string }) => ({
                user_id: v.user_id
            })) || []
        };

        return NextResponse.json(transformedSession);

    } catch (error) {
        console.error('Error in GET /api/sessions/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// context: { params: { id: string } }
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        // Ensure user is authenticated and is an admin
        if (!session?.user || (session.user as { userType?: string }).userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Await params as required in newer Next.js versions
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        let message: string | undefined;
        try {
            const body = await request.json();
            message = body?.message;
        } catch {
            // body is optional/empty
        }

        // Get commitments and phone numbers before deleting
        const { data: sessionData, error: sessionFetchError } = await supabaseAdmin
            .from('sessions')
            .select(`
                *,
                session_commitments (
                    status,
                    user_id,
                    users (
                        name,
                        phone
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (sessionFetchError) {
            console.error('Error fetching session details before deletion:', sessionFetchError);
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const { error } = await supabaseAdmin
            .from('sessions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting session:', error);
            return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
        }

        let sentCount = 0;
        let failCount = 0;
        let recipientsCount = 0;

        if (message && sessionData?.session_commitments) {
            interface CommitmentUser {
                name: string;
                phone: string | null;
            }
            interface Commitment {
                status: string | null;
                user_id: string;
                users: CommitmentUser | null;
            }

            const commitments = sessionData.session_commitments as unknown as Commitment[];
            const recipients = commitments
                .filter((c) => !c.status || c.status === 'confirmed')
                .map((c) => c.users)
                .filter((u): u is CommitmentUser => !!(u && u.phone && u.phone.replace(/\D/g, '').length >= 10));

            recipientsCount = recipients.length;

            if (recipients.length > 0) {
                if (twilioClient && twilioPhoneNumber) {
                    await Promise.all(recipients.map(async (user) => {
                        try {
                            let cleanPhone = user.phone!.replace(/\D/g, '');
                            if (cleanPhone.length === 10) {
                                cleanPhone = `+1${cleanPhone}`;
                            } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
                                cleanPhone = `+${cleanPhone}`;
                            } else if (!user.phone!.startsWith('+')) {
                                cleanPhone = `+${cleanPhone}`;
                            } else {
                                cleanPhone = user.phone!;
                            }

                            console.log(`[SMS] Sending cancellation to ${user.name} (${cleanPhone})...`);
                            await twilioClient.messages.create({
                                body: message!,
                                from: twilioPhoneNumber,
                                to: cleanPhone
                            });
                            sentCount++;
                        } catch (err) {
                            const errorMessage = err instanceof Error ? err.message : String(err);
                            console.error(`[SMS] Failed to send cancellation to ${user.name}:`, errorMessage);
                            failCount++;
                        }
                    }));
                } else {
                    console.warn('[SMS] Twilio client not configured. Skipping SMS sending.');
                }
            }
        }

        return NextResponse.json({ success: true, sentCount, failCount, totalRecipients: recipientsCount });
    } catch (error) {
        console.error('Error in DELETE /api/sessions/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// context: { params: { id: string } }
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { date, start_time, end_time, songs } = body;

        // 1. Update Session Details
        const { error: sessionError } = await supabaseAdmin
            .from('sessions')
            .update({
                date,
                start_time,
                end_time
            })
            .eq('id', id);

        if (sessionError) {
            console.error('Error updating session:', sessionError);
            return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }

        // 2. Update Songs (if provided)
        // Strategy: Delete all existing songs for this session and re-insert the new list.
        // This handles additions, removals, and reordering in one go.
        if (songs) {
            // Delete existing songs
            const { error: deleteError } = await supabaseAdmin
                .from('session_songs')
                .delete()
                .eq('session_id', id);

            if (deleteError) {
                console.error('Error deleting old session songs:', deleteError);
                return NextResponse.json({ error: 'Failed to update session songs' }, { status: 500 });
            }

            // Insert new songs
            if (songs.length > 0) {
                const songsToInsert = songs.map((song: { song_name: string; song_url?: string }, index: number) => ({
                    session_id: id,
                    song_name: song.song_name,
                    song_url: song.song_url || null,
                    order: index,
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('session_songs')
                    .insert(songsToInsert);

                if (insertError) {
                    console.error('Error inserting new session songs:', insertError);
                    return NextResponse.json({ error: 'Failed to update session songs' }, { status: 500 });
                }
            }
        }

        // 3. Update Visibility (if provided)
        const { is_public, visible_user_ids } = body;

        if (is_public !== undefined) {
            const { error: updateError } = await supabaseAdmin
                .from('sessions')
                .update({ is_public })
                .eq('id', id);

            if (updateError) console.error('Error updating session visibility flag:', updateError);
        }

        if (visible_user_ids) {
            // Delete existing visibility
            await supabaseAdmin.from('session_visibility').delete().eq('session_id', id);

            // Insert new visibility if not public and user IDs provided
            if (is_public === false && visible_user_ids.length > 0) {
                const inserts = visible_user_ids.map((uid: string) => ({
                    session_id: id,
                    user_id: uid
                }));

                const { error: visError } = await supabaseAdmin
                    .from('session_visibility')
                    .insert(inserts);

                if (visError) console.error('Error updating session visibility:', visError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/sessions/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
