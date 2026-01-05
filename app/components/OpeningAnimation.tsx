"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Music, Zap, Mail, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OpeningAnimationProps {
  onComplete?: () => void
  showAuthOptions?: boolean
  onGoogleClick?: () => void
  onEmailClick?: () => void
  isLoading?: boolean
}

export default function OpeningAnimation({
  onComplete,
  showAuthOptions = false,
  onGoogleClick,
  onEmailClick,
  isLoading = false,
}: OpeningAnimationProps) {
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!showAuthOptions) {
      const timer = setTimeout(() => {
        setShowAuth(true)
        onComplete?.()
      }, 3500)
      return () => clearTimeout(timer)
    } else {
      setShowAuth(true)
    }
  }, [showAuthOptions, onComplete])

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  }

  const musicNotesVariants = {
    initial: { opacity: 0, y: 20, scale: 0 },
    animate: (i: number) => ({
      opacity: [0, 1, 0],
      y: [-20, -100, -150],
      scale: [0, 1, 0.8],
      transition: { duration: 2, delay: i * 0.15, ease: "easeOut" },
    }),
  }

  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.8, 0.3],
      transition: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
    },
  }

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 1.2, ease: "easeOut" },
    },
  }

  const authVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 overflow-hidden"
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl"
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
        {/* Central music icon with pulse */}
        <motion.div variants={pulseVariants} animate="animate" className="relative mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
            <Music className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Floating music notes */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              custom={i}
              variants={musicNotesVariants}
              initial="initial"
              animate="animate"
              className={`absolute ${i % 2 === 0 ? "left-1/4" : "right-1/4"}`}
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full shadow-lg" />
            </motion.div>
          ))}
        </div>

        {/* Title */}
        <motion.div variants={textVariants} className="mb-4">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-2">Musica</h1>
          <p className="text-gray-300 text-lg">Experience the rhythm</p>
        </motion.div>

        {/* Auth buttons - show after animation completes */}
        {showAuth && (
          <motion.div
            variants={authVariants}
            initial="initial"
            animate="animate"
            className="mt-12 space-y-4 w-full max-w-sm"
          >
            <Button
              onClick={onGoogleClick}
              disabled={isLoading}
              className="w-full bg-white text-black hover:bg-white/90 font-semibold py-3"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>
            <Button
              onClick={onEmailClick}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
            >
              <Mail className="w-5 h-5 mr-2" />
              Continue with Email
            </Button>
          </motion.div>
        )}

        {/* Loading indicator */}
        {!showAuth && (
          <motion.div variants={textVariants} className="flex items-center gap-2 text-gray-400 mt-8">
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              <Zap className="w-4 h-4 text-purple-400" />
            </motion.div>
            <span className="text-sm">Initializing your music experience</span>
          </motion.div>
        )}

        {/* Progress bar */}
        {!showAuth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 w-32 h-1 bg-gray-700 rounded-full overflow-hidden"
          >
            <motion.div
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
