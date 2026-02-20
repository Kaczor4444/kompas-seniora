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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Background Elements (Consistent with Hero) */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-slate-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Navigation */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-black mb-8 transition-colors px-4 py-2 rounded-xl hover:bg-slate-50/50 w-fit"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-300 transition-colors shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Wróć do strony głównej
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
            Jesteśmy tu dla Ciebie
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Masz pytania dotyczące domów opieki? A może chcesz zgłosić poprawkę?
            Wybierz temat, w którym możemy Ci pomóc.
          </p>
        </div>

        {/* Priority Contact Card */}
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl shadow-slate-900/10 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-900/30 to-transparent rounded-bl-full opacity-50"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-white mb-2 flex items-center justify-center md:justify-start gap-2 tracking-tight">
                <Mail className="text-emerald-400" />
                Kontakt bezpośredni
              </h2>
              <p className="text-slate-300 mb-6 md:mb-0 leading-relaxed">
                Preferujesz tradycyjną wiadomość? Napisz do nas. <br/>
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
               <a
                 href="mailto:kontakt@kompaseniora.pl"
                 className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-black py-4 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95 uppercase tracking-[0.05em]"
               >
                 <Mail size={20} />
                 Napisz wiadomość
               </a>

               <button
                 onClick={handleCopyEmail}
                 className="flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 text-sm font-black py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-[0.05em]"
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
            className="group bg-white hover:bg-emerald-50 p-6 rounded-2xl border border-slate-200 hover:border-emerald-200 shadow-sm hover:shadow-lg transition-all text-left flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <PlusCircle size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 group-hover:text-emerald-800 mb-1 tracking-tight">Dodaj placówkę</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Znasz DPS lub ŚDS, którego nie ma w naszej bazie? Pomóż nam ją uzupełnić.
              </p>
            </div>
          </a>

          {/* Card 2: Report Error */}
          <a
            href="mailto:kontakt@kompaseniora.pl?subject=Błąd%20na%20stronie"
            className="group bg-white hover:bg-red-50 p-6 rounded-2xl border border-slate-200 hover:border-red-200 shadow-sm hover:shadow-lg transition-all text-left flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <AlertOctagon size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 group-hover:text-red-800 mb-1 tracking-tight">Błąd na stronie</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Coś nie działa poprawnie? Znalazłeś literówkę? Daj nam znać.
              </p>
            </div>
          </a>

          {/* Card 3: Correct Data */}
          <a
            href="mailto:kontakt@kompaseniora.pl?subject=Poprawka%20danych%20placówki"
            className="group bg-white hover:bg-blue-50 p-6 rounded-2xl border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all text-left flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <FileEdit size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 group-hover:text-blue-800 mb-1 tracking-tight">Popraw dane</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Widzisz nieaktualny numer telefonu lub adres placówki? Zgłoś poprawkę.
              </p>
            </div>
          </a>

          {/* Card 4: General Contact */}
          <a
            href="mailto:kontakt@kompaseniora.pl?subject=Kontakt%20ogólny"
            className="group bg-white hover:bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all text-left flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 group-hover:text-slate-800 mb-1 tracking-tight">Kontakt ogólny</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Masz sugestię dotyczącą rozwoju serwisu? Chcesz nawiązać współpracę?
              </p>
            </div>
          </a>

        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-slate-400 text-sm">
           Administratorem danych osobowych jest Kompas Seniora sp. z o.o.<br/>
           <Link href="/polityka-prywatnosci" className="underline hover:text-emerald-600 transition-colors">
             Polityka Prywatności
           </Link>
        </div>
      </div>
    </div>
  );
}
