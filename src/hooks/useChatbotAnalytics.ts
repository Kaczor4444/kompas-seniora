import { useCallback } from 'react';

async function postAppEvent(eventType: string, metadata?: Record<string, unknown>) {
  try {
    const language = typeof navigator !== 'undefined' ? navigator.language : undefined;
    await fetch('/api/analytics/app-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata, language }),
    });
  } catch {
    // Silently fail - analytics shouldn't break UX
  }
}

export function useChatbotAnalytics() {
  const trackOpen = useCallback(() => {
    postAppEvent('chatbot_opened');
  }, []);

  const trackClose = useCallback((messageCount: number, durationSeconds: number) => {
    postAppEvent('chatbot_closed', { messageCount, durationSeconds });
  }, []);

  const trackMessage = useCallback((messageLength: number, messageIndex: number) => {
    postAppEvent('chatbot_message_sent', { messageLength, messageIndex });
  }, []);

  const trackAction = useCallback((
    actionType: 'placowka' | 'mapa' | 'search' | 'artykul',
    actionId?: number | string
  ) => {
    postAppEvent('chatbot_action_clicked', { actionType, actionId });
  }, []);

  const trackError = useCallback((errorType: '429' | '503' | '500' | 'network', errorMessage?: string) => {
    postAppEvent('chatbot_error', { errorType, errorMessage });
  }, []);

  const trackFeedback = useCallback((messageIndex: number, isPositive: boolean) => {
    const eventType = isPositive ? 'chatbot_feedback_positive' : 'chatbot_feedback_negative';
    postAppEvent(eventType, { messageIndex });
  }, []);

  return {
    trackOpen,
    trackClose,
    trackMessage,
    trackAction,
    trackError,
    trackFeedback,
  };
}
