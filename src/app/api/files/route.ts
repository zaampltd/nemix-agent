import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { getFiles, saveFile, addActivity } from '@/lib/db';

// GET: Retrieve file metadata OR retrieve actual file content from disk
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (filePath) {
      if (!existsSync(filePath)) {
        return NextResponse.json({ error: 'File does not exist on disk' }, { status: 404 });
      }
      try {
        const content = readFileSync(filePath, 'utf-8');
        return NextResponse.json({ success: true, content });
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to read file from disk: ${err.message}` }, { status: 500 });
      }
    }

    const files = getFiles();
    return NextResponse.json({ success: true, files });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to retrieve files' }, { status: 500 });
  }
}

// POST: Save a new file to the local filesystem and register it in database
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, content, createdBy } = body;

    if (!name || content === undefined || !createdBy) {
      return NextResponse.json({ error: 'name, content, and createdBy are required' }, { status: 400 });
    }

    // Save actual file on local disk and record in registry
    const registryItem = saveFile(name, content, createdBy);

    addActivity('agent', `Created local workspace file: "${name}" at: ${registryItem.path}`, createdBy);

    return NextResponse.json({ 
      success: true, 
      file: registryItem,
      message: `File saved successfully to local workspace: ${registryItem.path}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save file' }, { status: 500 });
  }
}
