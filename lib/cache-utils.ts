// Advanced Caching Utilities for PWA

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

export interface CacheConfig {
  maxSize?: number; // Max entries in cache
  defaultTTL?: number; // Default TTL in milliseconds
}

class CacheManager {
  private caches: Map<string, Map<string, CacheEntry<any>>> = new Map();
  private config: Required<CacheConfig> = {
    maxSize: 100,
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  };

  constructor(config?: CacheConfig) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get cache namespace
   */
  private getNamespace(namespace: string): Map<string, CacheEntry<any>> {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new Map());
    }
    return this.caches.get(namespace)!;
  }

  /**
   * Set cache entry
   */
  set<T>(namespace: string, key: string, data: T, ttl?: number): void {
    const ns = this.getNamespace(namespace);

    // Check max size
    if (ns.size >= this.config.maxSize) {
      const firstKey = ns.keys().next().value;
      ns.delete(firstKey);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
    };

    ns.set(key, entry);
    console.log(`[Cache] Set ${namespace}:${key}`);
  }

  /**
   * Get cache entry
   */
  get<T>(namespace: string, key: string): T | null {
    const ns = this.getNamespace(namespace);
    const entry = ns.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      console.log(`[Cache] Miss ${namespace}:${key}`);
      return null;
    }

    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (entry.ttl && age > entry.ttl) {
      console.log(`[Cache] Expired ${namespace}:${key}`);
      ns.delete(key);
      return null;
    }

    console.log(`[Cache] Hit ${namespace}:${key}`);
    return entry.data;
  }

  /**
   * Check if key exists and is valid
   */
  has(namespace: string, key: string): boolean {
    return this.get(namespace, key) !== null;
  }

  /**
   * Delete cache entry
   */
  delete(namespace: string, key: string): boolean {
    const ns = this.getNamespace(namespace);
    const deleted = ns.delete(key);
    if (deleted) {
      console.log(`[Cache] Deleted ${namespace}:${key}`);
    }
    return deleted;
  }

  /**
   * Clear entire namespace
   */
  clear(namespace: string): void {
    this.caches.set(namespace, new Map());
    console.log(`[Cache] Cleared namespace: ${namespace}`);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.caches.clear();
    console.log('[Cache] Cleared all caches');
  }

  /**
   * Get cache size
   */
  size(namespace: string): number {
    return this.getNamespace(namespace).size;
  }

  /**
   * Get all keys in namespace
   */
  keys(namespace: string): string[] {
    return Array.from(this.getNamespace(namespace).keys());
  }

  /**
   * Cleanup expired entries
   */
  cleanup(namespace?: string): void {
    const now = Date.now();

    if (namespace) {
      const ns = this.getNamespace(namespace);
      for (const [key, entry] of ns.entries()) {
        const age = now - entry.timestamp;
        if (entry.ttl && age > entry.ttl) {
          ns.delete(key);
        }
      }
    } else {
      for (const [ns, entries] of this.caches.entries()) {
        for (const [key, entry] of entries.entries()) {
          const age = now - entry.timestamp;
          if (entry.ttl && age > entry.ttl) {
            entries.delete(key);
          }
        }
      }
    }

    console.log('[Cache] Cleanup completed');
  }
}

// Export singleton instance
export const cacheManager = new CacheManager({
  maxSize: 200,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
});

/**
 * IndexedDB wrapper for larger data storage
 */
export class IndexedDBManager {
  private dbName = 'musica-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('music')) {
          db.createObjectStore('music', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync-queue')) {
          db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async set<T>(store: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`[IndexedDB] Stored in ${store}`);
        resolve();
      };
    });
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`[IndexedDB] Retrieved ${key} from ${store}`);
        resolve(request.result || null);
      };
    });
  }

  async getAll<T>(store: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`[IndexedDB] Retrieved all from ${store}`);
        resolve(request.result);
      };
    });
  }

  async delete(store: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`[IndexedDB] Deleted ${key} from ${store}`);
        resolve();
      };
    });
  }

  async clear(store: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`[IndexedDB] Cleared ${store}`);
        resolve();
      };
    });
  }
}

export const indexedDBManager = new IndexedDBManager();

export default cacheManager;
