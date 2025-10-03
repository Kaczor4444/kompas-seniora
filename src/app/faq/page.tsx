import FAQAccordion from '@/components/faq/FAQAccordion';
import { allFAQData } from '@/components/faq/faqData';

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

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="relative bg-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent-50 to-transparent opacity-50" 
          style={{
            clipPath: 'ellipse(150% 100% at 50% 0%)'
          }}
        />
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Pytania o Kompas Seniora?
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Wiemy, że proces szukania DPS może być trudny. 
            Zebraliśmy odpowiedzi na wszystkie najważniejsze pytania.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {Object.entries(categories).map(([categoryKey, items]) => (
          <div key={categoryKey} className="mb-16 last:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6 pb-3 border-b-2 border-accent-500">
              {categoryNames[categoryKey as keyof typeof categoryNames]}
            </h2>
            
            <FAQAccordion items={items} />
          </div>
        ))}
      </section>

      <section className="bg-accent-500 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Nie znalazłeś odpowiedzi?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Skontaktuj się z nami, a pomożemy Ci znaleźć odpowiednią placówkę dla Twojego bliskiego.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:kontakt@kompaseniora.pl"
              className="inline-flex items-center justify-center gap-2 bg-white text-accent-700 px-8 py-3 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Napisz do nas
            </a>
            <a 
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
            >
              Wróć do wyszukiwarki
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}