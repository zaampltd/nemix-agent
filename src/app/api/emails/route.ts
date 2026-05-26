import { NextResponse } from 'next/server';
import { getEmails, saveEmail, updateEmailStatus, addActivity } from '@/lib/db';

// GET: Retrieve all emails
export async function GET() {
  try {
    const emails = getEmails();
    return NextResponse.json({ success: true, emails });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to retrieve emails' }, { status: 500 });
  }
}

// POST: Create a new email draft or send directly
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to, subject, body: emailBody, status, id } = body;

    if (!from || !to || !subject || !emailBody) {
      return NextResponse.json({ error: 'from, to, subject, and body are required' }, { status: 400 });
    }

    const emailItem = {
      from,
      to,
      subject,
      body: emailBody,
      status: status || 'draft',
      id
    };

    const saved = saveEmail(emailItem);
    
    // Log the event
    if (saved.status === 'draft') {
      addActivity('agent', `Created an email draft: "${subject}" to ${to}.`);
    } else if (saved.status === 'sent') {
      addActivity('agent', `Sent email: "${subject}" to ${to}.`);
    }

    return NextResponse.json({ success: true, email: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save email' }, { status: 500 });
  }
}

// PATCH: Update email status (e.g. draft -> sent, draft -> cancelled)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    if (status !== 'draft' && status !== 'sent' && status !== 'cancelled') {
      return NextResponse.json({ error: 'invalid status value' }, { status: 400 });
    }

    const updated = updateEmailStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Email draft not found' }, { status: 404 });
    }

    addActivity('system', `Email "${updated.subject}" status updated to ${status}.`);

    return NextResponse.json({ success: true, email: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update email status' }, { status: 500 });
  }
}
