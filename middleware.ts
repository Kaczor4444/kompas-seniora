import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// AI crawler User-Agent patterns
const AI_BOT_PATTERNS = [
  // OpenAI
  'ChatGPT',
  'GPTBot',
  'ChatGPT-User',

  // Anthropic
  'Claude',
  'claude-web',
  'anthropic-ai',

  // Google AI
  'Google-Extended',
  'Bard',
  'GoogleOther',

  // Perplexity
  'Perplexity',
  'PerplexityBot',

  // Other AI services
  'Bytespider', // ByteDance (TikTok)
  'CCBot', // Common Crawl
  'cohere-ai',
  'YouBot', // You.com
  'Applebot-Extended', // Apple AI

  // Meta
  'facebookexternalhit',
  'meta-externalagent',
];

// Regular search engine bots (for comparison)
const SEARCH_ENGINE_PATTERNS = [
  'Googlebot',
  'bingbot',
  'Slurp', // Yahoo
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
];

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;

  // 1. ADMIN PANEL PROTECTION - Check if admin is enabled
  if (pathname.startsWith('/admin')) {
    const adminEnabled = process.env.ADMIN_ENABLED === 'true';
    if (!adminEnabled) {
      // Return 404 (looks like page doesn't exist)
      return new NextResponse(null, { status: 404 });
    }
  }

  // 2. BOT TRACKING - Skip for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/api/analytics') || // Skip to avoid logging our own tracking
    pathname.startsWith('/api/admin')
  ) {
    return NextResponse.next();
  }

  // Detect bot type
  const isAIBot = AI_BOT_PATTERNS.some(pattern =>
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );

  const isSearchBot = SEARCH_ENGINE_PATTERNS.some(pattern =>
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );

  // Log AI bot visit asynchronously (fire and forget)
  if (isAIBot || isSearchBot) {
    const botType = isAIBot ? 'ai_bot' : 'search_bot';
    const detectedBot = [...AI_BOT_PATTERNS, ...SEARCH_ENGINE_PATTERNS].find(pattern =>
      userAgent.toLowerCase().includes(pattern.toLowerCase())
    ) || 'unknown';

    // Fire and forget - don't await to avoid slowing down the request
    fetch(`${request.nextUrl.origin}/api/analytics/bot-track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botType,
        botName: detectedBot,
        userAgent,
        path: pathname,
        referer: request.headers.get('referer') || undefined,
      }),
    }).catch(err => {
      console.error('Failed to track bot visit:', err);
    });
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
