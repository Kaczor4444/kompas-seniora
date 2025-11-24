'use client'

import Script from 'next/script'

/**
 * Google Analytics Component
 * 
 * Bezpiecznie ładuje Google Analytics tylko gdy NEXT_PUBLIC_GA_MEASUREMENT_ID jest ustawiony.
 * Jeśli brak ID - komponent nie renderuje nic i NIE powoduje błędów.
 * 
 * Setup:
 * 1. Zdobądź GA4 Measurement ID (format: G-XXXXXXXXXX)
 * 2. Dodaj do .env.local: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 * 3. Dodaj na Vercel: Settings → Environment Variables → NEXT_PUBLIC_GA_MEASUREMENT_ID
 */
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  // SAFETY CHECK: Jeśli nie ma ID, nie renderuj nic (brak błędu!)
  if (!gaId || gaId === '' || gaId === 'undefined') {
    // W development mode pokaż info w console
    if (process.env.NODE_ENV === 'development') {
      console.info('ℹ️ Google Analytics: NEXT_PUBLIC_GA_MEASUREMENT_ID not set. Analytics disabled.')
    }
    return null
  }

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}