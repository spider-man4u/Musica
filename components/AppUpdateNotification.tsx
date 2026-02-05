'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pwaManager } from '@/lib/pwa-utils';

interface AppUpdateNotificationProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export function AppUpdateNotification({
  onUpdate,
  onDismiss,
}: AppUpdateNotificationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    pwaManager.init();

    const handleUpdate = (event: any) => {
      if (event.type === 'update-available') {
        setUpdateAvailable(true);
        console.log('[AppUpdate] Update available');
      }
    };

    const unsubscribe = pwaManager.onUpdate(handleUpdate);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdate = () => {
    // Reload the page to apply the update
    window.location.reload();
    onUpdate?.();
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    onDismiss?.();
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 animate-in fade-in slide-in-from-top-4">
      <div className="mx-4 mt-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-white animate-spin" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                App Update Available
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                A new version of Musica is ready to install
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Update Now
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppUpdateNotification;
