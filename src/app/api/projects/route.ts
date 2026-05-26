import { NextResponse } from 'next/server';
import { getProjects, createProject, addActivity } from '@/lib/db';

export async function GET() {
  try {
    const projects = getProjects();
    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to retrieve projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    const project = createProject(name, description || '');
    addActivity('system', `Created new project workspace: "${name}"`);
    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create project' }, { status: 500 });
  }
}
