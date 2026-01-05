"use client"

import { useEffect, useState } from "react"
import { Music, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OpeningAnimationProps {
  showAuthOptions?: boolean
  onComplete?: () => void
  onGoogleClick?: () => void
  onEmailClick?: () => void
  isLoading?: boolean
}

export default function OpeningAnimation({
  showAuthOptions = false,
  onComplete,
  onGoogleClick,
  onEmailClick,
  isLoading = false,
}: OpeningAnimationProps) {
  const [showButtons, setShowButtons] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 30
      })
    }, 300)

    const timer = setTimeout(() => {
      setShowButtons(true)
      setProgress(100)
      onComplete?.()
    }, 3500)

    return () => {
      clearTimeout(timer)
      clearInterval(progressInterval)
    }
  }, [onComplete])

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      {/* Floating music notes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <Music
            key={i}
            className="absolute text-purple-300 opacity-40 animate-float"
            size={32}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: "4s",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-md">
        {/* Pulsing logo */}
        <div className="mb-8 animate-pulse">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl">
            <Music className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tighter">Musica</h1>
        <p className="text-purple-200 text-lg mb-8">Your Personal Music Journey</p>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Loading text */}
        {!showButtons && <p className="text-sm text-purple-300 animate-pulse">Preparing your experience...</p>}

        {/* Auth buttons - show after animation */}
        {showButtons && showAuthOptions && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
              onClick={onGoogleClick}
              disabled={isLoading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold h-12 rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">⏳</span>
              ) : (
                <span className="mr-2">🔐</span>
              )}
              Continue with Google
            </Button>

            <Button
              onClick={onEmailClick}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold h-12 rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">⏳</span>
              ) : (
                <Mail className="w-4 h-4 mr-2 inline" />
              )}
              Continue with Email
            </Button>

            <p className="text-xs text-purple-300 mt-4">Sign in or create account to get started</p>
          </div>
        )}
      </div>

      {/* Styles for animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.4;
          }
          90% {
            opacity: 0;
          }
          100% {
            transform: translateY(-300px) translateX(50px) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-float {
          animation: float 4s ease-in forwards;
        }
      `}</style>
    </div>
  )
}
