# Musica - Progressive Web App Implementation

A comprehensive Progressive Web App (PWA) built on the Musica music streaming platform with offline capabilities, push notifications, fast load times, and mobile-first design.

## What's Included

### Core PWA Features

✅ **Service Worker** (`/public/sw.js`)
- Intelligent caching strategies (Cache-First, Network-First, Stale-While-Revalidate)
- Automatic cache management and versioning
- Background sync support
- Push notification handling

✅ **Offline Support**
- Complete offline page at `/offline`
- Smart caching for images, API responses, and assets
- IndexedDB storage for large datasets
- Sync queue for offline actions

✅ **Push Notifications**
- VAPID key configuration
- Push notification subscription management
- Notification preferences UI
- Background sync for sync queue

✅ **App Installation**
- Install prompt component
- Web App Manifest configuration
- App shortcuts
- Share target support

✅ **Performance Optimization**
- Image optimization with responsive sizing
- Lazy loading of resources
- Performance monitoring
- Web Vitals tracking
- Preloading and prefetching

✅ **Security**
- Content Security Policy (CSP)
- HTTPS enforcement
- Input sanitization
- CSRF token protection
- Rate limiting
- Secure storage wrapper

### File Structure

```
project/
├── public/
│   ├── sw.js                      # Service Worker
│   ├── offline.html               # Offline fallback
│   └── manifest.json              # Web App Manifest
├── app/
│   ├── offline/page.tsx           # Offline page
│   ├── api/
│   │   ├── push/subscribe/route.ts
│   │   └── metrics/route.ts
│   └── layout.tsx                 # PWA initialization
├── lib/
│   ├── pwa-utils.ts               # PWA manager & utilities
│   ├── cache-utils.ts             # Caching & IndexedDB
│   ├── push-notifications.ts      # Push notification manager
│   ├── performance.ts             # Performance monitoring
│   └── security.ts                # Security utilities
├── hooks/
│   ├── usePWA.ts                  # PWA state hook
│   ├── useOfflineStorage.ts       # Offline storage hook
│   ├── usePushNotifications.ts    # Push notifications hook
│   └── useResourceLoader.ts       # Resource loading hook
├── components/
│   ├── NetworkStatus.tsx          # Network status indicator
│   ├── InstallPrompt.tsx          # App install prompt
│   ├── AppUpdateNotification.tsx  # Update notification
│   ├── AppShell.tsx               # App shell container
│   ├── NotificationPreferences.tsx # Notification settings
│   └── OptimizedImage.tsx         # Optimized image component
├── DEPLOYMENT.md                  # Deployment guide
├── PWA_GUIDE.md                   # Feature guide
└── next.config.mjs                # PWA configuration
```

## Quick Start

### 1. Initialize PWA

The PWA is automatically initialized in `app/layout.tsx`. No additional setup needed for basic features.

### 2. Setup Push Notifications

```bash
# Install web-push CLI
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Add to environment variables:
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
# VAPID_PRIVATE_KEY=<private-key>
```

### 3. Generate Icons

Create PWA icons (192x192px, 512x512px, maskable format) and add to `/public`:
- `icon-192x192.png`
- `icon-512x512.png`
- `icon-144x144.png` (optional)
- `icon-96x96.png` (optional)

### 4. Test Locally

```bash
# Build production version
npm run build

# Start production server
npm start

# Open https://localhost:3000 (HTTPS required for PWA)
# Use self-signed certificate or ngrok for testing
```

## Usage Examples

### Offline Storage

```typescript
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

function MyComponent() {
  const { data, save, load, isOffline } = useOfflineStorage('music', 'playlist');

  return (
    <>
      {isOffline && <p>Working offline</p>}
      <button onClick={() => load()}>Load</button>
      <button onClick={() => save(newData)}>Save</button>
    </>
  );
}
```

