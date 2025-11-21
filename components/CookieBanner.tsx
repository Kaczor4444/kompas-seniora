'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after small delay for smooth entry
      setTimeout(() => setShowBanner(true), 1500);
    }
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
    // Initialize analytics here
    // window.gtag?.('consent', 'update', { 'analytics_storage': 'granted' });
  };

  const enableSelectedCookies = (prefs: typeof preferences) => {
    console.log('🍪 Custom cookies enabled:', prefs);
    // Initialize selected cookies
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
            onClick={handleRejectAll}
          />

          {/* Cookie Banner */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
          >
            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-white via-white to-emerald-50 rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden">
                
                {/* Decorative top border */}
                <div className="h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500" />
                
                <div className="p-6 sm:p-8">
                  {/* Header with icon */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        🍪 Dbamy o Twoją prywatność
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Używamy plików cookies, aby zapewnić najlepsze doświadczenie. 
                        Cookies niezbędne są zawsze aktywne, ale możesz dostosować pozostałe według swoich preferencji.
                      </p>
                    </div>
                  </div>

                  {/* Details section (expandable) */}
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6 overflow-hidden"
                      >
                        <div className="space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
                          
                          {/* Necessary Cookies */}
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-gray-900">Cookies niezbędne</h4>
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                  Zawsze aktywne
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                Wymagane do podstawowego działania strony (sesja, bezpieczeństwo).
                              </p>
                            </div>
                          </div>

                          {/* Analytics Cookies */}
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <button
                                onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  preferences.analytics
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'bg-white border-gray-300 hover:border-emerald-400'
                                }`}
                              >
                                {preferences.analytics && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">Cookies analityczne</h4>
                              <p className="text-sm text-gray-600">
                                Pomagają nam zrozumieć, jak korzystasz ze strony (anonimowe statystyki).
                              </p>
                            </div>
                          </div>

                          {/* Functional Cookies */}
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <button
                                onClick={() => setPreferences(prev => ({ ...prev, functional: !prev.functional }))}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  preferences.functional
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'bg-white border-gray-300 hover:border-emerald-400'
                                }`}
                              >
                                {preferences.functional && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">Cookies funkcjonalne</h4>
                              <p className="text-sm text-gray-600">
                                Zapamiętują Twoje preferencje (np. ulubione placówki, filtry).
                              </p>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    
                    {/* Primary actions */}
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                      <button
                        onClick={handleAcceptAll}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Akceptuj wszystkie
                      </button>

                      <button
                        onClick={handleRejectAll}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Tylko niezbędne
                      </button>
                    </div>

                    {/* Toggle details / Save preferences */}
                    {!showDetails ? (
                      <button
                        onClick={() => setShowDetails(true)}
                        className="sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Dostosuj
                      </button>
                    ) : (
                      <button
                        onClick={handleSavePreferences}
                        className="sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Zapisz wybór
                      </button>
                    )}
                  </div>

                  {/* Footer link */}
                  <div className="mt-4 text-center">
                    <Link 
                      href="/polityka-cookies" 
                      className="text-sm text-gray-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Dowiedz się więcej o cookies
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}