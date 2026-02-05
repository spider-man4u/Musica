import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./components/ClientLayout"
import ErrorBoundary from "./components/ErrorBoundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Musica - Your Music Companion",
  description: "Discover, play, and enjoy music with mood-based recommendations. Works offline with push notifications.",
  keywords: ["music", "streaming", "playlist", "songs", "audio", "live", "api", "pwa", "offline"],
  authors: [{ name: "Ali Sheikh" }],
  creator: "Ali Sheikh",
  publisher: "Musica",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Musica",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Musica - Your Music Companion",
    description: "Discover, play, and enjoy music with mood-based recommendations",
    type: "website",
    locale: "en_US",
  },
  generator: "v0.dev",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#1a1a2e",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Musica" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                  .then(() => console.log('[PWA] Service Worker registered'))
                  .catch(err => console.error('[PWA] Service Worker registration failed:', err));
              }
            `,
          }}
        />

        {/* Offline page fallback */}
        <meta name="offline-page" content="/offline.html" />
      </head>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ErrorBoundary>
          <ClientLayout>{children}</ClientLayout>
        </ErrorBoundary>
      </body>
    </html>
  )
}
