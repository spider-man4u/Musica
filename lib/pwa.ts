"use client"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private isInstalled = false
  private installCallbacks: Array<(canInstall: boolean) => void> = []
  private updateCallbacks: Array<(hasUpdate: boolean) => void> = []
  private gtag: any

  constructor() {
    if (typeof window !== "undefined") {
      this.init()
    }
    this.gtag = (window as any).gtag
  }

  private init() {
    // Check if app is already installed
    this.checkInstallStatus()

    // Listen for install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("💾 PWA install prompt available")
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.notifyInstallCallbacks(true)
    })

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      console.log("✅ PWA installed successfully")
      this.isInstalled = true
      this.deferredPrompt = null
      this.notifyInstallCallbacks(false)
      this.trackInstallation()
    })

    // Register service worker
    this.registerServiceWorker()

    // Check for updates periodically
    setInterval(() => this.checkForUpdates(), 60000) // Check every minute
  }

  private async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")

        console.log("🔧 Service Worker registered:", registration.scope)

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          console.log("🔄 Service Worker update found")
          const newWorker = registration.installing

          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("📦 New content available")
                this.notifyUpdateCallbacks(true)
              }
            })
          }
        })

        // Handle controller change
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("🔄 Service Worker controller changed")
          window.location.reload()
        })

        return registration
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error)
      }
    }
  }

  private checkInstallStatus() {
    // Check if running as PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isInWebAppChrome = window.matchMedia("(display-mode: standalone)").matches

    this.isInstalled = isStandalone || isInWebAppiOS || isInWebAppChrome

    if (this.isInstalled) {
      console.log("📱 App is running as PWA")
    }
  }

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log("❌ Install prompt not available")
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice

      console.log("🤔 User choice:", choiceResult.outcome)

      if (choiceResult.outcome === "accepted") {
        this.deferredPrompt = null
        return true
      }

      return false
    } catch (error) {
      console.error("❌ Install failed:", error)
      return false
    }
  }

  canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled
  }

  isAppInstalled(): boolean {
    return this.isInstalled
  }

  onInstallAvailable(callback: (canInstall: boolean) => void) {
    this.installCallbacks.push(callback)
    // Immediately call with current state
    callback(this.canInstall())
  }

  onUpdateAvailable(callback: (hasUpdate: boolean) => void) {
    this.updateCallbacks.push(callback)
  }

  private notifyInstallCallbacks(canInstall: boolean) {
    this.installCallbacks.forEach((callback) => callback(canInstall))
  }

  private notifyUpdateCallbacks(hasUpdate: boolean) {
    this.updateCallbacks.forEach((callback) => callback(hasUpdate))
  }

  async checkForUpdates() {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
      }
    }
  }

  async skipWaiting() {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
      }
    }
  }

  private trackInstallation() {
    // Track PWA installation for analytics
    if (this.gtag) {
      this.gtag("event", "pwa_install", {
        event_category: "PWA",
        event_label: "App Installed",
      })
    }
  }

  // Offline detection
  isOnline(): boolean {
    return navigator.onLine
  }

  onConnectionChange(callback: (isOnline: boolean) => void) {
    window.addEventListener("online", () => callback(true))
    window.addEventListener("offline", () => callback(false))
    // Call immediately with current state
    callback(this.isOnline())
  }

  // Background sync
  async requestBackgroundSync(tag: string) {
    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(tag)
      console.log("🔄 Background sync registered:", tag)
    }
  }

  // Push notifications
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("❌ Notifications not supported")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission === "denied") {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("❌ Push notifications not supported")
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
      })

      console.log("📱 Push subscription created")
      return subscription
    } catch (error) {
      console.error("❌ Push subscription failed:", error)
      return null
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Cache management
  async clearCache() {
    if ("caches" in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      console.log("🗑️ All caches cleared")
    }
  }

  async getCacheSize(): Promise<number> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  }
}

// Singleton instance
export const pwaManager = new PWAManager()

// React hook for PWA functionality
export function usePWA() {
  const [canInstall, setCanInstall] = useState(false)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsInstalled(pwaManager.isAppInstalled())
    setIsOnline(pwaManager.isOnline())

    pwaManager.onInstallAvailable(setCanInstall)
    pwaManager.onUpdateAvailable(setHasUpdate)
    pwaManager.onConnectionChange(setIsOnline)
  }, [])

  return {
    canInstall,
    hasUpdate,
    isOnline,
    isInstalled,
    installApp: () => pwaManager.installApp(),
    skipWaiting: () => pwaManager.skipWaiting(),
    requestNotifications: () => pwaManager.requestNotificationPermission(),
    subscribeToPush: () => pwaManager.subscribeToPushNotifications(),
    clearCache: () => pwaManager.clearCache(),
    getCacheSize: () => pwaManager.getCacheSize(),
  }
}

// Import React hooks
import { useState, useEffect } from "react"
