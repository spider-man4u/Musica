'use client';

import { useEffect, useState } from 'react';
import { preloadResource, prefetchResource } from '@/lib/performance';

/**
 * Hook for preloading resources
 */
export function usePreloadResource(url: string, type: 'script' | 'style' | 'image' = 'script') {
  useEffect(() => {
    if (url) {
      preloadResource(url, type);
    }
  }, [url, type]);
}

/**
 * Hook for prefetching resources
 */
export function usePrefetchResource(url: string, delay: number = 0) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (url) {
        prefetchResource(url);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [url, delay]);
}

/**
 * Hook for lazy loading resources
 */
export function useLazyResource(
  url: string,
  trigger: boolean = true,
  delay: number = 0
) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!trigger || !url || loaded) return;

    const timer = setTimeout(() => {
      fetch(url)
        .then(() => setLoaded(true))
        .catch((err) => setError(err));
    }, delay);

    return () => clearTimeout(timer);
  }, [url, trigger, delay, loaded]);

  return { loaded, error, retry: () => setLoaded(false) };
}

export default usePreloadResource;
