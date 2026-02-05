// Performance Monitoring and Optimization Utilities for PWA

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive: number;
  totalBlockingTime?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics | null = null;

  /**
   * Collect performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    if (!('PerformanceObserver' in window)) {
      console.log('[Performance] PerformanceObserver not supported');
      return this.getBasicMetrics();
    }

    return new Promise((resolve) => {
      const metrics: Partial<PerformanceMetrics> = {};

      // Get page load time
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        metrics.pageLoadTime = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
        metrics.timeToInteractive = navigationEntry.domInteractive - navigationEntry.fetchStart;
      }

      // Get first paint metrics
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });

      // Observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
      });

      // Observe Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        metrics.cumulativeLayoutShift = clsValue;
      });

      // Observe Total Blocking Time
      const tbtObserver = new PerformanceObserver((list) => {
        let tbtValue = 0;
        list.getEntries().forEach((entry) => {
          tbtValue += Math.max((entry as any).duration - 50, 0);
        });
        metrics.totalBlockingTime = tbtValue;
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.log('[Performance] LCP not supported');
      }

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('[Performance] CLS not supported');
      }

      try {
        tbtObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('[Performance] TBT not supported');
      }

      // Resolve after 5 seconds or when all metrics collected
      setTimeout(() => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        tbtObserver.disconnect();

        const completeMetrics: PerformanceMetrics = {
          pageLoadTime: metrics.pageLoadTime || 0,
          firstPaint: metrics.firstPaint || 0,
          firstContentfulPaint: metrics.firstContentfulPaint || 0,
          largestContentfulPaint: metrics.largestContentfulPaint,
          cumulativeLayoutShift: metrics.cumulativeLayoutShift,
          timeToInteractive: metrics.timeToInteractive || 0,
          totalBlockingTime: metrics.totalBlockingTime,
        };

        this.metrics = completeMetrics;
        resolve(completeMetrics);
      }, 5000);
    });
  }

  /**
   * Get basic metrics (fallback)
   */
  private getBasicMetrics(): PerformanceMetrics {
    const navigationTiming = window.performance.timing;
    return {
      pageLoadTime:
        navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
      firstPaint: navigationTiming.responseStart - navigationTiming.navigationStart,
      firstContentfulPaint:
        navigationTiming.domContentLoadedEventEnd -
        navigationTiming.navigationStart,
      timeToInteractive:
        navigationTiming.domInteractive - navigationTiming.navigationStart,
    };
  }

  /**
   * Log metrics to console and server
   */
  async reportMetrics(): Promise<void> {
    const metrics = this.metrics || (await this.collectMetrics());

    console.log('[Performance] Metrics:', metrics);

    // Send to analytics/monitoring service
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'web-vitals',
          metrics,
          timestamp: Date.now(),
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.error('[Performance] Failed to report metrics:', error);
    }
  }

  /**
   * Get metrics score (0-100)
   */
  getScore(): number {
    if (!this.metrics) return 0;

    let score = 100;

    // Deduct points based on metrics
    if (this.metrics.firstContentfulPaint > 1800) score -= 10;
    if (this.metrics.firstContentfulPaint > 3000) score -= 20;
    if (this.metrics.pageLoadTime > 3000) score -= 10;
    if (this.metrics.pageLoadTime > 5000) score -= 20;
    if ((this.metrics.cumulativeLayoutShift || 0) > 0.1) score -= 15;

    return Math.max(score, 0);
  }

  /**
   * Get performance rating
   */
  getRating(): 'excellent' | 'good' | 'fair' | 'poor' {
    const score = this.getScore();
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Optimize images with lazy loading and responsive sizes
 */
export function optimizeImageUrl(
  url: string,
  width?: number,
  quality?: number
): string {
  // This example uses Vercel Image Optimization
  // Adjust based on your image service
  if (!url.startsWith('http')) {
    return url;
  }

  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (quality) params.set('q', quality.toString());

  return `${url}?${params.toString()}`;
}

/**
 * Preload critical resources
 */
export function preloadResource(
  url: string,
  type: 'script' | 'style' | 'image' = 'script'
): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = type;
  link.href = url;

  if (type === 'image') {
    link.imagesrcset = url;
  }

  document.head.appendChild(link);
  console.log(`[Performance] Preloading ${type}: ${url}`);
}

/**
 * Prefetch resources for next navigation
 */
export function prefetchResource(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
  console.log(`[Performance] Prefetching: ${url}`);
}

/**
 * Defer non-critical scripts
 */
export function deferScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = () => {
      console.log(`[Performance] Loaded script: ${src}`);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export default performanceMonitor;
