import { NextResponse } from 'next/server';
import { getActivity } from '@/lib/db';

export async function GET() {
  try {
    const activity = getActivity();
    return NextResponse.json({ success: true, activity });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to retrieve activity feed' }, { status: 500 });
  }
}
