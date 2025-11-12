import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logSecurityEvent, checkRateLimit } from '@/lib/admin-security';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
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

    if (password !== correctPassword) {
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