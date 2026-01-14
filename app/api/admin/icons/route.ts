import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const iconsDirectory = path.join(process.cwd(), 'public/icons');

        // Check if directory exists
        if (!fs.existsSync(iconsDirectory)) {
            return NextResponse.json([]);
        }

        const files = fs.readdirSync(iconsDirectory);

        // Filter for images
        const iconFiles = files.filter(file =>
            file.toLowerCase().endsWith('.png') ||
            file.toLowerCase().endsWith('.svg') ||
            file.toLowerCase().endsWith('.webp')
        );

        // Map to public URLs
        const icons = iconFiles.map(file => ({
            name: file,
            path: `/icons/${file}`
        }));

        return NextResponse.json(icons);
    } catch (error) {
        console.error('Error reading icons directory:', error);
        return NextResponse.json({ error: 'Failed to list icons' }, { status: 500 });
    }
}
