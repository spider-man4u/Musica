'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { OfflineIndicator } from '@/components/NetworkStatus';
import InstallPrompt from '@/components/InstallPrompt';
import AppUpdateNotification from '@/components/AppUpdateNotification';
import { Skeleton } from '@/components/ui/skeleton';

interface AppShellProps {
  children: React.ReactNode;
  showOfflineIndicator?: boolean;
  showInstallPrompt?: boolean;
  showUpdateNotification?: boolean;
}

export function AppShell({
  children,
  showOfflineIndicator = true,
  showInstallPrompt = true,
  showUpdateNotification = true,
}: AppShellProps) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Simulate app shell loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Global Status Indicators */}
      {showOfflineIndicator && (
        <div className="sticky top-0 z-40">
          <OfflineIndicator />
        </div>
      )}

      {/* App Update Notification */}
      {showUpdateNotification && <AppUpdateNotification />}

      {/* Install Prompt */}
      {showInstallPrompt && <InstallPrompt />}

      {/* Main Content */}
      <div className="flex-1 relative">
        {isLoading ? (
          <AppShellSkeleton />
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 px-4 py-6 text-center text-xs text-muted-foreground">
        <p>Musica - Your Music Companion</p>
      </footer>
    </div>
  );
}

/**
 * App Shell Loading Skeleton
 */
function AppShellSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Fallback Shell for Error Boundaries
 */
export function ErrorShell() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-foreground">
          Something Went Wrong
        </h1>
        <p className="text-muted-foreground">
          We're sorry for the inconvenience. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export default AppShell;
