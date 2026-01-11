'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
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
          const offset = 80;
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
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openId === item.id;
        
        return (
          <div
            key={item.id}
            id={item.id}
            className={`border rounded-2xl transition-all duration-300 ${
              isOpen 
                ? 'bg-stone-50 border-stone-300 shadow-sm' 
                : 'bg-white border-stone-200 hover:border-primary-200'
            }`}
          >
            <button
              onClick={() => toggleQuestion(item.id)}
              className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
            >
              <span className={`font-semibold text-lg pr-4 ${
                isOpen ? 'text-primary-700' : 'text-slate-800'
              }`}>
                {item.question}
              </span>
              <span className={`flex-shrink-0 ml-4 p-1 rounded-full transition-colors ${
                isOpen 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'bg-stone-100 text-slate-400'
              }`}>
                {isOpen ? <Minus size={20} /> : <Plus size={20} />}
              </span>
            </button>

            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-stone-200/50 mt-2">
                {renderAnswer(item.answer)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}