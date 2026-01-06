"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Share2, Facebook, Twitter, Mail, Link2, Check, MessageCircle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SharePopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  artist?: string
  shareUrl: string
  shareText?: string
  type?: "song" | "playlist" | "album"
}

export default function SharePlaylistPopup({
  isOpen,
  onClose,
  title,
  artist,
  shareUrl,
  shareText,
  type = "song",
}: SharePopupProps) {
  const [copied, setCopied] = useState(false)
  const [copied2, setCopied2] = useState(false)

  const defaultShareText = shareText || `Check out "${title}"${artist ? ` by ${artist}` : ""}!`
  const encodedText = encodeURIComponent(defaultShareText)
  const encodedUrl = encodeURIComponent(shareUrl)

  const shareOptions = [
    {
      name: "Copy Link",
      icon: Link2,
      action: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          console.error("Failed to copy:", err)
        }
      },
      color: "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30",
    },
    {
      name: "Copy Text",
      icon: Copy,
      action: async () => {
        try {
          await navigator.clipboard.writeText(`${defaultShareText}\n${shareUrl}`)
          setCopied2(true)
          setTimeout(() => setCopied2(false), 2000)
        } catch (err) {
          console.error("Failed to copy:", err)
        }
      },
      color: "bg-green-500/20 text-green-300 hover:bg-green-500/30",
    },
    {
      name: "Twitter",
      icon: Twitter,
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        window.open(url, "popupwindow", "height=600,width=600")
      },
      color: "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30",
    },
    {
      name: "Facebook",
      icon: Facebook,
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
        window.open(url, "popupwindow", "height=600,width=600")
      },
      color: "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      action: () => {
        const url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        window.open(url, "_blank")
      },
      color: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30",
    },
    {
      name: "Email",
      icon: Mail,
      action: () => {
        const subject = encodeURIComponent(`Check out: ${title}`)
        const body = encodeURIComponent(`${defaultShareText}\n\n${shareUrl}`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
      },
      color: "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  }

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] },
    },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
  }

  const buttonVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={contentVariants}
            className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 py-6 border-b border-gray-700/50 bg-gradient-to-r from-purple-600/10 to-blue-600/10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Share</h2>
                </div>
                <p className="text-gray-400 text-sm">Share this {type} with your friends</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Preview */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-xl p-4"
              >
                <p className="text-white font-semibold text-sm line-clamp-2">{title}</p>
                {artist && <p className="text-gray-400 text-xs mt-1">{artist}</p>}
                <div className="mt-3 p-2 bg-black/30 rounded-lg flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-gray-500 text-xs truncate font-mono">{shareUrl}</p>
                </div>
              </motion.div>

              {/* Share Options Grid */}
              <div className="grid grid-cols-3 gap-3">
                {shareOptions.map((option, index) => {
                  const Icon = option.icon
                  const isSpecial = option.name === "Copy Link"

                  return (
                    <motion.div
                      key={option.name}
                      variants={buttonVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.15 + index * 0.05 }}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <button
                        onClick={option.action}
                        className={cn(
                          "w-full h-20 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 border border-transparent",
                          option.color,
                          "hover:border-white/20",
                        )}
                      >
                        <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.2 }} transition={{ duration: 0.2 }}>
                          {isSpecial && copied ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : option.name === "Copy Text" && copied2 ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </motion.div>
                        <span className="text-xs font-medium text-center leading-tight">{option.name}</span>
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {/* URL Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-2"
              >
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Share Link</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-black/30 border border-gray-600/50 rounded-lg px-4 py-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-purple-500/50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      } catch (err) {
                        console.error("Failed to copy:", err)
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="px-6 py-4 border-t border-gray-700/50 bg-black/20 flex gap-3"
            >
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white bg-transparent"
              >
                Close
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (navigator.share) {
                      await navigator.share({
                        title: title,
                        text: defaultShareText,
                        url: shareUrl,
                      })
                    } else {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }
                  } catch (err) {
                    console.error("Share failed:", err)
                  }
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
