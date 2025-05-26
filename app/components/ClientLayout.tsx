"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import BottomNav from "./BottomNav"
import AuthWrapper from "./AuthWrapper"
import MusicPlayer from "./MusicPlayer"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)

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
          className="pb-20"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col">
        <MusicPlayer />
        <BottomNav />
      </div>
    </AuthWrapper>
  )
}
