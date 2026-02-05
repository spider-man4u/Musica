// PWA Utilities - Service Worker Registration & Management

export interface PWAUpdateEvent {
  type: 'update-available' | 'update-activated' | 'offline' | 'online';
  message?: string;
}

class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(event: PWAUpdateEvent) => void> = new Set();

  /**
   * Initialize PWA - Register service worker and setup listeners
   */
  async init(): Promise<void> {
    if (!this.isServiceWorkerSupported()) {
      console.log('[PWA] Service Workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        this.handleUpdateFound();
      });

      // Check for updates periodically
      this.startUpdateCheck();

      // Handle online/offline events
      window.addEventListener('online', () => this.notifyListeners({ type: 'online' }));
      window.addEventListener('offline', () => this.notifyListeners({ type: 'offline' }));
    } catch (error) {
      console.error('[PWA] Failed to register Service Worker:', error);
    }
  }

  /**
   * Handle update found
   */
  private handleUpdateFound(): void {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'activated') {
        this.notifyListeners({
          type: 'update-activated',
          message: 'App updated successfully',
        });
        // Optionally reload the page
        window.location.reload();
      }
    });

    this.notifyListeners({
      type: 'update-available',
      message: 'New version available. Update now?',
    });
  }

  /**
   * Start periodic update check
   */
  private startUpdateCheck(): void {
    // Check for updates every hour
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, 60 * 60 * 1000);
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('[PWA] Update check completed');
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPushPermission(): Promise<boolean> {
    if (!this.isNotificationSupported()) {
      console.log('[PWA] Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[PWA] Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(vapidKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.log('[PWA] Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey),
      });

      console.log('[PWA] Subscribed to push notifications:', subscription);
      return subscription;
    } catch (error) {
      console.error('[PWA] Failed to subscribe to push:', error);
      return null;
    }
  }

  /**
   * Get push subscription
   */
  async getPushSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) return null;

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[PWA] Failed to get push subscription:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    const subscription = await this.getPushSubscription();
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      console.log('[PWA] Unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('[PWA] Failed to unsubscribe from push:', error);
      return false;
    }
  }

  /**
   * Show notification
   */
  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.registration) {
      console.log('[PWA] Service Worker not registered');
      return;
    }

    try {
      await this.registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/favicon.ico',
        tag: 'musica-notification',
        ...options,
      });
    } catch (error) {
      console.error('[PWA] Failed to show notification:', error);
    }
  }

  /**
   * Request background sync
   */
  async requestBackgroundSync(tag: string): Promise<boolean> {
    if (!this.isBackgroundSyncSupported()) {
      console.log('[PWA] Background Sync not supported');
      return false;
    }

    if (!this.registration) {
      console.log('[PWA] Service Worker not registered');
      return false;
    }

    try {
      await this.registration.sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Failed to register background sync:', error);
      return false;
    }
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (!this.registration) {
      console.log('[PWA] Service Worker not registered');
      return;
    }

    try {
      const channel = new MessageChannel();
      this.registration.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );

      channel.port1.onmessage = () => {
        console.log('[PWA] All caches cleared');
      };
    } catch (error) {
      console.error('[PWA] Failed to clear cache:', error);
    }
  }

  /**
   * Add update listener
   */
  onUpdate(callback: (event: PWAUpdateEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(event: PWAUpdateEvent): void {
    this.listeners.forEach((callback) => callback(event));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }
    this.listeners.clear();
  }

  // ===== Private Helpers =====

  private isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  private isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  private isBackgroundSyncSupported(): boolean {
    return 'sync' in ServiceWorkerRegistration.prototype;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

export default pwaManager;
