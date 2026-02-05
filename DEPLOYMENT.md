# Musica PWA - Deployment Guide

This guide covers deploying the Musica Progressive Web App (PWA) to production with all security, performance, and PWA features enabled.

## Pre-Deployment Checklist

### Security
- [ ] Review and update Content Security Policy in `next.config.mjs`
- [ ] Generate VAPID keys for push notifications (WebPush CLI)
- [ ] Set environment variables (see Environment Variables section)
- [ ] Enable HTTPS on all routes (auto with Vercel)
- [ ] Test CSRF protection with sample forms
- [ ] Review all API endpoints for proper authentication
- [ ] Enable rate limiting on API routes
- [ ] Test input sanitization on all forms

### PWA Features
- [ ] Generate PWA icons (192x192, 512x512, maskable)
- [ ] Test service worker installation
- [ ] Test offline functionality
- [ ] Test push notifications (with valid VAPID key)
- [ ] Test app installation prompt
- [ ] Verify web app manifest
- [ ] Test cache strategies

### Performance
- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Verify image optimization
- [ ] Check Core Web Vitals
  - [ ] First Contentful Paint (FCP) < 1.8s
  - [ ] Largest Contentful Paint (LCP) < 2.5s
  - [ ] Cumulative Layout Shift (CLS) < 0.1
  - [ ] First Input Delay (FID) < 100ms
- [ ] Enable gzip compression
- [ ] Verify caching headers

### Browser Compatibility
- [ ] Test on latest Chrome/Edge
- [ ] Test on Safari (iOS 15+)
- [ ] Test on Firefox
- [ ] Test on mobile browsers
- [ ] Test offline functionality on each browser

### API Integration
- [ ] Verify all API endpoints are configured
- [ ] Test push notification subscription endpoint
- [ ] Test metrics collection endpoint
- [ ] Set up background sync if needed

## Environment Variables

Create environment variables in your hosting platform:

```bash
# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=<your-analytics-id>

# API Configuration
NEXT_PUBLIC_API_URL=<your-api-url>
API_SECRET=<your-api-secret>

# Database (if using)
DATABASE_URL=<your-database-url>

# Authentication (if using)
AUTH_SECRET=<your-auth-secret>
```

### Generating VAPID Keys

Install web-push CLI:
```bash
npm install -g web-push
```

Generate keys:
```bash
web-push generate-vapid-keys

# Copy output to environment variables
```

## Deployment Steps

### 1. Vercel Deployment (Recommended)

```bash
# Connect GitHub repository
vercel

# Deploy
vercel deploy --prod
```

**Features included:**
- Automatic HTTPS
- Built-in image optimization
- CDN for global distribution
- Analytics included
- Edge middleware support

### 2. Self-Hosted Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Requirements:**
- Node.js 18+
- HTTPS certificate (use Let's Encrypt)
- Process manager (PM2, systemd)
- Reverse proxy (Nginx)

## Post-Deployment Verification

### 1. Test PWA Installation

- [ ] Visit app in browser
- [ ] Check for install prompt
- [ ] Install to home screen
- [ ] Launch from home screen
- [ ] Verify it opens in standalone mode

### 2. Test Service Worker

```javascript
// Open DevTools Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log(registrations);
});
```

- [ ] Service worker is registered
- [ ] Service worker is activated
- [ ] Cache is populated

### 3. Test Offline Functionality

- [ ] Open DevTools Network tab
- [ ] Set to "Offline" mode
- [ ] Navigate to different pages
- [ ] Verify offline page appears for new routes
- [ ] Verify cached pages load

### 4. Test Push Notifications

```javascript
// Subscribe to push notifications
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: '<your-public-key>'
      }).then(subscription => {
        console.log('Subscribed!', subscription);
      });
    });
  }
});
```

- [ ] Permission request appears
- [ ] Subscription is successful
- [ ] Test notification appears (send via API)

### 5. Run Lighthouse Audit

1. Open DevTools > Lighthouse
2. Audit PWA
3. Check for:
   - [ ] Web app manifest present
   - [ ] Service worker installed
   - [ ] HTTPS enabled
   - [ ] Offline support
   - [ ] Install prompt available

### 6. Performance Verification

```javascript
// Check performance metrics in console
window.addEventListener('load', () => {
  const metrics = performance.getEntriesByType('navigation')[0];
  console.log('Load time:', metrics.loadEventEnd - metrics.loadEventStart);
  console.log('FCP:', performance.getEntriesByName('first-contentful-paint')[0]);
});
```

- [ ] Page loads in < 3 seconds
- [ ] FCP < 1.8 seconds
- [ ] All images are optimized

## Monitoring

### Set Up Analytics

1. Enable Vercel Analytics (if using Vercel)
2. Implement custom metrics collection at `/api/metrics`
3. Monitor:
   - [ ] Service Worker errors
   - [ ] Failed API requests
   - [ ] Performance degradation
   - [ ] User engagement

### Error Tracking

Integrate error tracking service (Sentry, LogRocket, etc.):

```javascript
// In your layout or app shell
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Rollback Procedure

In case of issues after deployment:

1. **Service Worker Issue:**
   ```bash
   # Update service worker version in sw.js
   const CACHE_VERSION = 'musica-v2'; // Increment version
   ```

2. **Quick Rollback:**
   ```bash
   vercel rollback  # For Vercel
   ```

3. **Clear Caches:**
   - Visit `/offline` page which will clear all caches
   - Users can manually clear via browser DevTools

## Security Checklist

- [ ] HTTPS enforced
- [ ] CSP headers set correctly
- [ ] CORS properly configured
- [ ] API rate limiting enabled
- [ ] Input validation on all forms
- [ ] CSRF tokens implemented
- [ ] Sensitive data not cached
- [ ] Service worker script not cached

## Performance Optimization Tips

1. **Code Splitting:** Use dynamic imports for large components
2. **Image Optimization:** Use `OptimizedImage` component
3. **Font Optimization:** Use system fonts or self-host with preload
4. **Bundle Analysis:**
   ```bash
   ANALYZE=true npm run build
   ```
5. **Caching Strategy:** Review and optimize in `public/sw.js`

## Troubleshooting

### Service Worker Not Updating
- Clear site data in DevTools
- Increment `CACHE_VERSION` in `sw.js`
- Check `Cache-Control` headers for `sw.js`

### Offline Page Not Showing
- Verify `offline.html` exists in public folder
- Check service worker fetch event handling
- Test with DevTools offline mode

### Push Notifications Not Working
- Verify VAPID keys are correct
- Check notification permission status
- Verify subscription endpoint is working
- Check browser notification settings

### Performance Issues
- Run Lighthouse audit
- Check image sizes and formats
- Review Core Web Vitals
- Analyze bundle size with ANALYZE tool

## Support & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [MDN Web Docs](https://developer.mozilla.org/)

## Maintenance

- [ ] Monitor error logs weekly
- [ ] Update dependencies monthly
- [ ] Review analytics monthly
- [ ] Performance audit quarterly
- [ ] Security audit quarterly
- [ ] Update icons/brand assets as needed

---

For questions or issues, please refer to the project documentation or open an issue on GitHub.
