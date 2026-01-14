import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

// Helper to format filename to Capability Name
// e.g., "acoustic-guitar.png" -> "Acoustic Guitar"
// "electric_guitar.svg" -> "Electric Guitar"
const formatName = (filename: string): string => {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    return nameWithoutExt
        .replace(/[-_]/g, ' ') // Replace separators with space
        .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
};

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const iconsDirectory = path.join(process.cwd(), 'public/icons');
        if (!fs.existsSync(iconsDirectory)) {
            return NextResponse.json({ message: 'No icons directory found', added: 0 });
        }

        const files = fs.readdirSync(iconsDirectory);
        const iconFiles = files.filter(file =>
            file.toLowerCase().endsWith('.png') ||
            file.toLowerCase().endsWith('.svg') ||
            file.toLowerCase().endsWith('.webp')
        );

        let addedCount = 0;
        let updatedCount = 0;

        for (const file of iconFiles) {
            const name = formatName(file);
            const iconPath = `/icons/${file}`;

            // Check if capability exists by name
            const { data: existing } = await supabaseAdmin
                .from('capabilities')
                .select('id, icon')
                .ilike('name', name) // Case-insensitive match
                .single();

            if (!existing) {
                // Insert new
                const { error } = await supabaseAdmin
                    .from('capabilities')
                    .insert({ name: name, icon: iconPath });

                if (!error) addedCount++;
                else console.error(`Failed to insert ${name}:`, error);
            } else if (existing.icon !== iconPath) {
                // Update existing if path implies a meaningful change (or just to be safe)
                const { error } = await supabaseAdmin
                    .from('capabilities')
                    .update({ icon: iconPath })
                    .eq('id', existing.id);

                if (!error) updatedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync complete. Added: ${addedCount}, Updated: ${updatedCount}`,
            added: addedCount,
            updated: updatedCount
        });

    } catch (error) {
        console.error('Error syncing capabilities:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
