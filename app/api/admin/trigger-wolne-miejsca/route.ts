import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidAdminCookie } from '@/lib/adminAuth';

const REPO = 'Kaczor4444/kompas-seniora';
const WORKFLOW_FILE = 'wolne-miejsca-monitor.yml';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!isValidAdminCookie(cookieStore.get('admin-auth')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return NextResponse.json({ error: 'Brak GITHUB_PAT w zmiennych środowiskowych' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const force = body.force === true;

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { force: String(force) },
      }),
    }
  );

  if (res.status === 204) {
    return NextResponse.json({ ok: true, message: 'Workflow uruchomiony' });
  }

  const text = await res.text();
  return NextResponse.json({ error: `GitHub API: ${res.status}`, detail: text }, { status: 500 });
}
