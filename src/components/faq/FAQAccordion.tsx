'use client';

import { useState } from 'react';
import { FAQItem } from './faqData';

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    const newOpenId = openId === id ? null : id;
    setOpenId(newOpenId);
    
    // Scroll do rozwiniętego pytania z offsetem
    if (newOpenId) {
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80; // Offset od góry ekranu
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 150);
    }
  };

  const renderAnswer = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          id={item.id}
          className="bg-white rounded-xl border border-neutral-200 overflow-hidden transition-all duration-200 hover:border-neutral-300"
        >
          <button
            onClick={() => toggleQuestion(item.id)}
            className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-neutral-50"
          >
            <span className="text-lg font-semibold text-neutral-900 pr-4">
              {item.question}
            </span>
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-transform duration-200"
              style={{ transform: openId === item.id ? 'rotate(45deg)' : 'rotate(0deg)' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 5V15M5 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
          </button>

          {openId === item.id && (
            <div className="px-6 pb-5 pt-0">
              <div className="text-neutral-700 leading-relaxed border-t border-neutral-100 pt-4">
                {renderAnswer(item.answer)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}