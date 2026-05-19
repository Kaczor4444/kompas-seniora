import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidAdminCookie } from '@/lib/adminAuth';

const REPO = 'Kaczor4444/kompas-seniora';
const WORKFLOWS = [
  'dps-pdf-monitor.yml',
  'wolne-miejsca-monitor.yml',
  'senior-plus-monitor.yml',
  'mddps-krakow-monitor.yml',
  'slaskie-dps-monitor.yml',
  'slaskie-mops-monitor.yml',
  'gus-bdl-monitor.yml',
  'gus-emerytury-monitor.yml',
];

export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminCookie(cookieStore.get('admin-auth')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return NextResponse.json({ error: 'Brak GITHUB_PAT' }, { status: 500 });
  }

  const results = await Promise.all(
    WORKFLOWS.map(async (wf) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/actions/workflows/${wf}/runs?per_page=1`,
          {
            headers: {
              Authorization: `Bearer ${pat}`,
              Accept: 'application/vnd.github+json',
            },
            next: { revalidate: 60 },
          }
        );
        if (!res.ok) return { workflow: wf, status: null };
        const data = await res.json();
        const run = data.workflow_runs?.[0];
        return {
          workflow: wf,
          status: run?.status ?? null,        // queued | in_progress | completed
          conclusion: run?.conclusion ?? null, // success | failure | cancelled | null
          runAt: run?.updated_at ?? null,
          runUrl: run?.html_url ?? null,
        };
      } catch {
        return { workflow: wf, status: null };
      }
    })
  );

  return NextResponse.json(results);
}
