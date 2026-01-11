import FAQAccordion from '../../src/components/faq/FAQAccordion';
import { allFAQData } from '../../src/components/faq/faqData';

export const metadata = {
  title: 'Najczęściej zadawane pytania | Kompas Seniora',
  description: 'Odpowiedzi na wszystkie pytania o Domy Pomocy Społecznej, koszty, procedury i wyszukiwarkę placówek w Małopolsce.',
};

export default function FAQPage() {
  const categoryNames = {
    finanse: 'Finanse i koszty',
    definicje: 'Definicje i różnice',
    formalnosci: 'Formalności',
    zaufanie: 'Wyszukiwarka i zaufanie'
  };

  const categories = {
    finanse: allFAQData.filter(item => item.category === 'finanse'),
    definicje: allFAQData.filter(item => item.category === 'definicje'),
    formalnosci: allFAQData.filter(item => item.category === 'formalnosci'),
    zaufanie: allFAQData.filter(item => item.category === 'zaufanie'),
  };

  // Schema Markup dla Google SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFAQData.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer.replace(/\*\*/g, '')
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="min-h-screen bg-stone-50">
        {/* HERO SECTION */}
        <section className="relative bg-white overflow-hidden border-b border-stone-200">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary-50 to-transparent opacity-50" 
            style={{
              clipPath: 'ellipse(150% 100% at 50% 0%)'
            }}
          />
          
          <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-6">
              Pytania o Kompas Seniora?
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              System pomocy społecznej ma swoje reguły. 
              Zebraliśmy odpowiedzi na wszystkie najważniejsze pytania.
            </p>
          </div>
        </section>

        {/* FAQ CATEGORIES */}
        <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          {Object.entries(categories).map(([categoryKey, items]) => (
            <div key={categoryKey} className="mb-20 last:mb-0">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 mb-2">
                  {categoryNames[categoryKey as keyof typeof categoryNames]}
                </h2>
                <div className="w-20 h-1 bg-primary-500 rounded-full"></div>
              </div>
              
              <FAQAccordion items={items} />
            </div>
          ))}
        </section>

        {/* CTA SECTION */}
        <section className="bg-slate-900 py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-4">
              Nie znalazłeś odpowiedzi?
            </h2>
            <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Skontaktuj się z nami, a pomożemy Ci znaleźć odpowiednią placówkę dla Twojego bliskiego.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:kontakt@kompaseniora.pl"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Napisz do nas
              </a>
              <a 
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-stone-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Wróć do wyszukiwarki
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}