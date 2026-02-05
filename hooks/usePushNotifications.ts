'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  pushNotificationManager,
  type NotificationPayload,
} from '@/lib/push-notifications';

export interface PushNotificationState {
  isSupported: boolean;
  hasPermission: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
}

export function usePushNotifications(vapidKey?: string) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    hasPermission: false,
    isSubscribed: false,
    isLoading: false,
  });

  // Initialize push notification manager
  useEffect(() => {
    if (!vapidKey) {
      console.log('[usePushNotifications] VAPID key not provided');
      return;
    }

    pushNotificationManager.init(vapidKey);

    // Check current state
    const checkState = async () => {
      const permission =
        Notification.permission === 'granted';
      const subscription =
        await pushNotificationManager.getSubscription();

      setState({
        isSupported: true,
        hasPermission: permission,
        isSubscribed: !!subscription,
        isLoading: false,
      });
    };

    checkState();
  }, [vapidKey]);

  // Request permission
  const requestPermission = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));

    try {
      const permission =
        await pushNotificationManager.requestPermission();
      const hasPermission = permission === 'granted';

      setState((s) => ({
        ...s,
        hasPermission,
        isLoading: false,
      }));

      return hasPermission;
    } catch (error) {
      console.error('[usePushNotifications] Permission request failed:', error);
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));

    try {
      const subscription = await pushNotificationManager.subscribe();
      const isSubscribed = !!subscription;

      setState((s) => ({
        ...s,
        isSubscribed,
        isLoading: false,
      }));

      return isSubscribed;
    } catch (error) {
      console.error('[usePushNotifications] Subscription failed:', error);
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));

    try {
      const success = await pushNotificationManager.unsubscribe();

      setState((s) => ({
        ...s,
        isSubscribed: !success,
        isLoading: false,
      }));

      return success;
    } catch (error) {
      console.error('[usePushNotifications] Unsubscribe failed:', error);
      setState((s) => ({ ...s, isLoading: false }));
      return false;
    }
  }, []);

  // Show notification
  const showNotification = useCallback(
    async (payload: NotificationPayload) => {
      try {
        await pushNotificationManager.showNotification(payload);
      } catch (error) {
        console.error('[usePushNotifications] Show notification failed:', error);
      }
    },
    []
  );

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
}

export default usePushNotifications;
