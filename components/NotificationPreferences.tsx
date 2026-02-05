'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

interface NotificationPreferencesProps {
  vapidKey?: string;
  onSubscriptionChange?: (subscribed: boolean) => void;
}

export function NotificationPreferences({
  vapidKey,
  onSubscriptionChange,
}: NotificationPreferencesProps) {
  const [mounted, setMounted] = useState(false);
  const {
    isSupported,
    hasPermission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotifications(vapidKey);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isSupported) {
    return (
      <Card className="p-4 bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900 dark:text-yellow-300">
              Push Notifications Not Supported
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
              Your browser doesn't support push notifications.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleToggleNotifications = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        console.log('Notification permission denied');
        return;
      }
    }

    if (isSubscribed) {
      await unsubscribe();
      onSubscriptionChange?.(false);
    } else {
      const success = await subscribe();
      onSubscriptionChange?.(success);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 border border-purple-500/30 bg-purple-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="font-medium text-foreground">
                Push Notifications
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isSubscribed
                  ? 'You will receive notifications about new releases and updates'
                  : 'Get notified about new releases, playlist updates, and more'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleToggleNotifications}
            disabled={isLoading}
            variant={isSubscribed ? 'default' : 'outline'}
            className="ml-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSubscribed ? 'Enabled' : 'Enable'}
          </Button>
        </div>
      </Card>

      {/* Notification Types */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-3">
          Notification Types
        </h4>

        <div className="space-y-3">
          <NotificationTypeToggle
            label="New Releases"
            description="When artists you follow release new music"
            defaultChecked={true}
            disabled={!isSubscribed || isLoading}
          />
          <NotificationTypeToggle
            label="Playlist Updates"
            description="When playlists you follow get updated"
            defaultChecked={true}
            disabled={!isSubscribed || isLoading}
          />
          <NotificationTypeToggle
            label="Following Activity"
            description="When people you follow share songs"
            defaultChecked={false}
            disabled={!isSubscribed || isLoading}
          />
          <NotificationTypeToggle
            label="System Updates"
            description="Important app updates and features"
            defaultChecked={true}
            disabled={!isSubscribed || isLoading}
          />
        </div>
      </Card>

      {/* Status Information */}
      <Card className="p-4 bg-muted/50 text-sm text-muted-foreground">
        <p>
          {isSubscribed
            ? '✓ You are subscribed to push notifications'
            : 'Push notifications are disabled'}
        </p>
        <p className="mt-1">
          {!hasPermission &&
            'Grant permission in browser settings to enable notifications'}
        </p>
      </Card>
    </div>
  );
}

interface NotificationTypeToggleProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}

function NotificationTypeToggle({
  label,
  description,
  defaultChecked = false,
  disabled = false,
}: NotificationTypeToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={setChecked}
        disabled={disabled}
      />
    </div>
  );
}

export default NotificationPreferences;
