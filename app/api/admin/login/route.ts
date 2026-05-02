import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'crypto';
import { logSecurityEvent, checkRateLimit } from '@/lib/admin-security';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Use x-real-ip first — it's set by trusted proxy and cannot be spoofed by client
    // x-forwarded-for is client-controlled and must not be used for rate limiting
    const ipAddress = request.headers.get('x-real-ip') ||
                      request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Check rate limit
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

    // Check password
    const correctPassword = process.env.ADMIN_PASSWORD;
    
    if (!correctPassword) {
      console.error('ADMIN_PASSWORD not set in environment variables');
      return NextResponse.json(
        { error: 'Błąd konfiguracji serwera' },
        { status: 500 }
      );
    }

    // Timing-safe comparison prevents timing attacks (measuring char-by-char match time)
    const passwordMatch = password &&
      password.length === correctPassword.length &&
      timingSafeEqual(Buffer.from(password), Buffer.from(correctPassword))

    if (!passwordMatch) {
      // Log failed attempt
      await logSecurityEvent({
        eventType: 'login_failed',
        ipAddress,
        userAgent,
        metadata: { 
          passwordLength: password?.length || 0,
          attempts: attempts + 1,
        },
      });
      
      return NextResponse.json(
        { error: 'Nieprawidłowe hasło' },
        { status: 401 }
      );
    }

    // Success! Set cookie
    await logSecurityEvent({
      eventType: 'login_success',
      ipAddress,
      userAgent,
    });

    const cookieStore = await cookies();
    cookieStore.set('admin-auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}