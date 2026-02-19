'use client';

import { useState, useEffect } from 'react';

export default function FloatingCookieButton() {
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true (can't be disabled)
    analytics: false,
    marketing: false,
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cookie-preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(prev => ({
          ...prev,
          ...parsed,
          necessary: true, // Always keep necessary as true
        }));
      }
    } catch (e) {
      console.error('Failed to load cookie preferences', e);
    }
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    if (showModal) {
      window.addEventListener('keydown', handleEscKey);
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal]);

  // Open modal via custom event (e.g. from cookie policy page)
  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener('open-cookie-settings', handler);
    return () => window.removeEventListener('open-cookie-settings', handler);
  }, []);

  // Focus trap - keep focus inside modal
  useEffect(() => {
    if (!showModal) return;

    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modal = document.querySelector('[role="dialog"]');
    
    if (!modal) return;

    const focusableContent = modal.querySelectorAll(focusableElements);
    const firstFocusable = focusableContent[0] as HTMLElement;
    const lastFocusable = focusableContent[focusableContent.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey as EventListener);
    firstFocusable?.focus();

    return () => {
      modal.removeEventListener('keydown', handleTabKey as EventListener);
    };
  }, [showModal]);

  // Block body scroll when modal is open (position fixed method for flex containers)
  useEffect(() => {
    if (showModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
    };
  }, [showModal]);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  const handleToggle = (key: 'analytics' | 'marketing') => {
    setPreferences(p => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = () => {
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
    window.dispatchEvent(new CustomEvent('cookie-preferences-updated', {
      detail: preferences
    }));
    closeModal();
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookie-preferences', JSON.stringify(allAccepted));
    window.dispatchEvent(new CustomEvent('cookie-preferences-updated', {
      detail: allAccepted
    }));
    closeModal();
  };

  const handleRejectOptional = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyNecessary);
    localStorage.setItem('cookie-preferences', JSON.stringify(onlyNecessary));
    window.dispatchEvent(new CustomEvent('cookie-preferences-updated', {
      detail: onlyNecessary
    }));
    closeModal();
  };

  return (
    <>
      {/* Modal with smooth animations */}
      {showModal && (
        <div
          className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/30 backdrop-blur-sm ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
            <div className="max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 id="cookie-settings-title" className="text-2xl font-bold text-gray-900">
                  Ustawienia cookies
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Zamknij"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-6">
                <div>
                  <p className="text-gray-600 mb-2">
                    Używamy plików cookies, aby poprawić Twoje doświadczenia. Możesz wybrać, które kategorie cookies chcesz zaakceptować.
                  </p>
                  <p className="text-xs text-gray-500">
                    Nie używamy cookies do sprzedaży Twoich danych osobom trzecim.
                  </p>
                </div>

                {/* Necessary Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Niezbędne cookies</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Zawsze aktywne
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pliki cookies niezbędne do działania strony. Nie można ich wyłączyć.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Cookies analityczne</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => handleToggle('analytics')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pomagają nam zrozumieć, jak odwiedzający korzystają ze strony (Google Analytics).
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Cookies marketingowe</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={() => handleToggle('marketing')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Używane do śledzenia odwiedzających w różnych witrynach w celu wyświetlania reklam.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRejectOptional}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Odrzuć opcjonalne
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
                >
                  Zapisz wybrane
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                >
                  Akceptuj wszystkie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes scaleIn {
          from { 
            transform: scale(0.95);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes scaleOut {
          from { 
            transform: scale(1);
            opacity: 1;
          }
          to { 
            transform: scale(0.95);
            opacity: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-fadeOut {
          animation: fadeOut 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }

        .animate-scaleOut {
          animation: scaleOut 0.2s ease-out;
        }
      `}</style>
    </>
  );
}