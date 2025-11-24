'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Home, Users, CheckCircle2, Mail, Phone, MessageSquare } from 'lucide-react';

export default function WspolpracaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Backend API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setShowSuccess(true);

    // Auto-hide po 5 sekundach
    setTimeout(() => setShowSuccess(false), 5000);

    // Reset form
    e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Współpraca
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Razem możemy pomóc większej liczbie rodzin
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✅ Dziękujemy za zgłoszenie!
              </h3>
              <p className="text-green-800 leading-relaxed">
                Otrzymaliśmy Twoją wiadomość. Skontaktujemy się z Tobą wkrótce, aby omówić szczegóły współpracy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Introduction */}
        <section className="mb-16">
          <div className="max-w-3xl">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Kompas Seniora powstał, żeby ułatwić rodzinom dostęp do rzetelnych informacji o opiece nad seniorami.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Jeśli jesteś przedstawicielem MOPS, placówki opiekuńczej lub organizacji wspierającej seniorów — zapraszamy do współpracy.
            </p>
          </div>
        </section>

        {/* Dla Kogo? - 3 Karty Partnerów */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Dla kogo?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* MOPS/OPS */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                MOPS / OPS
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Zwiększ dostępność informacji o placówkach w waszym powiecie.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Aktualne dane o placówkach</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Dotrzyjcie do większej liczby rodzin</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Wsparcie w aktualizacji danych</span>
                </li>
              </ul>
            </div>

            {/* Placówki DPS/ŚDS */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Placówki DPS / ŚDS
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Dotrzyjcie do rodzin poszukujących opieki dla bliskich.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Prezentacja waszej oferty</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Aktualne dane kontaktowe</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Bezpośredni kontakt z zainteresowanymi</span>
                </li>
              </ul>
            </div>

            {/* Stowarzyszenia */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Stowarzyszenia
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Amplifikujcie swój impact i dotrzyjcie do większej grupy seniorów.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Promowanie waszych inicjatyw</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Współpraca przy contencie</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                  <span>Wspólne projekty edukacyjne</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Korzyści Współpracy */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Dlaczego warto współpracować?
          </h2>
          
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Większy zasięg
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Dotrzyjcie do rodzin aktywnie poszukujących informacji o opiece nad seniorami.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Aktualne dane
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Zapewniamy regularną aktualizację informacji o waszej placówce.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Transparentność
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Pomagamy budować zaufanie poprzez rzetelne informacje.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Wsparcie techniczne
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Pomagamy w digitalizacji i prezentacji waszej oferty.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Jak To Działa - Proces */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Jak to działa?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Kontakt', desc: 'Wypełnij formularz poniżej' },
              { num: '2', title: 'Rozmowa', desc: 'Omówimy szczegóły współpracy' },
              { num: '3', title: 'Integracja', desc: 'Dodamy dane do bazy' },
              { num: '4', title: 'Aktualizacje', desc: 'Regularne odświeżanie danych' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 bg-accent-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FORMULARZ WSPÓŁPRACY */}
        <section className="mb-16" id="formularz">
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Napisz do nas
              </h2>
              <p className="text-gray-600">
                Wypełnij formularz, a my skontaktujemy się z Tobą w ciągu 2 dni roboczych.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Imię i nazwisko */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Jan Kowalski"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adres email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="jan.kowalski@example.pl"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                />
              </div>

              {/* Nazwa organizacji */}
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa organizacji *
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  required
                  placeholder="np. MOPS Kraków, DPS Vita"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                />
              </div>

              {/* Typ partnera */}
              <div>
                <label htmlFor="partnerType" className="block text-sm font-medium text-gray-700 mb-2">
                  Typ partnera *
                </label>
                <select
                  id="partnerType"
                  name="partnerType"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                >
                  <option value="">Wybierz...</option>
                  <option value="mops">MOPS / OPS</option>
                  <option value="facility">Placówka (DPS / ŚDS)</option>
                  <option value="association">Stowarzyszenie / Fundacja</option>
                  <option value="other">Inne</option>
                </select>
              </div>

              {/* Telefon (opcjonalnie) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon <span className="text-gray-500 font-normal">(opcjonalnie)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="12 345 67 89"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
                />
              </div>

              {/* Wiadomość */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Wiadomość *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Opisz krótko, jak chciałbyś współpracować..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors resize-none"
                />
              </div>

              {/* RODO Consent */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="gdprConsent"
                    required
                    className="w-5 h-5 text-accent-600 border-gray-300 rounded focus:ring-accent-500 mt-0.5 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    Wyrażam zgodę na przetwarzanie moich danych osobowych w celu kontaktu dotyczącego współpracy. 
                    Administratorem danych jest Kompas Seniora. *
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2 ml-8">
                  Więcej informacji w{' '}
                  <Link href="/polityka-prywatnosci" className="text-accent-600 hover:text-accent-700 underline">
                    Polityce Prywatności
                  </Link>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Wyślij zgłoszenie
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500">
                * Pola wymagane
              </p>
            </form>
          </div>
        </section>

        {/* CTA - Masz Pytania */}
        <section className="bg-gradient-to-r from-accent-600 to-accent-700 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Masz pytania?
          </h2>
          <p className="text-xl text-accent-50 mb-8 max-w-2xl mx-auto">
            Chętnie odpowiemy na wszystkie pytania dotyczące współpracy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:wspolpraca@kompaseniora.pl"
              className="inline-flex items-center justify-center gap-2 bg-white text-accent-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-50 transition-colors"
            >
              <Mail className="w-5 h-5" />
              wspolpraca@kompaseniora.pl
            </a>
            <a
              href="tel:+48123456789"
              className="inline-flex items-center justify-center gap-2 bg-accent-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-900 transition-colors border-2 border-accent-700"
            >
              <Phone className="w-5 h-5" />
              +48 123 456 789
            </a>
          </div>
        </section>

      </main>
    </div>
  );
}