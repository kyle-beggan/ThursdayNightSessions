import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    console.log('[API] /songs/recommend called');

    if (!process.env.OPENAI_API_KEY) {
        console.error('[API] Error: OPENAI_API_KEY is missing');
        return NextResponse.json({ error: 'Server configuration error: Missing OpenAI API Key (Did you restart the server?)' }, { status: 500 });
    }

    try {
        const body = await request.json();
        console.log('[API] Request body:', body);
        const { capabilities } = body;

        if (!capabilities || !Array.isArray(capabilities) || capabilities.length === 0) {
            return NextResponse.json({ error: 'No capabilities provided' }, { status: 400 });
        }

        const prompt = `
            Recommend 5 popular songs that feature prominently the following instruments/capabilities: ${capabilities.join(', ')}.
            The songs should be well-known and suitable for a jam session.
            
            Return the response ONLY as a valid JSON array of objects. Do not include any markdown formatting or code blocks.
            Each object should have the following properties:
            - title: string
            - artist: string
            - key: string (e.g. "Am", "G Major")
            - tempo: string (e.g. "120 BPM")
            - youtubeUrl: string (a valid search URL like "https://www.youtube.com/results?search_query=song+title+artist")
        `;

        console.log('[API] Sending prompt to OpenAI...');
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
        });

        const content = completion.choices[0].message.content;
        console.log('[API] OpenAI URL response received (length):', content?.length);

        if (!content) {
            return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
        }

        // Clean up potential markdown code block artifacts if GPT adds them despite instruction
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const recommendations = JSON.parse(jsonString);
            return NextResponse.json(recommendations);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Content:', content);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('Error in POST /api/songs/recommend:', error);

        const err = error as { status?: number; message?: string };

        // Handle OpenAI Quota Exceeded
        if (err?.status === 429) {
            return NextResponse.json(
                { error: "This feature costs actual money. Need to add credits to OpenAI account for this to work." },
                { status: 429 }
            );
        }

        // Return the actual error message for clearer debugging
        return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
    }
}
