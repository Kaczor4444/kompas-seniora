import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { logSecurityEvent, checkRateLimit } from '@/lib/admin-security';
import { signCookie } from '@/lib/adminAuth';

// Hash password with HMAC-SHA256 so both sides are always 32 bytes.
// This prevents the timing side-channel where checking `password.length === correctPassword.length`
// before timingSafeEqual leaks the correct password length via response time differences.
function hashForComparison(value: string): Buffer {
  return createHmac('sha256', 'login-comparison').update(value).digest();
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const ipAddress = request.headers.get('x-real-ip') ||
                      request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    const { isBlocked, attempts } = await checkRateLimit(ipAddress);

    if (isBlocked) {
      await logSecurityEvent({
        eventType: 'rate_limit',
        ipAddress,
        userAgent,
        metadata: { attempts },
      });
      return NextResponse.json(
        { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
        { status: 429 }
      );
    }

    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      console.error('ADMIN_PASSWORD not set in environment variables');
      return NextResponse.json({ error: 'Błąd konfiguracji serwera' }, { status: 500 });
    }

    // Always hash both values to 32 bytes, then compare with timingSafeEqual.
    // Previous pattern (length check + timingSafeEqual) leaked password length via timing.
    const passwordMatch = typeof password === 'string' &&
      timingSafeEqual(hashForComparison(password), hashForComparison(correctPassword));

    if (!passwordMatch) {
      await logSecurityEvent({
        eventType: 'login_failed',
        ipAddress,
        userAgent,
        metadata: { attempts: attempts + 1 },
      });
      return NextResponse.json({ error: 'Nieprawidłowe hasło' }, { status: 401 });
    }

    await logSecurityEvent({ eventType: 'login_success', ipAddress, userAgent });

    const cookieStore = await cookies();
    cookieStore.set('admin-auth', signCookie('true'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
