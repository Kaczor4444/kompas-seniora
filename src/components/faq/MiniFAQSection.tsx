import Link from 'next/link';
import FAQAccordion from './FAQAccordion';
import { miniFAQData } from './faqData';

export default function MiniFAQSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 mb-4">
            Najczęściej zadawane pytania
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            System pomocy społecznej ma swoje reguły. Wyjaśniamy te najważniejsze.
          </p>
        </div>

        {/* FAQ Accordion */}
        <FAQAccordion items={miniFAQData} />

        {/* CTA do pełnej strony FAQ */}
        <div className="mt-12 text-center">
          <Link 
            href="/faq"
            className="inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors group"
          >
            <span>Zobacz wszystkie pytania i odpowiedzi</span>
            <svg 
              className="w-5 h-5 transition-transform group-hover:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}