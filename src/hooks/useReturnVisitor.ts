// src/hooks/useReturnVisitor.ts
import { useEffect } from 'react';
import { useAppAnalytics } from './useAppAnalytics';

const STORAGE_KEY = 'kompas-seniora-last-visit';

export function useReturnVisitor() {
  const { trackReturnVisit } = useAppAnalytics();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const lastVisit = localStorage.getItem(STORAGE_KEY);

    if (lastVisit) {
      const daysSince = Math.floor((now - parseInt(lastVisit)) / (1000 * 60 * 60 * 24));
      if (daysSince > 0) {
        trackReturnVisit(daysSince);
      }
    }

    localStorage.setItem(STORAGE_KEY, String(now));
  }, [trackReturnVisit]);
}
