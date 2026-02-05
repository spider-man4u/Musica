// Security Utilities for PWA

/**
 * Content Security Policy helpers
 */
export const CSP = {
  // Nonce for inline scripts (should be generated server-side)
  getNonce: (): string => {
    if (typeof window === 'undefined') {
      return crypto.getRandomValues(new Uint8Array(16)).toString();
    }
    return '';
  },

  // Check if inline scripts are allowed
  allowInlineScripts: (): boolean => {
    try {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!meta) return true;
      const content = meta.getAttribute('content') || '';
      return content.includes("'unsafe-inline'");
    } catch (e) {
      return true;
    }
  },
};

/**
 * HTTPS enforcement
 */
export function enforceHTTPS(): void {
  if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
    if (window.location.hostname !== 'localhost') {
      window.location.protocol = 'https:';
    }
  }
}

/**
 * Input sanitization
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * URL validation
 */
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate origin
 */
export function isValidOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    if (allowed.startsWith('http://') || allowed.startsWith('https://')) {
      return origin === allowed;
    }
    return origin.endsWith(allowed);
  });
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  if (typeof crypto === 'undefined') {
    return Math.random().toString(36).substring(2, 15);
  }
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Store CSRF token in session storage
 */
export function setCSRFToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('csrf-token', token);
  }
}

/**
 * Get CSRF token from session storage
 */
export function getCSRFToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('csrf-token');
  }
  return null;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const stored = getCSRFToken();
  return stored ? stored === token : false;
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  /**
   * Reset for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Reset all
   */
  resetAll(): void {
    this.requests.clear();
  }
}

/**
 * Secure storage wrapper
 */
export class SecureStorage {
  private storageKey = 'musica-secure';

  /**
   * Set encrypted item
   */
  setItem(key: string, value: string): void {
    try {
      const encrypted = btoa(value); // Basic encoding (use encryption library in production)
      const storage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      storage[key] = encrypted;
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    } catch (error) {
      console.error('[SecureStorage] Failed to set item:', error);
    }
  }

  /**
   * Get decrypted item
   */
  getItem(key: string): string | null {
    try {
      const storage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      const encrypted = storage[key];
      if (!encrypted) return null;
      return atob(encrypted); // Basic decoding
    } catch (error) {
      console.error('[SecureStorage] Failed to get item:', error);
      return null;
    }
  }

  /**
   * Remove item
   */
  removeItem(key: string): void {
    try {
      const storage = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      delete storage[key];
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
    } catch (error) {
      console.error('[SecureStorage] Failed to remove item:', error);
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('[SecureStorage] Failed to clear:', error);
    }
  }
}

// Export singleton
export const secureStorage = new SecureStorage();
export const rateLimiter = new RateLimiter(10, 60000);

export default {
  CSP,
  enforceHTTPS,
  sanitizeInput,
  isValidURL,
  isValidOrigin,
  generateCSRFToken,
  getCSRFToken,
  setCSRFToken,
  validateCSRFToken,
  RateLimiter,
  SecureStorage,
  secureStorage,
  rateLimiter,
};
