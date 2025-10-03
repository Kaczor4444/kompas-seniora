import Link from 'next/link';
import FAQAccordion from './FAQAccordion';
import { miniFAQData } from './faqData';

export default function MiniFAQSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Najczęściej zadawane pytania
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Wiemy, że szukanie odpowiedniej opieki może być przytłaczające. 
            Odpowiadamy na najważniejsze pytania.
          </p>
        </div>

        {/* FAQ Accordion */}
        <FAQAccordion items={miniFAQData} />

        {/* CTA do pełnej strony FAQ */}
        <div className="mt-10 text-center">
          <Link 
            href="/faq"
            className="inline-flex items-center gap-2 text-accent-700 font-semibold hover:text-accent-800 transition-colors group"
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