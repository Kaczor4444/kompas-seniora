// src/hooks/useScrollTracking.ts
import { useEffect, useRef } from 'react';
import { useAppAnalytics } from './useAppAnalytics';

export function useScrollTracking(resultsCount: number) {
  const { trackScrollDepth } = useAppAnalytics();
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (resultsCount === 0) return;

    firedRef.current = new Set();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.floor((scrollTop / docHeight) * 100);

      ([25, 50, 75, 100] as const).forEach(milestone => {
        if (pct >= milestone && !firedRef.current.has(milestone)) {
          firedRef.current.add(milestone);
          trackScrollDepth(milestone, resultsCount);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [resultsCount, trackScrollDepth]);
}
