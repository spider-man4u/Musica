"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, Wifi } from "lucide-react"
import { usePWA } from "@/lib/pwa"

export default function OfflineIndicator() {
  const { isOnline } = usePWA()
  const [showOffline, setShowOffline] = useState(false)
  const [showOnline, setShowOnline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true)
      setShowOnline(false)
    } else {
      setShowOffline(false)
      // Show "back online" message briefly
      if (showOffline) {
        setShowOnline(true)
        const timer = setTimeout(() => setShowOnline(false), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [isOnline, showOffline])

  return (
    <AnimatePresence>
      {(showOffline || showOnline) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 left-4 right-4 z-40"
        >
          <div
            className={`mx-auto max-w-sm rounded-lg p-3 text-white text-center ${
              showOffline
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-gradient-to-r from-green-500 to-blue-500"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {showOffline ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">You're offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">Back online!</span>
                </>
              )}
            </div>
            {showOffline && <p className="text-xs text-white/80 mt-1">Cached content available</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
