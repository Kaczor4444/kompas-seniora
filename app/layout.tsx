import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "./leaflet-overrides.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import FloatingCookieButton from "@/components/FloatingCookieButton";
import BackToTop from "@/components/ui/BackToTop";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kompas Seniora - Wyszukiwarka placówek opieki dla seniorów",
  description: "Znajdź publiczne placówki opieki dla seniorów (DPS, ŚDS) w swojej okolicy. Przejrzyste ceny z oficjalnych źródeł MOPS.",
  keywords: "dom opieki, senior, DPS, ŚDS, opieka nad seniorem, MOPS, Kraków, Małopolska",
  authors: [{ name: "Kompas Seniora" }],
  openGraph: {
    title: "Kompas Seniora - Wyszukiwarka placówek opieki",
    description: "Znajdź publiczne placówki opieki dla seniorów w swojej okolicy",
    type: "website",
    locale: "pl_PL",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        {/* Preconnect dla lepszej wydajności */}
        <link rel="preconnect" href="https://unpkg.com" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        
        {/* Viewport dla mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#10b981" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {/* Analytics (top - ładuje się jako pierwszy) */}
        <GoogleAnalytics />
        
        {/* Toast notifications */}
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1f2937',
              fontSize: '16px',
              padding: '16px',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        
        {/* Header */}
        <Navbar />
        
        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
        
        {/* Cookie Banner (bottom - ładuje się ostatni) */}
        <CookieBanner />

        {/* Floating Buttons (left: Back to Top, right: Cookie Settings) */}
        <BackToTop />
        <FloatingCookieButton />
      </body>
    </html>
  );
}