### Push Notifications

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function NotificationToggle() {
  const { isSubscribed, subscribe, unsubscribe } = usePushNotifications(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );

  return (
    <button onClick={isSubscribed ? unsubscribe : subscribe}>
      {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
    </button>
  );
}
```

### Network Status

```typescript
import { NetworkStatus, OfflineIndicator } from '@/components/NetworkStatus';
import { usePWA } from '@/hooks/usePWA';

function App() {
  const { isOnline } = usePWA();

  return (
    <>
      <NetworkStatus />
      <OfflineIndicator />
      {!isOnline && <p>You are offline</p>}
    </>
  );
}
```

### Image Optimization

```typescript
import { OptimizedImage, AlbumArt } from '@/components/OptimizedImage';

function Album() {
  return (
    <AlbumArt
      src="https://example.com/album.jpg"
      alt="Album"
      size={300}
      quality={85}
    />
  );
}
```

### Performance Monitoring

```typescript
import { performanceMonitor } from '@/lib/performance';

useEffect(() => {
  performanceMonitor.collectMetrics().then(metrics => {
    console.log('Load time:', metrics.pageLoadTime);
    performanceMonitor.reportMetrics(); // Send to server
  });
}, []);
```

## Configuration

### Service Worker Caching

Edit `/public/sw.js`:

```javascript
const CACHE_VERSION = 'musica-v1'; // Increment to clear caches
const CRITICAL_ASSETS = [
  '/',
  '/globals.css',
  // Add critical assets to cache on install
];
```

### Security Headers

Edit `next.config.mjs` to customize:
- Content Security Policy
- CORS headers
- X-Frame-Options
- Other security headers

### Manifest

Edit `/public/manifest.json` to customize:
- App name and short name
- Colors and theme
- App shortcuts
- Share target
- Categories

## Testing

### Service Worker Status

```javascript
// In DevTools Console
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => console.log(reg)))
```

### Offline Mode

1. DevTools → Network
2. Set to "Offline"
3. Navigate around app
4. Verify offline page appears

### Performance Audit

1. DevTools → Lighthouse
2. Run PWA audit
3. Target scores: 90+

### Push Notifications

```javascript
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    new Notification('Test', { body: 'Notification works!' })
  }
})
```

## Deployment

### Vercel (Recommended)

```bash
vercel deploy --prod
```

Features included:
- Automatic HTTPS
- CDN with edge caching
- Image optimization
- Built-in analytics
- Zero-downtime deployments

### Self-Hosted

```bash
npm run build
npm start
```

Requirements:
- Node.js 18+
- HTTPS certificate
- Process manager (PM2)
- Reverse proxy (Nginx)

See `DEPLOYMENT.md` for detailed instructions.

## Performance Metrics

Target Web Vitals:
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **First Input Delay (FID):** < 100ms

Current optimizations:
- Image compression (WebP, AVIF)
- Code splitting
- Lazy loading
- Intelligent caching
- Service Worker optimization

## Security

### Best Practices Implemented

- HTTPS enforcement
- Content Security Policy
- Input sanitization
- CSRF protection
- Rate limiting
- Secure storage
- X-Frame-Options
- X-Content-Type-Options

### Secure Data Handling

```typescript
import { secureStorage } from '@/lib/security';

// Store sensitive data
secureStorage.setItem('token', authToken);

// Retrieve
const token = secureStorage.getItem('token');

// Clear
secureStorage.removeItem('token');
```

## Troubleshooting

### Service Worker Not Installing
- Verify HTTPS is enabled
- Clear site data: DevTools → Application → Clear storage
- Check browser console for errors

### Offline Not Working
- Verify service worker is registered
- Check DevTools Application → Service Workers
- Verify fetch event in service worker

### Push Notifications Not Working
- Confirm VAPID keys are correct
- Check notification permission is granted
- Verify subscription endpoint is working

### Performance Issues
- Run Lighthouse audit
- Check image sizes
- Review Core Web Vitals
- Analyze bundle size

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | All PWA features |
| Edge | ✅ Full | All PWA features |
| Firefox | ✅ Full | All PWA features |
| Safari | ✅ Partial | iOS 15+, limited features |
| Samsung Internet | ✅ Full | All PWA features |
| Opera | ✅ Full | All PWA features |

## Monitoring

### Error Tracking

Integrate Sentry or similar:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Analytics

Track Core Web Vitals:

```typescript
import { performanceMonitor } from '@/lib/performance';

performanceMonitor.reportMetrics();
```

### Service Worker Errors

Monitor in DevTools Application tab.

## Documentation

- **PWA_GUIDE.md** - Detailed feature guide
- **DEPLOYMENT.md** - Deployment and production checklist
- **next.config.mjs** - Configuration and security headers
- **Public/sw.js** - Service Worker implementation

## Resources

- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Next.js Documentation](https://nextjs.org/docs)
- [Web Vitals](https://web.dev/vitals/)

## Future Enhancements

- [ ] Service Worker streaming for large files
- [ ] Advanced analytics dashboard
- [ ] A/B testing framework
- [ ] Machine learning recommendations
- [ ] Advanced offline sync strategies
- [ ] P2P data sharing
- [ ] Advanced caching policies

## License

This PWA implementation is part of the Musica project.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review PWA_GUIDE.md and DEPLOYMENT.md
3. Open an issue on GitHub
4. Contact the team

---

**Status:** Production Ready

**Last Updated:** 2026

**Version:** 1.0.0
