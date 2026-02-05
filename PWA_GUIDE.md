# Musica PWA - Feature Guide

This guide explains all Progressive Web App features and how to use them in your application.

## Table of Contents

1. [Service Workers](#service-workers)
2. [Offline Support](#offline-support)
3. [Push Notifications](#push-notifications)
4. [App Installation](#app-installation)
5. [Caching Strategies](#caching-strategies)
6. [Performance Optimization](#performance-optimization)
7. [Security](#security)
8. [Development & Testing](#development--testing)

## Service Workers

Service Workers are scripts that run in the background, enabling offline functionality and push notifications.

### Configuration

The service worker is configured in `/public/sw.js` with:

- **CACHE_VERSION**: Version identifier for caches
- **RUNTIME_CACHE**: Cache for HTML/CSS/JS
- **IMAGE_CACHE**: Cache for images
- **API_CACHE**: Cache for API responses
- **CRITICAL_ASSETS**: Files cached on installation

### Registering Service Worker

The service worker is automatically registered in `app/layout.tsx`:

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### Manual Registration

For custom registration:

```typescript
import { pwaManager } from '@/lib/pwa-utils';

// Initialize PWA manager
await pwaManager.init();
```

## Offline Support

The app supports offline functionality through intelligent caching strategies.

### Offline Strategies

1. **Cache First** (Images)
   - Returns cached version if available
   - Falls back to network
   - Good for images, fonts

2. **Network First** (API)
   - Tries network first
   - Falls back to cache
   - Good for API requests

3. **Stale While Revalidate** (HTML/CSS/JS)
   - Returns cached version immediately
   - Updates in background
   - Best UX for static assets

### Offline Fallback Page

When offline, users see `/offline` page with:
- Offline status indicator
- Available features
- Retry options
- Auto-reconnect detection

### Using IndexedDB for Offline Storage

```typescript
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

function MyComponent() {
  const { data, save, load, isOffline } = useOfflineStorage('music', 'favorites');

  useEffect(() => {
    load(); // Load saved data
  }, []);

  const handleSave = async () => {
    await save(newData);
  };

  return (
    <div>
      {isOffline && <p>You are offline</p>}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

## Push Notifications

Real-time notifications keep users engaged with new features.

### Setup

1. **Generate VAPID Keys:**
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   ```

2. **Set Environment Variables:**
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
   VAPID_PRIVATE_KEY=<your-private-key>
   ```

### Request Permission

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function NotificationSettings() {
  const { requestPermission, subscribe } = usePushNotifications(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribe();
    }
  };

  return <button onClick={handleEnable}>Enable Notifications</button>;
}
```

### Showing Notifications

```typescript
import { pwaManager } from '@/lib/pwa-utils';

// Show notification
await pwaManager.showNotification('Hello!', {
  body: 'This is a notification',
  icon: '/icon-192x192.png',
});
```

### Sending from Backend

```typescript
// Example: API route to send notifications
import webpush from 'web-push';

export async function POST(request: Request) {
  const subscription = await request.json();

  await webpush.sendNotification(subscription, JSON.stringify({
    title: 'New Release',
    body: 'Check out the latest music',
  }));
}
```

## App Installation

Users can install Musica as a native-like app on their device.

### Install Prompt

The install prompt appears automatically on eligible devices. Customize with:

```typescript
import { InstallPrompt } from '@/components/InstallPrompt';

function App() {
  return (
    <InstallPrompt
      onInstall={() => console.log('App installed!')}
      onDismiss={() => console.log('Install dismissed')}
    />
  );
}
```

### Web App Manifest

Configured in `/public/manifest.json`:

```json
{
  "name": "Musica - Your Music Companion",
  "short_name": "Musica",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### Installation on Different Platforms

**Desktop:**
- Chrome: Click install button in address bar
- Edge: Click install button in address bar

**iOS:**
- Safari: Tap Share → Add to Home Screen

**Android:**
- Chrome: Tap install prompt (auto-shown)
- Firefox: Add shortcut option in menu

## Caching Strategies

### Memory Cache

Quick in-memory caching:

```typescript
import { cacheManager } from '@/lib/cache-utils';

// Set cache
cacheManager.set('music', 'popular-songs', songsData, 1000 * 60 * 60);

// Get cache
const songs = cacheManager.get('music', 'popular-songs');

// Check if exists
if (cacheManager.has('music', 'popular-songs')) {
  // Use cached data
}
```

### IndexedDB (Larger Data)

Persistent storage for large datasets:

```typescript
import { indexedDBManager } from '@/lib/cache-utils';

// Initialize
await indexedDBManager.init();

// Store
await indexedDBManager.set('playlists', {
  id: 'my-playlist',
  name: 'Favorites',
  songs: [...]
});

// Retrieve
const playlist = await indexedDBManager.get('playlists', 'my-playlist');

// Get all
const all = await indexedDBManager.getAll('playlists');
```

### Service Worker Cache

Automatic caching via service worker - no code needed! Configured in `sw.js`.

## Performance Optimization

### Image Optimization

Use the `OptimizedImage` component:

```typescript
import { OptimizedImage, AlbumArt } from '@/components/OptimizedImage';

function Album() {
  return (
    <AlbumArt
      src="https://example.com/album.jpg"
      alt="Album Cover"
      size={200}
      quality={85}
    />
  );
}
```

### Performance Monitoring

```typescript
import { performanceMonitor } from '@/lib/performance';

// Collect metrics
const metrics = await performanceMonitor.collectMetrics();
console.log('Page load:', metrics.pageLoadTime);

// Report to server
await performanceMonitor.reportMetrics();

// Get performance score
const score = performanceMonitor.getScore(); // 0-100
const rating = performanceMonitor.getRating(); // excellent/good/fair/poor
```

### Resource Loading

```typescript
import { usePreloadResource, usePrefetchResource } from '@/hooks/useResourceLoader';

function Component() {
  // Preload critical resource
  usePreloadResource('/api/data', 'script');

  // Prefetch next page resource
  usePrefetchResource('/page2');
}
```

## Security

### Input Sanitization

```typescript
import { sanitizeInput, isValidURL } from '@/lib/security';

// Sanitize user input
const clean = sanitizeInput(userInput);

// Validate URLs
if (isValidURL(url)) {
  // Safe to use
}
```

### CSRF Protection

```typescript
import { generateCSRFToken, getCSRFToken } from '@/lib/security';

// Generate token
const token = generateCSRFToken();

// Store token
setCSRFToken(token);

// Validate token
if (validateCSRFToken(formToken)) {
  // Safe to process
}
```

### Rate Limiting

```typescript
import { rateLimiter } from '@/lib/security';

// Check if request is allowed
if (rateLimiter.isAllowed('user-123')) {
  // Process request
}
```

### Secure Storage

```typescript
import { secureStorage } from '@/lib/security';

// Store sensitive data
secureStorage.setItem('auth-token', token);

// Retrieve data
const token = secureStorage.getItem('auth-token');

// Remove data
secureStorage.removeItem('auth-token');
```

## Development & Testing

### Testing Offline

1. Open DevTools > Network
2. Set throttling to "Offline"
3. Navigate around app
4. Verify offline page appears for new routes

### Testing Service Worker

```javascript
// In DevTools Console:

// Check registration
navigator.serviceWorker.getRegistrations()

// Check active service worker
navigator.serviceWorker.controller

// Send message to service worker
navigator.serviceWorker.controller.postMessage({
  type: 'GET_VERSION'
})
```

### Testing Push Notifications

```javascript
// Request permission
Notification.requestPermission()

// Show local notification
new Notification('Test', {
  body: 'This is a test notification',
  icon: '/icon-192x192.png'
})
```

### Testing Caching

1. Open DevTools > Application > Cache Storage
2. Verify cache entries
3. Check cache versions
4. Monitor cache size

### Lighthouse Audit

1. Open DevTools > Lighthouse
2. Audit PWA
3. Check scores:
   - Performance: > 90
   - Accessibility: > 90
   - Best Practices: > 90
   - PWA: All checks passed

### Browser DevTools

**Chrome:**
- Application > Service Workers
- Application > Cache Storage
- Application > Manifest
- Network tab (offline simulation)
- Lighthouse (PWA audit)

## Best Practices

1. **Always use HTTPS** - PWA features require HTTPS
2. **Implement offline fallback** - Provide useful content offline
3. **Cache wisely** - Don't cache sensitive data
4. **Monitor performance** - Use web vitals
5. **Test regularly** - Test across devices and browsers
6. **Keep SW updated** - Implement update strategies
7. **Secure sensitive data** - Use secureStorage
8. **Optimize images** - Use OptimizedImage component

## Troubleshooting

### Service Worker Not Installing
- Check HTTPS is enabled
- Clear site data in DevTools
- Check browser console for errors

### Offline Not Working
- Verify service worker is active
- Check cache entries in DevTools
- Verify fetch event handling

### Push Notifications Not Working
- Check VAPID keys are correct
- Verify notification permission granted
- Check subscription endpoint response

### Performance Issues
- Run Lighthouse audit
- Check image sizes
- Review Core Web Vitals
- Monitor bundle size

---

For more information, visit:
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Next.js Documentation](https://nextjs.org/docs)
