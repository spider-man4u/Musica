"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X, Smartphone, Monitor, Zap } from "lucide-react"
import { usePWA } from "@/lib/pwa"

export default function PWAInstallPrompt() {
  const { canInstall, installApp, isInstalled } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const isDismissed = localStorage.getItem("pwa-install-dismissed") === "true"
    setDismissed(isDismissed)

    // Show prompt after a delay if can install and not dismissed
    if (canInstall && !isDismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled])

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!canInstall || isInstalled || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleDismiss}
          />

          {/* Install Prompt */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          >
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-2xl border border-white/20">
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Install Musica</h3>
                  <p className="text-white/80 text-sm">Get the full app experience</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Lightning fast performance</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Smartphone className="w-4 h-4 text-green-300" />
                  <span>Works offline</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Monitor className="w-4 h-4 text-blue-300" />
                  <span>Native app experience</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-white text-purple-600 font-semibold py-3 px-4 rounded-xl hover:bg-white/90 transition-colors"
                >
                  Install App
                </button>
                <button onClick={handleDismiss} className="px-4 py-3 text-white/80 hover:text-white transition-colors">
                  Not now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
