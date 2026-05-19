import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidAdminCookie } from '@/lib/adminAuth';

const REPO = 'Kaczor4444/kompas-seniora';
const ALLOWED_WORKFLOWS = [
  'dps-pdf-monitor.yml',
  'wolne-miejsca-monitor.yml',
  'senior-plus-monitor.yml',
  'mddps-krakow-monitor.yml',
  'slaskie-dps-monitor.yml',
  'slaskie-mops-monitor.yml',
  'gus-bdl-monitor.yml',
  'gus-emerytury-monitor.yml',
];

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidAdminCookie(cookieStore.get('admin-auth')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return NextResponse.json({ error: 'Brak GITHUB_PAT w env' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const { workflow, force = false } = body as { workflow: string; force?: boolean };

  if (!workflow || !ALLOWED_WORKFLOWS.includes(workflow)) {
    return NextResponse.json({ error: 'Nieznany workflow' }, { status: 400 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs: { force: String(force) } }),
    }
  );

  if (res.status === 204) {
    return NextResponse.json({ ok: true, workflow });
  }
  const text = await res.text();
  return NextResponse.json({ error: `GitHub ${res.status}`, detail: text }, { status: 500 });
}
