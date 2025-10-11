"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import BottomNav from "./BottomNav"
import AuthWrapper from "./AuthWrapper"
import MusicPlayer from "./MusicPlayer"
import ModernApiStatusIndicator from "./ApiStatusIndicator"
import { useStore } from "@/lib/store"

interface ClientLayoutProps {
  children: React.ReactNode
}

function onIdle(cb: () => void, timeout = 1000) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    ;(window as any).requestIdleCallback(cb, { timeout })
  } else {
    setTimeout(cb, 0)
  }
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const { currentSong, checkApiStatus, fetchTrendingSongs } = useStore()

  useEffect(() => {
    setIsPageTransitioning(true)
    const timer = setTimeout(() => setIsPageTransitioning(false), 120)
    return () => clearTimeout(timer)
  }, [pathname])

  useEffect(() => {
    // Defer non-critical work to idle so splash doesn't feel long
    onIdle(() => {
      try {
        if (typeof checkApiStatus === "function") checkApiStatus()
      } catch (e) {
        console.warn("checkApiStatus failed", e)
      }
      // Stagger trending after a brief delay
      setTimeout(() => {
        try {
          if (typeof fetchTrendingSongs === "function") fetchTrendingSongs()
        } catch (e) {
          console.warn("fetchTrendingSongs failed", e)
        }
      }, 600)
    }, 800)
  }, [checkApiStatus, fetchTrendingSongs])

  return (
    <AuthWrapper>
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

      <MusicPlayer />
      <BottomNav />
    </AuthWrapper>
  )
}
