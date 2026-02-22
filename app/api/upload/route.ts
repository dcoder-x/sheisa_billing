import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import StorageService from '@/lib/storage/storage.service';

export async function POST(request: NextRequest) {
    const session = await getSession();
    // Allow upload for registration (no session yet) or authenticated users
    // If strict auth is needed, uncomment next lines. For registration logo, likely public or temporary.
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Create unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Define path (e.g., logos/filename.png)
        const path = `logos/${filename}`;

        const result = await StorageService.upload(buffer, path, {
            contentType: file.type,
            isPublic: true,
            userId: session?.userId // Optional: track who uploaded
        });

        return NextResponse.json({ url: result.url });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
