// src/hooks/useAnalytics.ts

import { useCallback } from 'react';

export type AnalyticsEventType = 
  | 'view'
  | 'phone_click'
  | 'email_click'
  | 'website_click'
  | 'favorite_add'
  | 'favorite_remove'
  | 'compare_add'
  | 'share';

interface TrackEventOptions {
  placowkaId: number;
  eventType: AnalyticsEventType;
  metadata?: Record<string, any>;
}

export function useAnalytics() {
  const trackEvent = useCallback(async (options: TrackEventOptions) => {
    try {
      console.log('📊 Tracking event:', options.eventType, 'for placowka:', options.placowkaId);

      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const error = await response.json();
        console.warn('⚠️ Analytics tracking failed:', error);
        // Don't throw - analytics failures shouldn't break UX
        return false;
      }

      const result = await response.json();
      console.log('✅ Analytics tracked successfully:', result.eventId);
      return true;

    } catch (error) {
      console.warn('⚠️ Analytics tracking error:', error);
      // Silently fail - don't break user experience
      return false;
    }
  }, []);

  // Convenience methods for specific events
  const trackView = useCallback((placowkaId: number) => {
    return trackEvent({ placowkaId, eventType: 'view' });
  }, [trackEvent]);

  const trackPhoneClick = useCallback((placowkaId: number, phoneNumber?: string) => {
    return trackEvent({ 
      placowkaId, 
      eventType: 'phone_click',
      metadata: phoneNumber ? { phoneNumber } : undefined
    });
  }, [trackEvent]);

  const trackEmailClick = useCallback((placowkaId: number, email?: string) => {
    return trackEvent({ 
      placowkaId, 
      eventType: 'email_click',
      metadata: email ? { email } : undefined
    });
  }, [trackEvent]);

  const trackWebsiteClick = useCallback((placowkaId: number, url?: string) => {
    return trackEvent({ 
      placowkaId, 
      eventType: 'website_click',
      metadata: url ? { url } : undefined
    });
  }, [trackEvent]);

  const trackFavoriteAdd = useCallback((placowkaId: number) => {
    return trackEvent({ placowkaId, eventType: 'favorite_add' });
  }, [trackEvent]);

  const trackFavoriteRemove = useCallback((placowkaId: number) => {
    return trackEvent({ placowkaId, eventType: 'favorite_remove' });
  }, [trackEvent]);

  const trackCompareAdd = useCallback((placowkaId: number) => {
    return trackEvent({ placowkaId, eventType: 'compare_add' });
  }, [trackEvent]);

  const trackShare = useCallback((placowkaId: number, method?: string) => {
    return trackEvent({ 
      placowkaId, 
      eventType: 'share',
      metadata: method ? { method } : undefined
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackView,
    trackPhoneClick,
    trackEmailClick,
    trackWebsiteClick,
    trackFavoriteAdd,
    trackFavoriteRemove,
    trackCompareAdd,
    trackShare
  };
}