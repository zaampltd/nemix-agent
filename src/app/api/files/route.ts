import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { getFiles, saveFile, addActivity } from '@/lib/db';

// GET: Retrieve file metadata OR retrieve actual file content from disk OR download file
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const download = searchParams.get('download') === 'true';

    if (filePath) {
      if (!existsSync(filePath)) {
        return NextResponse.json({ error: 'File does not exist on disk' }, { status: 404 });
      }
      
      const fileName = path.basename(filePath);
      
      if (download) {
        const fileBuffer = readFileSync(filePath);
        const ext = fileName.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === 'docx') {
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (ext === 'pdf') {
          contentType = 'application/pdf';
        } else if (ext === 'xlsx') {
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }
        
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          }
        });
      }
      
      try {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const isBinary = ['pdf', 'docx', 'xlsx', 'xls'].includes(ext || '');
        
        if (isBinary) {
          const extractedPath = filePath + '_extracted.txt';
          const siblingPath = filePath.replace(/\.[a-z0-9]+$/i, '_extracted.txt');
          
          let content = '';
          if (existsSync(extractedPath)) {
            content = readFileSync(extractedPath, 'utf-8');
          } else if (existsSync(siblingPath)) {
            content = readFileSync(siblingPath, 'utf-8');
          } else {
            content = `# Word Document: ${fileName}\n\nThis is a binary Word (.docx) document.\n\nClick the "Download File" button in the file explorer to download and open it in Microsoft Word!`;
          }
          return NextResponse.json({ success: true, content });
        }
        
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
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const createdBy = formData.get('createdBy') as string || 'user';
      const projectId = formData.get('projectId') as string || undefined;
      
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const name = file.name;
      
      const registryItem = saveFile(name, buffer, createdBy, projectId);
      addActivity('system', `Uploaded workspace file: "${name}" at: ${registryItem.path}`, createdBy);
      
      return NextResponse.json({ 
        success: true, 
        file: registryItem,
        message: `File uploaded successfully to local workspace: ${registryItem.path}`
      });
    }

    const body = await request.json();
    const { name, content, createdBy, projectId } = body;

    if (!name || content === undefined || !createdBy) {
      return NextResponse.json({ error: 'name, content, and createdBy are required' }, { status: 400 });
    }

    // Save actual file on local disk and record in registry
    const registryItem = saveFile(name, content, createdBy, projectId);

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
