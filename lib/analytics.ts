// lib/analytics.ts

export type AnalyticsEventType = 
  | 'view'
  | 'phone_click'
  | 'email_click'
  | 'website_click'
  | 'favorite_add'
  | 'favorite_remove'
  | 'compare_add'
  | 'share';

interface TrackEventParams {
  placowkaId: number;
  eventType: AnalyticsEventType;
  metadata?: Record<string, any>;
}

/**
 * Track analytics event
 * Safe to call - won't throw errors if tracking fails
 */
export async function trackEvent({ placowkaId, eventType, metadata }: TrackEventParams): Promise<void> {
  try {
    // Don't track in development (optional - comment out if you want to test locally)
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('📊 [DEV] Would track:', { placowkaId, eventType, metadata });
    //   return;
    // }

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placowkaId,
        eventType,
        metadata,
      }),
    });

    if (!response.ok) {
      console.warn('Analytics tracking failed:', response.status);
    }
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.warn('Analytics tracking error:', error);
  }
}

/**
 * Track page view
 */
export function trackView(placowkaId: number, metadata?: Record<string, any>) {
  return trackEvent({ placowkaId, eventType: 'view', metadata });
}

/**
 * Track phone click
 */
export function trackPhoneClick(placowkaId: number, phoneNumber?: string) {
  return trackEvent({ 
    placowkaId, 
    eventType: 'phone_click',
    metadata: { phoneNumber }
  });
}

/**
 * Track email click
 */
export function trackEmailClick(placowkaId: number, email?: string) {
  return trackEvent({ 
    placowkaId, 
    eventType: 'email_click',
    metadata: { email }
  });
}

/**
 * Track website click
 */
export function trackWebsiteClick(placowkaId: number, url?: string) {
  return trackEvent({ 
    placowkaId, 
    eventType: 'website_click',
    metadata: { url }
  });
}

/**
 * Track favorite add
 */
export function trackFavoriteAdd(placowkaId: number) {
  return trackEvent({ placowkaId, eventType: 'favorite_add' });
}

/**
 * Track favorite remove
 */
export function trackFavoriteRemove(placowkaId: number) {
  return trackEvent({ placowkaId, eventType: 'favorite_remove' });
}

/**
 * Track compare add
 */
export function trackCompareAdd(placowkaId: number) {
  return trackEvent({ placowkaId, eventType: 'compare_add' });
}

/**
 * Track share
 */
export function trackShare(placowkaId: number, method?: string) {
  return trackEvent({ 
    placowkaId, 
    eventType: 'share',
    metadata: { method }
  });
}