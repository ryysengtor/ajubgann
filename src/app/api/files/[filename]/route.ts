import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'uploads');
const LEGACY_DIR = path.join(process.cwd(), 'public', 'uploads');

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

async function tryReadFile(dir: string, filename: string): Promise<{ buffer: Buffer; size: number } | null> {
  const filepath = path.join(dir, filename);
  try {
    const fileStat = await stat(filepath);
    if (!fileStat.isFile()) return null;
    const buffer = await readFile(filepath);
    return { buffer, size: fileStat.size };
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    // Try new storage directory first, then fall back to legacy directory
    const result = await tryReadFile(STORAGE_DIR, filename) || await tryReadFile(LEGACY_DIR, filename);

    if (!result) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(result.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('File serve error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
