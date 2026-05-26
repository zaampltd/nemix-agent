import { NextResponse } from 'next/server';
import { 
  getChatSessions, 
  getChatMessages, 
  createChatSession, 
  deleteChatSession 
} from '@/lib/db';

// GET: List all sessions OR get messages of a single session
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const messages = getChatMessages(id);
      return NextResponse.json({ success: true, messages });
    }

    const sessions = getChatSessions();
    return NextResponse.json({ success: true, sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to retrieve session data' }, { status: 500 });
  }
}

// POST: Create a new chat session
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = body.title?.trim() || 'New Workspace';
    
    const newSession = createChatSession(title);
    return NextResponse.json({ success: true, session: newSession });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create session' }, { status: 500 });
  }
}

// DELETE: Remove a chat session
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    deleteChatSession(id);
    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete session' }, { status: 500 });
  }
}
