
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const avatarsDir = path.join(process.cwd(), 'public', 'avatars');

        if (!fs.existsSync(avatarsDir)) {
            return NextResponse.json({}, { status: 200 });
        }

        const categories = fs.readdirSync(avatarsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const avatarMap: Record<string, string[]> = {};

        categories.forEach(category => {
            const categoryPath = path.join(avatarsDir, category);
            const files = fs.readdirSync(categoryPath)
                .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));

            if (files.length > 0) {
                avatarMap[category] = files.map(file => `/avatars/${category}/${file}`);
            }
        });

        return NextResponse.json(avatarMap);
    } catch (error) {
        console.error('Error loading avatars:', error);
        return NextResponse.json({ error: 'Failed to load avatars' }, { status: 500 });
    }
}
