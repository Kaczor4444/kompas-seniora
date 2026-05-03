import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    // nonce replaces 'unsafe-inline'; 'strict-dynamic' trusts scripts loaded by nonced scripts
    // 'self' kept as fallback for older browsers that ignore 'strict-dynamic'
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // style-src: 'unsafe-inline' required by Leaflet + Framer Motion (accepted risk, TODO #2)
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://cdnjs.cloudflare.com https://raw.githubusercontent.com https://*.tile.openstreetmap.org",
    "connect-src 'self' https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org",
    "font-src 'self' data:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ');
}

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

  // 1. ADMIN PANEL PROTECTION
  if (pathname.startsWith('/admin')) {
    const adminEnabled = process.env.ADMIN_ENABLED === 'true';
    if (!adminEnabled) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // 2. CSP NONCE - unique per request, passed to Server Components via x-nonce header
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // 3. BOT TRACKING - skip for static files and API routes
  if (
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/static') &&
    !pathname.startsWith('/images') &&
    !pathname.startsWith('/api/analytics') &&
    !pathname.startsWith('/api/admin')
  ) {
    const isAIBot = AI_BOT_PATTERNS.some(pattern =>
      userAgent.toLowerCase().includes(pattern.toLowerCase())
    );
    const isSearchBot = SEARCH_ENGINE_PATTERNS.some(pattern =>
      userAgent.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isAIBot || isSearchBot) {
      const botType = isAIBot ? 'ai_bot' : 'search_bot';
      const detectedBot = [...AI_BOT_PATTERNS, ...SEARCH_ENGINE_PATTERNS].find(pattern =>
        userAgent.toLowerCase().includes(pattern.toLowerCase())
      ) || 'unknown';

      // Walidacja hosta przed self-fetch — chroni przed Host header injection
      const allowedHosts = (process.env.NEXT_PUBLIC_APP_URL
        ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
        : ['kompaseniora.pl', 'www.kompaseniora.pl', 'localhost:3000']);
      const requestHost = request.headers.get('host') || '';
      if (allowedHosts.includes(requestHost)) {
        fetch(`${request.nextUrl.origin}/api/analytics/bot-track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botType,
            botName: detectedBot,
            userAgent,
            path: pathname,
            referer: request.headers.get('referer')?.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 500) || undefined,
          }),
        }).catch(() => {});
      }
    }
  }

  // 4. Forward nonce to Server Components + set CSP header on response
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce));
  return response;
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
