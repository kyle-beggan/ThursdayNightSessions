import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
    console.log('[API] /songs/lookup called');

    if (!process.env.OPENAI_API_KEY) {
        console.error('[API] Error: OPENAI_API_KEY is missing');
        return NextResponse.json({ error: 'Server configuration error: Missing OpenAI API Key' }, { status: 500 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const title = searchParams.get('title');
        const artist = searchParams.get('artist') || '';

        if (!title) {
            return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
        }

        const prompt = `
            Find the musical key, tempo (BPM), and direct official YouTube audio/video link (or YouTube search query link) for the song "${title}" ${artist ? `by "${artist}"` : ''}.
            Format your response ONLY as a valid JSON object. Do not include any markdown formatting, backticks, or code blocks.
            The JSON object must have exactly these keys:
            - key: string (e.g. "Am", "G Major", "C# Minor", "C")
            - tempo: string (e.g. "120 BPM", "95 BPM")
            - youtube_url: string (the official youtube URL if known with high confidence, otherwise a search query link like "https://www.youtube.com/results?search_query=${encodeURIComponent((title + ' ' + artist).trim())}")
        `;

        console.log('[API] Sending song lookup prompt to OpenAI...');
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
        });

        const content = completion.choices[0].message.content;
        console.log('[API] OpenAI response received:', content);

        if (!content) {
            return NextResponse.json({ error: 'Failed to lookup song details' }, { status: 500 });
        }

        // Clean up potential markdown code block artifacts
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const result = JSON.parse(jsonString);
            return NextResponse.json(result);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Content:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('Error in GET /api/songs/lookup:', error);

        const err = error as { status?: number; message?: string };

        // Handle OpenAI Quota Exceeded
        if (err?.status === 429) {
            return NextResponse.json(
                { error: "This feature costs actual money. Need to add credits to OpenAI account for this to work." },
                { status: 429 }
            );
        }

        return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
    }
}
