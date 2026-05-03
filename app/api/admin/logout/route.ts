import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logSecurityEvent } from '@/lib/admin-security';

export async function POST(request: NextRequest) {
  const ipAddress =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;

  await logSecurityEvent({
    eventType: 'logout',
    ipAddress,
    userAgent,
  });

  const cookieStore = await cookies();
  cookieStore.delete({ name: 'admin-auth', path: '/' });

  return NextResponse.redirect(new URL('/admin/login', request.url));
}
