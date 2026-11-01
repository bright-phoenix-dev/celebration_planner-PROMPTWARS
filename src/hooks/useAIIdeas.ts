'use client';

import { useState, useCallback, useRef } from 'react';
import type { AIPreferences, AIIdeasResponse } from '@/types';

/** Cache key generator from preferences. */
function getCacheKey(prefs: AIPreferences): string {
  return JSON.stringify(prefs, Object.keys(prefs).sort());
}

/** In-memory cache for AI responses. */
const aiCache = new Map<string, AIIdeasResponse>();

/**
 * Hook for fetching AI-generated celebration ideas.
 * Includes caching, debouncing, and error handling.
 */
export function useAIIdeas() {
  const [ideas, setIdeas] = useState<AIIdeasResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchIdeas = useCallback(async (preferences: AIPreferences): Promise<void> => {
    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Check cache first
    const cacheKey = getCacheKey(preferences);
    const cached = aiCache.get(cacheKey);
    if (cached) {
      setIdeas(cached);
      setError(null);
      return;
    }

    // Debounce the request
    return new Promise<void>((resolve) => {
      debounceTimer.current = setTimeout(() => {
        void (async () => {
          setIsLoading(true);
          setError(null);

          try {
            const response = await fetch('/api/ai/ideas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ preferences }),
            });

            if (!response.ok) {
              const errorData = (await response.json().catch(() => ({}))) as {
                error?: string;
              };
              throw new Error(
                errorData.error ?? `Request failed with status ${String(response.status)}`,
              );
            }

            const data = (await response.json()) as AIIdeasResponse;
            aiCache.set(cacheKey, data);
            setIdeas(data);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate ideas';
            setError(message);
          } finally {
            setIsLoading(false);
            resolve();
          }
        })();
      }, 500);
    });
  }, []);

  const clearIdeas = useCallback(() => {
    setIdeas(null);
    setError(null);
  }, []);

  return {
    ideas,
    isLoading,
    error,
    fetchIdeas,
    clearIdeas,
  };
}
