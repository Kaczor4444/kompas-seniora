import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if accessing admin panel
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Check if admin is enabled (default: false for security)
    const adminEnabled = process.env.ADMIN_ENABLED === 'true';
    
    if (!adminEnabled) {
      // Return 404 (looks like page doesn't exist)
      return new NextResponse(null, { status: 404 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
