"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import ImageCropper from "./ImageCropper"

interface OpeningAnimationProps {
  onComplete?: (displayName: string, avatar?: string) => void
  isLoading?: boolean
}

export default function OpeningAnimation({ onComplete, isLoading = false }: OpeningAnimationProps) {
  const [showForm, setShowForm] = useState(false)
  const [progress, setProgress] = useState(0)
  const [displayName, setDisplayName] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

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
      setShowForm(true)
      setProgress(100)
    }, 3500)

    return () => {
      clearTimeout(timer)
      clearInterval(progressInterval)
    }
  }, [])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setTempImage(e.target?.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    setAvatar(croppedImage)
    setShowCropper(false)
    setTempImage(null)
  }

  const handleContinue = () => {
    if (!displayName.trim()) {
      return
    }
    onComplete?.(displayName, avatar || undefined)
  }

  return (
    <>
      <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

        {/* Floating music notes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-300 opacity-40 animate-float text-4xl"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: "4s",
              }}
            >
              ♪
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center px-4 max-w-md">
          {/* Logo */}
          <div className="mb-8 animate-pulse">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-purple-500/30">
              <Image
                src="/musica-logo.png"
                alt="Musica"
                width={96}
                height={96}
                priority
                className="w-full h-full object-cover"
              />
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
          {!showForm && <p className="text-sm text-purple-300 animate-pulse">Preparing your experience...</p>}

          {/* Profile photo upload section */}
          {showForm && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {avatar ? (
                    <div className="relative">
                      <Image
                        src={avatar || "/placeholder.svg"}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                      />
                      <button
                        onClick={() => {
                          setAvatar(null)
                        }}
                        className="absolute top-0 right-0 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-full border-4 border-dashed border-purple-500 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-500/10 transition-all duration-300">
                      <Upload className="w-7 h-7 text-purple-300" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Display name input */}
              <input
                type="text"
                placeholder="What's your name?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-purple-500 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                maxLength={50}
                disabled={isLoading}
              />

              {/* Continue button */}
              <Button
                onClick={handleContinue}
                disabled={!displayName.trim() || isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold h-12 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <span className="inline-block animate-spin mr-2">⏳</span> : null}
                Enter Musica
              </Button>

              <p className="text-xs text-purple-300 mt-4">
                No login required • Your profile is private • Start exploring music instantly
              </p>
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

      {/* Image Cropper Modal */}
      {showCropper && tempImage && (
        <ImageCropper
          imageSrc={tempImage}
          onCrop={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setTempImage(null)
          }}
          aspectRatio={1}
        />
      )}
    </>
  )
}
