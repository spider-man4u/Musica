"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, X } from "lucide-react"
import { usePWA } from "@/lib/pwa"

export default function PWAUpdatePrompt() {
  const { hasUpdate, skipWaiting } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (hasUpdate) {
      setShowPrompt(true)
    }
  }, [hasUpdate])

  const handleUpdate = async () => {
    await skipWaiting()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
        >
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">Update Available</p>
                  <p className="text-white/80 text-xs">New features and improvements</p>
                </div>
              </div>
              <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-white text-green-600 font-semibold py-2 px-3 rounded-lg text-sm hover:bg-white/90 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-white/80 hover:text-white transition-colors text-sm"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
