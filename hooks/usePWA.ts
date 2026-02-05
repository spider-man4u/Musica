'use client';

import { useEffect, useState } from 'react';
import { pwaManager, type PWAUpdateEvent } from '@/lib/pwa-utils';

export interface PWAState {
  isOnline: boolean;
  isSupported: boolean;
  updateAvailable: boolean;
  isInstallPromptAvailable: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
    updateAvailable: false,
    isInstallPromptAvailable: false,
  });

  useEffect(() => {
    // Initialize PWA manager
    pwaManager.init();

    // Handle online/offline
    const handleOnline = () => setState((s) => ({ ...s, isOnline: true }));
    const handleOffline = () => setState((s) => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle PWA updates
    const unsubscribe = pwaManager.onUpdate((event: PWAUpdateEvent) => {
      console.log('[Hook] PWA Update:', event.type);
      
      if (event.type === 'update-available') {
        setState((s) => ({ ...s, updateAvailable: true }));
      }

      if (event.type === 'update-activated') {
        setState((s) => ({ ...s, updateAvailable: false }));
      }
    });

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState((s) => ({ ...s, isInstallPromptAvailable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      unsubscribe();
      pwaManager.destroy();
    };
  }, []);

  return state;
}

export default usePWA;
