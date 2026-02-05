// Push Notifications Management for PWA

export interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  action?: string;
  url?: string;
  timestamp?: number;
}

class PushNotificationManager {
  private vapidKey: string = '';
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize push notification system
   */
  async init(vapidKey: string): Promise<void> {
    this.vapidKey = vapidKey;

    if (!this.isPushSupported()) {
      console.log('[Push] Push notifications not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log('[Push] Push notification manager initialized');
    } catch (error) {
      console.error('[Push] Failed to initialize:', error);
    }
  }

  /**
   * Request permission for notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isNotificationSupported()) {
      console.log('[Push] Notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[Push] Permission request result:', permission);
      return permission;
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.log('[Push] Service Worker not ready');
      return null;
    }

    if (!this.vapidKey) {
      console.log('[Push] VAPID key not configured');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey),
      });

      console.log('[Push] Subscribed successfully');

      // Send subscription to backend
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      return null;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[Push] Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (!subscription) {
      return false;
    }

    try {
      const success = await subscription.unsubscribe();
      console.log('[Push] Unsubscribed successfully');
      return success;
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Show local notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration) {
      console.log('[Push] Service Worker not ready');
      return;
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag || 'musica-notification',
        timestamp: payload.timestamp || Date.now(),
        requireInteraction: false,
        vibrate: [100, 50, 100],
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'close', title: 'Close' },
        ],
      });

      console.log('[Push] Notification shown:', payload.title);
    } catch (error) {
      console.error('[Push] Failed to show notification:', error);
    }
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      console.log('[Push] Subscription sent to server');
    } catch (error) {
      console.error('[Push] Failed to send subscription to server:', error);
    }
  }

  /**
   * Check if push notifications are supported
   */
  private isPushSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check if notifications are supported
   */
  private isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

export const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager;

/**
 * Notification types for music events
 */
export enum NotificationType {
  NewRelease = 'new-release',
  PlaylistUpdate = 'playlist-update',
  FollowingActivity = 'following-activity',
  SystemUpdate = 'system-update',
  OfflineWarning = 'offline-warning',
}

/**
 * Create notification for music event
 */
export function createMusicNotification(
  type: NotificationType,
  data: Record<string, any>
): NotificationPayload {
  const basePayload: NotificationPayload = {
    icon: '/icon-192x192.png',
    badge: '/favicon.ico',
  };

  switch (type) {
    case NotificationType.NewRelease:
      return {
        ...basePayload,
        title: 'New Release',
        body: `${data.artist} just released ${data.album}`,
        tag: 'new-release',
      };

    case NotificationType.PlaylistUpdate:
      return {
        ...basePayload,
        title: 'Playlist Updated',
        body: `${data.playlist} has new songs`,
        tag: 'playlist-update',
      };

    case NotificationType.FollowingActivity:
      return {
        ...basePayload,
        title: 'Following Activity',
        body: `${data.user} added a song to their playlist`,
        tag: 'following-activity',
      };

    case NotificationType.SystemUpdate:
      return {
        ...basePayload,
        title: 'Musica Update',
        body: 'New features available. Refresh to update.',
        tag: 'system-update',
      };

    case NotificationType.OfflineWarning:
      return {
        ...basePayload,
        title: 'Connection Lost',
        body: 'You are offline. Some features are limited.',
        tag: 'offline-warning',
      };

    default:
      return {
        ...basePayload,
        title: 'Musica',
        body: 'New notification',
      };
  }
}
