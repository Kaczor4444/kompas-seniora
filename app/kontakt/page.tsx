'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, PlusCircle, AlertOctagon, FileEdit, MessageSquare, Copy, Check } from 'lucide-react';

export default function KontaktPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('kontakt@kompaseniora.pl');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50 relative overflow-hidden">
      {/* Decorative Background Elements (Consistent with Hero) */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-secondary-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Navigation */}
        <Link 
          href="/"
          className="group flex items-center gap-2 text-slate-600 hover:text-primary-600 font-bold mb-8 transition-colors px-4 py-2 rounded-xl hover:bg-white/50 w-fit"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center group-hover:border-primary-300 transition-colors shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Wróć do strony głównej
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
            Jesteśmy tu dla Ciebie
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Masz pytania dotyczące domów opieki? A może chcesz zgłosić poprawkę? 
            Wybierz temat, w którym możemy Ci pomóc.
          </p>
        </div>

        {/* Priority Contact Card */}
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-xl shadow-primary-900/5 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-transparent rounded-bl-full opacity-50"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center justify-center md:justify-start gap-2">
                <Mail className="text-primary-500" />
                Kontakt bezpośredni
              </h2>
              <p className="text-slate-500 mb-6 md:mb-0">
                Preferujesz tradycyjną wiadomość? Napisz do nas. <br/>
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
               <a 
                 href="mailto:kontakt@kompaseniora.pl"
                 className="flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary-600/20 transition-all transform active:scale-95"
               >
                 <Mail size={20} />
                 Napisz wiadomość
               </a>
               
               <button 
                 onClick={handleCopyEmail}
                 className="flex items-center justify-center gap-2 text-slate-500 hover:text-primary-600 text-sm font-medium py-2 px-4 rounded-lg hover:bg-stone-50 transition-colors"
               >
                 {copied ? <Check size={16} /> : <Copy size={16} />}
                 {copied ? "Skopiowano adres" : "Kopiuj adres email"}
               </button>
            </div>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Add Facility */}
          <a 
            href="mailto:kontakt@kompaseniora.pl?subject=Dodanie%20nowej%20placówki"
            className="group bg-white hover:bg-primary-50 p-6 rounded-2xl border border-stone-200 hover:border-primary-200 shadow-sm hover:shadow-lg transition-all text-left flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <PlusCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-800 mb-1">Dodaj placówkę</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Znasz DPS lub ŚDS, którego nie ma w naszej bazie? Pomóż nam ją uzupełnić.
              </p>
            </div>
          </a>

          {/* Card 2: Report Error */}
          <a 
            href="mailto:kontakt@kompaseniora.pl?subject=Błąd%20na%20stronie"
            className="group bg-white hover:bg-warning-50 p-6 rounded-2xl border border-stone-200 hover:border-warning-200 shadow-sm hover:shadow-lg transition-all text-left flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <AlertOctagon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-warning-800 mb-1">Błąd na stronie</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Coś nie działa poprawnie? Znalazłeś literówkę? Daj nam znać.
              </p>
            </div>
          </a>

          {/* Card 3: Correct Data */}
          <a 
            href="mailto:kontakt@kompaseniora.pl?subject=Poprawka%20danych%20placówki"
            className="group bg-white hover:bg-secondary-50 p-6 rounded-2xl border border-stone-200 hover:border-secondary-200 shadow-sm hover:shadow-lg transition-all text-left flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <FileEdit size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-secondary-800 mb-1">Popraw dane</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Widzisz nieaktualny numer telefonu lub adres placówki? Zgłoś poprawkę.
              </p>
            </div>
          </a>

          {/* Card 4: General Contact */}
          <a 
            href="mailto:kontakt@kompaseniora.pl?subject=Kontakt%20ogólny"
            className="group bg-white hover:bg-stone-100 p-6 rounded-2xl border border-stone-200 hover:border-stone-300 shadow-sm hover:shadow-lg transition-all text-left flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-slate-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-slate-800 mb-1">Kontakt ogólny</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Masz sugestię dotyczącą rozwoju serwisu? Chcesz nawiązać współpracę?
              </p>
            </div>
          </a>

        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-slate-400 text-sm">
           Administratorem danych osobowych jest Kompas Seniora sp. z o.o.<br/>
           <Link href="/polityka-prywatnosci" className="underline hover:text-primary-600">
             Polityka Prywatności
           </Link>
        </div>
      </div>
    </div>
  );
}
