'use client';

import { useEffect, useState, useCallback } from 'react';
import { indexedDBManager } from '@/lib/cache-utils';

export interface OfflineData<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isOffline: boolean;
  save: (data: T) => Promise<void>;
  load: () => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Hook for offline storage using IndexedDB
 */
export function useOfflineStorage<T>(
  storeName: string,
  key: string,
  initialData?: T
): OfflineData<T> {
  const [data, setData] = useState<T | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Initialize IndexedDB on mount
  useEffect(() => {
    indexedDBManager.init().catch((err) => {
      console.error('[useOfflineStorage] Failed to init IndexedDB:', err);
      setError(err);
    });

    // Check connection status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data from IndexedDB
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stored = await indexedDBManager.get<T>(storeName, key);
      if (stored) {
        setData(stored);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useOfflineStorage] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeName, key]);

  // Save data to IndexedDB
  const save = useCallback(
    async (newData: T) => {
      setIsLoading(true);
      setError(null);

      try {
        await indexedDBManager.set(storeName, {
          id: key,
          ...newData,
        } as any);
        setData(newData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('[useOfflineStorage] Failed to save:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [storeName, key]
  );

  // Clear data from IndexedDB
  const clear = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await indexedDBManager.delete(storeName, key);
      setData(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useOfflineStorage] Failed to clear:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeName, key]);

  return {
    data,
    isLoading,
    error,
    isOffline,
    save,
    load,
    clear,
  };
}

/**
 * Hook for syncing data between local storage and server
 */
export function useSyncQueue(storeName: string = 'sync-queue') {
  const [pendingItems, setPendingItems] = useState(0);

  // Add item to sync queue
  const addToQueue = useCallback(
    async (action: string, payload: any) => {
      try {
        await indexedDBManager.set(storeName, {
          action,
          payload,
          timestamp: Date.now(),
        });

        // Update pending count
        const items = await indexedDBManager.getAll(storeName);
        setPendingItems(items.length);
      } catch (err) {
        console.error('[useSyncQueue] Failed to add to queue:', err);
      }
    },
    [storeName]
  );

  // Process sync queue
  const processQueue = useCallback(async () => {
    try {
      const items = await indexedDBManager.getAll(storeName);

      for (const item of items) {
        // Send to server
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          await indexedDBManager.delete(storeName, (item as any).id);
        }
      }

      // Update pending count
      const remaining = await indexedDBManager.getAll(storeName);
      setPendingItems(remaining.length);
    } catch (err) {
      console.error('[useSyncQueue] Failed to process queue:', err);
    }
  }, [storeName]);

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => processQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue]);

  return {
    pendingItems,
    addToQueue,
    processQueue,
  };
}

export default useOfflineStorage;
