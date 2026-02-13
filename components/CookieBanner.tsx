'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    functional: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1500);
    }

    const handleReopenBanner = () => {
      setShowBanner(true);
      setShowDetails(false);
      const currentConsent = localStorage.getItem('cookie-consent');
      if (currentConsent) {
        try {
          const parsed = JSON.parse(currentConsent);
          setPreferences({
            necessary: true,
            analytics: parsed.analytics || false,
            functional: parsed.functional || false,
          });
        } catch (e) {
          // Invalid JSON, reset
        }
      }
    };

    window.addEventListener('reopenCookieBanner', handleReopenBanner);
    return () => window.removeEventListener('reopenCookieBanner', handleReopenBanner);
  }, []);

  const handleAcceptAll = () => {
    const allConsent = {
      necessary: true,
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(allConsent));
    setShowBanner(false);
    enableAllCookies();
  };

  const handleRejectAll = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      functional: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(necessaryOnly));
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    const customConsent = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(customConsent));
    setShowBanner(false);
    
    if (preferences.analytics || preferences.functional) {
      enableSelectedCookies(preferences);
    }
  };

  const enableAllCookies = () => {
    console.log('🍪 All cookies enabled');
    // Google Analytics will be enabled here
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  };

  const enableSelectedCookies = (prefs: typeof preferences) => {
    console.log('🍪 Custom cookies enabled:', prefs);
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied'
      });
    }
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Lighter backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 z-[9998]"
            onClick={handleRejectAll}
          />

          {/* Compact Banner */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[10000] max-h-[calc(100vh-7rem)] sm:max-h-[calc(100vh-8rem)]"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-h-full overflow-y-auto">
              
              <div className="p-5">
                {/* Compact header with close button */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-2xl">🍪</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Ta strona używa plików cookies
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Dzięki nim strona działa lepiej. Możesz je zaakceptować, zmienić lub odrzucić.
                    </p>
                  </div>
                  {/* Close button (X) */}
                  <button
                    onClick={handleRejectAll}
                    className="text-gray-400 hover:text-gray-600 transition -mt-1 -mr-1"
                    aria-label="Zamknij (odrzuć cookies)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Expandable details */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="space-y-3 bg-gray-50 rounded-lg p-4 text-sm">
                        
                        {/* Necessary */}
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-emerald-500 rounded-sm mt-0.5 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Niezbędne</div>
                            <div className="text-xs text-gray-500">Potrzebne do działania strony</div>
                          </div>
                          <span className="text-xs text-emerald-600 font-medium">Aktywne</span>
                        </div>

                        {/* Analytics */}
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                              preferences.analytics
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {preferences.analytics && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Analityczne</div>
                            <div className="text-xs text-gray-500">Pomagają nam ulepszyć stronę</div>
                          </div>
                        </div>

                        {/* Functional */}
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setPreferences(prev => ({ ...prev, functional: !prev.functional }))}
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                              preferences.functional
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {preferences.functional && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">Funkcjonalne</div>
                            <div className="text-xs text-gray-500">Zapamiętują Twoje wybory</div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions - 3 buttons: Accept | Change | Reject */}
                <div className="space-y-2">
                  {!showDetails ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleAcceptAll}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold px-4 py-3.5 rounded-xl transition min-h-[48px]"
                      >
                        Akceptuj
                      </button>
                      <button
                        onClick={() => setShowDetails(true)}
                        className="flex-1 bg-slate-600 hover:bg-slate-700 text-white text-base font-semibold px-4 py-3.5 rounded-xl transition min-h-[48px]"
                      >
                        Zmień
                      </button>
                      <button
                        onClick={handleRejectAll}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold px-4 py-3.5 rounded-xl transition min-h-[48px]"
                      >
                        Odrzuć
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePreferences}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold px-4 py-3.5 rounded-xl transition min-h-[48px]"
                      >
                        Zapisz wybór
                      </button>
                      <button
                        onClick={() => setShowDetails(false)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold px-4 py-3.5 rounded-xl transition min-h-[48px]"
                      >
                        Anuluj
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer link */}
                <div className="mt-3 text-center">
                  <Link 
                    href="/polityka-cookies" 
                    className="text-xs text-gray-500 hover:text-gray-700 transition inline-flex items-center gap-1"
                  >
                    Polityka Cookies
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export helper function
export const reopenCookieBanner = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('reopenCookieBanner'));
  }
};