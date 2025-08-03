"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import BottomNav from "./BottomNav"
import AuthWrapper from "./AuthWrapper"
import MusicPlayer from "./MusicPlayer"
import ModernApiStatusIndicator from "./ApiStatusIndicator"
import PWAInstallPrompt from "./PWAInstallPrompt"
import PWAUpdatePrompt from "./PWAUpdatePrompt"
import OfflineIndicator from "./OfflineIndicator"
import { useStore } from "@/lib/store"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const { currentSong, checkApiStatus, fetchTrendingSongs } = useStore()

  useEffect(() => {
    setIsPageTransitioning(true)
    const timer = setTimeout(() => setIsPageTransitioning(false), 150)
    return () => clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    // Initialize modern APIs on app load with error handling
    const initializeApp = async () => {
      try {
        console.log("🚀 Initializing modern music app...")

        // Check if functions exist before calling them
        if (typeof checkApiStatus === "function") {
          await checkApiStatus()
        }

        if (typeof fetchTrendingSongs === "function") {
          await fetchTrendingSongs()
        }
      } catch (error) {
        console.error("Failed to initialize app:", error)
      }
    }

    initializeApp()
  }, [checkApiStatus, fetchTrendingSongs])

  return (
    <AuthWrapper>
      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <OfflineIndicator />

      {/* Modern API Status Indicator */}
      <ModernApiStatusIndicator />

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={currentSong ? "pb-32" : "pb-16"}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Music Player */}
      <MusicPlayer />

      {/* Bottom Navigation */}
      <BottomNav />
    </AuthWrapper>
  )
}
