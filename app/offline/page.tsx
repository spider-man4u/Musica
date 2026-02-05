'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Download,
  Music,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to home when back online
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    window.location.reload();
  };

  if (isOnline) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center p-8 space-y-4">
          <div className="flex justify-center">
            <Wifi className="w-12 h-12 text-emerald-500 animate-bounce" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Back Online!</h1>
          <p className="text-muted-foreground">
            Reconnecting to Musica...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-background/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">You're Offline</h1>
          <p className="text-muted-foreground">
            Musica needs an internet connection to stream music. Don't worry,
            we've got your back!
          </p>
        </div>

        {/* Status Card */}
        <Card className="p-4 bg-muted/50 border border-muted-foreground/10">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Connection Status</p>
              <p className="mt-1">No internet connection detected</p>
            </div>
          </div>
        </Card>

        {/* Features Available Offline */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">
            What You Can Still Do
          </h3>
          <div className="space-y-2">
            <OfflineFeature
              icon={<Music className="w-4 h-4" />}
              title="Play Cached Music"
              description="Listen to songs you've already played"
            />
            <OfflineFeature
              icon={<Download className="w-4 h-4" />}
              title="View Downloads"
              description="Access your saved offline playlists"
            />
            <OfflineFeature
              icon={<Activity className="w-4 h-4" />}
              title="Browse Library"
              description="View your playlists and favorites"
            />
          </div>
        </Card>

        {/* Tips Card */}
        <Card className="p-4 bg-blue-500/5 border border-blue-500/30">
          <h4 className="font-medium text-foreground mb-2">Pro Tip</h4>
          <p className="text-sm text-muted-foreground">
            Download your favorite playlists when online so you can enjoy them
            anytime, anywhere!
          </p>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again (Attempt {retryCount + 1})
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/library'}
          >
            <Music className="w-4 h-4 mr-2" />
            Go to Library
          </Button>
        </div>

        {/* Auto-reconnect info */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Musica will automatically reconnect when your internet returns
        </p>
      </div>
    </main>
  );
}

interface OfflineFeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function OfflineFeature({
  icon,
  title,
  description,
}: OfflineFeatureProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 text-purple-500 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
