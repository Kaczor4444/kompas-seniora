'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kompas_reading_history';
const MAX_ITEMS = 3;
const EXPIRY_DAYS = 30;

export interface ReadingHistoryItem {
  slug: string;
  sectionId: string;
  title: string;
  category: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Hook for managing reading history in localStorage
 * Automatically filters expired items (30+ days)
 * Maintains max 3 items, sorted by timestamp DESC
 */
export function useReadingHistory() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  /**
   * Load history from localStorage and filter expired items
   */
  const loadHistory = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setHistory([]);
        return;
      }

      const parsed: ReadingHistoryItem[] = JSON.parse(stored);
      const now = Date.now();

      // Filter expired items
      const validItems = parsed.filter(item => item.expiresAt > now);

      // Sort by timestamp DESC (newest first)
      validItems.sort((a, b) => b.timestamp - a.timestamp);

      setHistory(validItems);

      // Update localStorage if items were filtered
      if (validItems.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
      }
    } catch (error) {
      console.error('Error loading reading history:', error);
      setHistory([]);
    }
  }, []);

  /**
   * Add article to reading history
   * Updates timestamp if article already exists
   * Reads localStorage directly to avoid circular dependencies
   */
  const addToHistory = useCallback((article: Omit<ReadingHistoryItem, 'timestamp' | 'expiresAt'>) => {
    if (typeof window === 'undefined') return;

    try {
      const now = Date.now();
      const expiresAt = now + (EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      // Load current history directly from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      let items: ReadingHistoryItem[] = stored ? JSON.parse(stored) : [];

      // Filter expired items first
      items = items.filter(item => item.expiresAt > now);

      // Check if article already exists
      const existingIndex = items.findIndex(
        item => item.slug === article.slug && item.sectionId === article.sectionId
      );

      if (existingIndex !== -1) {
        // Update timestamp for existing article
        items[existingIndex] = {
          ...items[existingIndex],
          timestamp: now,
          expiresAt,
        };
      } else {
        // Add new article
        const newItem: ReadingHistoryItem = {
          ...article,
          timestamp: now,
          expiresAt,
        };
        items.unshift(newItem);
      }

      // Sort by timestamp DESC
      items.sort((a, b) => b.timestamp - a.timestamp);

      // Keep only max items
      const limitedItems = items.slice(0, MAX_ITEMS);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedItems));

      // Update state
      setHistory(limitedItems);
    } catch (error) {
      console.error('Error adding to reading history:', error);
    }
  }, []);

  /**
   * Get current reading history
   * Returns filtered and sorted items from state
   */
  const getHistory = useCallback((): ReadingHistoryItem[] => {
    return history;
  }, [history]);

  /**
   * Clear all reading history
   */
  const clearHistory = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing reading history:', error);
    }
  }, []);

  // Check if we're on the client side (SSR safe) and load history
  useEffect(() => {
    setIsClient(true);
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    addToHistory,
    getHistory,
    clearHistory,
    isClient,
  };
}
