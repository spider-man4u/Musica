"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import BottomNav from "./BottomNav"
import AuthWrapper from "./AuthWrapper"
import MusicPlayer from "./MusicPlayer"
import { useStore } from "@/lib/store"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const { currentSong } = useStore()

  useEffect(() => {
    setIsPageTransitioning(true)
    const timer = setTimeout(() => setIsPageTransitioning(false), 150)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <AuthWrapper>
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={currentSong ? "pb-32" : "pb-16"} // Dynamic padding based on player state
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Music Player - renders above navigation */}
      <MusicPlayer />

      {/* Bottom Navigation */}
      <BottomNav />
    </AuthWrapper>
  )
}
