import withMDX from '@next/mdx'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin-allow-popups',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    // microphone=(self) required for Web Speech API (SpeechRecognition)
    value: 'camera=(), microphone=(self), geolocation=(self)',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // unsafe-inline required by Next.js 15 runtime + Framer Motion + Leaflet inline styles
      // TODO: migrate to nonce-based CSP via Next.js middleware to remove unsafe-inline
      // unsafe-eval removed (not needed in production builds)
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://cdnjs.cloudflare.com https://raw.githubusercontent.com https://*.tile.openstreetmap.org",
      // nominatim.openstreetmap.org used for geocoding in search
      "connect-src 'self' https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org",
      "font-src 'self' data:",
      // media-src self needed for Web Speech API (SpeechSynthesis TTS)
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  typescript: {
    // Wyłącz type checking podczas production build
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/poradniki/finanse-i-swiadczenia/:slug',
        destination: '/poradniki/finanse-prawne/:slug',
        permanent: true,
      },
      {
        source: '/poradniki/prawne-aspekty/:slug',
        destination: '/poradniki/finanse-prawne/:slug',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    mdxRs: true,
  },
};

export default withMDX()(nextConfig);
