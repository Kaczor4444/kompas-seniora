'use client';

import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';

const NEWSLETTER_WEBHOOK_URL = '';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast.error('Podaj prawidłowy adres email');
      return;
    }

    setLoading(true);

    try {
      if (!NEWSLETTER_WEBHOOK_URL) {
        console.log('📧 Newsletter signup:', email);
        
        const subscribers = JSON.parse(localStorage.getItem('newsletter-subscribers') || '[]');
        subscribers.push({
          email,
          timestamp: new Date().toISOString(),
          source: 'homepage',
        });
        localStorage.setItem('newsletter-subscribers', JSON.stringify(subscribers));
        
        toast.success('Zapisano! Email provider zostanie skonfigurowany wkrótce.');
        setSubscribed(true);
        setEmail('');
        setLoading(false);
        return;
      }

      const response = await fetch(NEWSLETTER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          timestamp: new Date().toISOString(),
          source: 'kompaseniora.pl/homepage',
        }),
      });

      if (!response.ok) {
        throw new Error('Błąd podczas zapisu');
      }

      toast.success('Dziękujemy! Wkrótce otrzymasz wiadomość powitalną.');
      setSubscribed(true);
      setEmail('');
      
    } catch (error) {
      console.error('Newsletter error:', error);
      toast.error('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <section className="py-16 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Dziękujemy!</h2>
            <p className="text-lg text-teal-100">Zapisałeś się do newslettera. Wkrótce otrzymasz wiadomość powitalną.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-r from-teal-600 to-teal-700">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bądź na bieżąco
          </h2>
          <p className="text-lg text-teal-100 max-w-2xl mx-auto">
            Otrzymuj aktualizacje o nowych domach opieki, zmianach cen oraz wsparcie dla całej rodziny w opiece nad bliskimi.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Twój adres email" 
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-lg text-lg text-gray-900 placeholder:text-gray-500 border-2 border-teal-500 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed" 
              required
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors whitespace-nowrap disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Zapisuję...
                </>
              ) : (
                'Zapisz się'
              )}
            </button>
          </div>
        </form>

        {!NEWSLETTER_WEBHOOK_URL && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 text-sm text-yellow-200">
              <strong>⚠️ Tryb deweloperski:</strong> Email provider nie jest skonfigurowany. 
              Zapisy są zapisywane lokalnie. Wklej webhook URL w komponencie.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}