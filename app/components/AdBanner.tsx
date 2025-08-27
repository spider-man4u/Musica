"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

interface AdBannerProps {
  variant?: "banner" | "inline" | "sticky"
  className?: string
  showCloseButton?: boolean
}

export default function AdBanner({ variant = "banner", className = "", showCloseButton = false }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadAd = async () => {
      try {
        // Set up ad options
        if (typeof window !== "undefined") {
          ;(window as any).atOptions = {
            key: "98a0e0e8fc5b3f5270ede29c571d2386",
            format: "iframe",
            height: 50,
            width: 320,
            params: {},
          }

          // Create and load the ad script
          const script = document.createElement("script")
          script.type = "text/javascript"
          script.src = "//www.highperformanceformat.com/98a0e0e8fc5b3f5270ede29c571d2386/invoke.js"
          script.async = true

          script.onload = () => {
            setIsLoaded(true)
            setError(false)
          }

          script.onerror = () => {
            setError(true)
            setIsLoaded(false)
          }

          if (adRef.current) {
            adRef.current.appendChild(script)
          }
        }
      } catch (err) {
        setError(true)
        setIsLoaded(false)
      }
    }

    loadAd()
  }, [])

  if (!isVisible) return null

  const getVariantStyles = () => {
    switch (variant) {
      case "sticky":
        return "fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 shadow-2xl"
      case "inline":
        return "my-4 mx-auto"
      default:
        return "my-6 mx-auto"
    }
  }

  return (
    <div className={`relative ${getVariantStyles()} ${className}`}>
      <div className="glass rounded-lg p-4 max-w-sm mx-auto relative overflow-hidden">
        {/* Close button for sticky ads */}
        {showCloseButton && (
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            aria-label="Close ad"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}

        {/* Loading state */}
        {!isLoaded && !error && (
          <div className="flex items-center justify-center h-12 w-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded animate-pulse">
            <div className="text-sm text-white/60">Loading ad...</div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center h-12 w-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded">
            <div className="text-sm text-white/60">🎵 Support Musica</div>
          </div>
        )}

        {/* Ad container */}
        <div
          ref={adRef}
          className={`flex justify-center items-center ${!isLoaded ? "hidden" : ""}`}
          style={{ minHeight: "50px", minWidth: "320px" }}
        />

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-50" />
      </div>
    </div>
  )
}
