// src/hooks/useAppAnalytics.ts
import { useCallback } from 'react';

interface FilterState {
  powiat?: string;
  type?: string;
  priceLimit?: number;
  profile?: string;
  query?: string;
}

async function postAppEvent(eventType: string, metadata?: Record<string, unknown>) {
  try {
    const language = typeof navigator !== 'undefined' ? navigator.language : undefined;
    await fetch('/api/analytics/app-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata, language }),
    });
  } catch {
    // Silently fail — analytics should never break UX
  }
}

export function useAppAnalytics() {
  const trackEmptyResults = useCallback((filters: FilterState & { totalServerResults: number }) => {
    postAppEvent('empty_results', {
      powiat: filters.powiat || 'Wszystkie',
      type: filters.type || 'all',
      priceLimit: filters.priceLimit,
      profile: filters.profile,
      query: filters.query,
      totalServerResults: filters.totalServerResults,
    });
  }, []);

  const trackFilterApplied = useCallback((filters: FilterState) => {
    const active = Object.entries({
      powiat: filters.powiat,
      type: filters.type,
      profile: filters.profile,
      priceLimit: filters.priceLimit !== 10000 ? filters.priceLimit : undefined,
    })
      .filter(([, v]) => v && v !== 'Wszystkie' && v !== 'all')
      .map(([k]) => k);

    if (active.length === 0) return;

    postAppEvent('filter_applied', {
      powiat: filters.powiat || 'Wszystkie',
      type: filters.type || 'all',
      priceLimit: filters.priceLimit,
      profile: filters.profile || 'Wszystkie',
      activeFilters: active,
      combo: active.sort().join('+'),
    });
  }, []);

  const trackScrollDepth = useCallback((depth: 25 | 50 | 75 | 100, resultsCount: number) => {
    postAppEvent('scroll_depth', { depth, resultsCount });
  }, []);

  const trackReturnVisit = useCallback((daysSince: number) => {
    postAppEvent('return_visit', { daysSince });
  }, []);

  const trackCrossPowiatView = useCallback((
    facilityId: number,
    facilityPowiat: string,
    searchedPowiat: string,
  ) => {
    postAppEvent('cross_powiat_view', { facilityId, facilityPowiat, searchedPowiat });
  }, []);

  return {
    trackEmptyResults,
    trackFilterApplied,
    trackScrollDepth,
    trackReturnVisit,
    trackCrossPowiatView,
  };
}
