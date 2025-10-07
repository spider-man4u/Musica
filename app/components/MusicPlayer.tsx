"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ChevronDown,
  Share,
  MoreHorizontal,
  Music,
  Download,
  ListMusic,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

const playerVariants = {
  hidden: {
    opacity: 0,
    y: 100,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.0, 0.0, 0.2, 1],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: 100,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 1, 1],
    },
  },
}

const fullScreenVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.0, 0.0, 0.2, 1],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: {
      duration: 0.25,
      ease: [0.4, 0.0, 1, 1],
    },
  },
}

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.0, 0.0, 0.2, 1],
    },
  },
}

const SafeImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: {
  src: string | undefined | null
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}) => {
  const validSrc = src && typeof src === "string" && src.trim() !== "" ? src.trim() : null

  if (!validSrc) {
    return (
      <div className={cn("bg-gray-800 flex items-center justify-center", className)} style={{ width, height }}>
        <Music className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  return (
    <Image
      src={validSrc || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      quality={85}
    />
  )
}

const QueueView = ({ onClose }: { onClose: () => void }) => {
  const { queue, queueIndex, currentSong, setCurrentSong, removeFromQueue, clearQueue } = useStore()

  const playFromQueue = useCallback(
    (index: number) => {
      if (queue[index]) {
        useStore.setState({ queueIndex: index })
        setCurrentSong(queue[index])
        onClose()
      }
    },
    [queue, setCurrentSong, onClose],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      className="absolute bottom-full left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-t-lg max-h-96 overflow-hidden shadow-2xl"
    >
      <motion.div variants={childVariants} className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Queue ({queue.length} songs)</h3>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={clearQueue} className="text-xs bg-transparent border-gray-700">
              Clear All
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
      <div className="overflow-y-auto max-h-80">
        {queue.length === 0 ? (
          <motion.div variants={childVariants} className="p-8 text-center text-gray-400">
            <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No songs in queue</p>
          </motion.div>
        ) : (
          queue.map((song, index) => (
            <motion.div
              key={`${song.id}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
                ease: [0.0, 0.0, 0.2, 1],
              }}
              className={cn(
                "flex items-center space-x-3 p-3 hover:bg-gray-800/50 cursor-pointer border-l-2 transition-all duration-200",
                index === queueIndex ? "border-l-green-500 bg-gray-800/30" : "border-l-transparent",
              )}
              onClick={() => playFromQueue(index)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 text-center">
                {index === queueIndex && currentSong?.id === song.id ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse" />
                ) : (
                  <span className="text-gray-500 text-sm">{index + 1}</span>
                )}
              </div>
              <SafeImage src={song.image} alt={song.title} width={40} height={40} className="rounded" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{song.title}</p>
                <p className="text-gray-400 text-xs truncate">{song.artist}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFromQueue(index)
                }}
                className="text-gray-400 hover:text-white w-8 h-8"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default function MusicPlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    queue,
    queueIndex,
    userData,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    toggleMute,
    toggleShuffle,
    setRepeatMode,
    playNext,
    playPrevious,
    addToFavorites,
    removeFromFavorites,
    addToDownloads,
  } = useStore()

  const isFavorite = currentSong ? userData.favorites.some((song) => song.id === currentSong.id) : false
  const isDownloaded = currentSong ? userData.downloads?.some((song) => song.id === currentSong.id) : false

  // Media Session API setup
  useEffect(() => {
    if (!currentSong || typeof navigator === "undefined" || !("mediaSession" in navigator)) return

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || "Unknown Song",
        artist: currentSong.artist || "Unknown Artist",
        album: currentSong.album || "Unknown Album",
        artwork: [
          {
            src: currentSong.image || "/placeholder.svg?height=512&width=512",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: currentSong.image || "/placeholder.svg?height=512&width=512",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: currentSong.image || "/placeholder.svg?height=512&width=512",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: currentSong.image || "/placeholder.svg?height=512&width=512",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: currentSong.image || "/placeholder.svg?height=512&width=512",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: currentSong.image || "/placeholder.svg?height=512&width=512",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      })

      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"

      const actionHandlers = {
        play: () => setIsPlaying(true),
        pause: () => setIsPlaying(false),
        previoustrack: () => handlePrevious(),
        nexttrack: () => handleNext(),
        seekto: (details: any) => {
          if (details.seekTime && audioRef.current) {
            audioRef.current.currentTime = details.seekTime
            setCurrentTime(details.seekTime)
          }
        },
      }

      Object.entries(actionHandlers).forEach(([action, handler]) => {
        navigator.mediaSession.setActionHandler(action as any, handler)
      })

      if (duration && !isNaN(duration)) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: currentTime,
        })
      }

      return () => {
        Object.keys(actionHandlers).forEach((action) => {
          navigator.mediaSession.setActionHandler(action as any, null)
        })
      }
    } catch (error) {
      console.warn("Media Session API error:", error)
    }
  }, [currentSong, isPlaying, currentTime, duration, setIsPlaying, setCurrentTime])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime
      if (!isNaN(newTime) && isFinite(newTime)) {
        setCurrentTime(newTime)

        // Update media session position
        if ("mediaSession" in navigator && duration && !isNaN(duration)) {
          try {
            navigator.mediaSession.setPositionState({
              duration: duration,
              playbackRate: 1,
              position: newTime,
            })
          } catch (error) {
            // Silently handle position state errors
          }
        }
      }
    }

    const handleLoadedMetadata = () => {
      const newDuration = audio.duration
      console.log("🎵 Loaded metadata, duration:", newDuration)
      if (newDuration && !isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
        setDuration(newDuration)
      }
    }

    const handleDurationChange = () => {
      const newDuration = audio.duration
      console.log("🎵 Duration changed:", newDuration)
      if (newDuration && !isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
        setDuration(newDuration)
      }
    }

    const handleCanPlay = () => {
      setImageLoaded(true)
      const newDuration = audio.duration
      if (newDuration && !isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
        setDuration(newDuration)
      }
    }

    const handleError = (e: any) => {
      console.error("🎵 Audio error:", e.target.error)
      toast({
        title: "Playback Error",
        description: "Unable to play this song. Trying next song...",
        variant: "destructive",
      })
      setTimeout(() => {
        handleNext()
      }, 1000)
    }

    const handleEnded = () => {
      console.log("🎵 Song ended, repeat mode:", repeatMode)
      if (repeatMode === "one") {
        // Repeat the current song
        audio.currentTime = 0
        audio.play().catch(console.error)
      } else {
        // Play next song
        handleNext()
      }
    }

    const handlePlay = () => {
      console.log("🎵 Audio playing")
    }

    const handlePause = () => {
      console.log("🎵 Audio paused")
    }

    audio.addEventListener("timeupdate", handleTimeUpdate, { passive: true })
    audio.addEventListener("durationchange", handleDurationChange, { passive: true })
    audio.addEventListener("loadedmetadata", handleLoadedMetadata, { passive: true })
    audio.addEventListener("canplay", handleCanPlay, { passive: true })
    audio.addEventListener("error", handleError)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay, { passive: true })
    audio.addEventListener("pause", handlePause, { passive: true })

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [repeatMode, setCurrentTime, setDuration, duration])

  // Handle audio source and playback
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    const audioUrl = currentSong.download_url || currentSong.audio

    if (!audioUrl || audioUrl.trim() === "") {
      console.warn("🎵 No valid audio URL found for song:", currentSong.title)
      return
    }

    console.log("🎵 Loading audio:", audioUrl)

    if (audio.src !== audioUrl) {
      audio.src = audioUrl
      audio.load()
      setImageLoaded(false)
      setDuration(0)
      setCurrentTime(0)
    }

    if (isPlaying) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("🎵 Audio playing successfully")
          })
          .catch((error) => {
            console.error("🎵 Audio play failed:", error)
            setIsPlaying(false)
          })
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong, setIsPlaying, setDuration, setCurrentTime])

  // Handle volume
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const handleNext = useCallback(() => {
    console.log("🎵 handleNext called")
    playNext()
  }, [playNext])

  const handlePrevious = useCallback(() => {
    console.log("🎵 handlePrevious called")
    playPrevious()
  }, [playPrevious])

  const handleProgressChange = useCallback(
    (newValue: number[]) => {
      const [newProgress] = newValue
      const audio = audioRef.current
      if (audio && duration && !isNaN(duration) && duration > 0) {
        const newTime = (newProgress / 100) * duration
        audio.currentTime = newTime
        setCurrentTime(newTime)
      }
    },
    [duration, setCurrentTime],
  )

  const handleVolumeChange = useCallback(
    (newValue: number[]) => {
      const [newVolume] = newValue
      setVolume(newVolume)
    },
    [setVolume],
  )

  const toggleFavorite = useCallback(() => {
    if (!currentSong) return

    if (isFavorite) {
      removeFromFavorites(currentSong.id)
      toast({
        title: "Removed from Favorites",
        description: `${currentSong.title} removed from your favorites`,
      })
    } else {
      addToFavorites(currentSong)
      toast({
        title: "Added to Favorites",
        description: `${currentSong.title} added to your favorites`,
      })
    }
  }, [currentSong, isFavorite, addToFavorites, removeFromFavorites])

  const toggleRepeat = useCallback(() => {
    const modes: Array<"off" | "one" | "all"> = ["off", "all", "one"]
    const currentIndex = modes.indexOf(repeatMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setRepeatMode(nextMode)

    const modeNames = {
      off: "Repeat Off",
      one: "Repeat One",
      all: "Repeat All",
    }

    toast({
      title: modeNames[nextMode],
      description: `Repeat mode set to ${modeNames[nextMode]}`,
    })
  }, [repeatMode, setRepeatMode])

  const handleDownload = useCallback(() => {
    if (!currentSong) return

    if (isDownloaded) {
      toast({
        title: "Already Downloaded",
        description: `${currentSong.title} is already in your downloads`,
      })
    } else {
      addToDownloads(currentSong)
      toast({
        title: "Download Started",
        description: `${currentSong.title} is being downloaded`,
      })
    }
  }, [currentSong, isDownloaded, addToDownloads])

  const handleShare = useCallback(async () => {
    if (!currentSong) return

    const shareData = {
      title: `${currentSong.title} by ${currentSong.artist}`,
      text: `Check out this song: ${currentSong.title} by ${currentSong.artist}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: "Shared Successfully",
          description: "Song shared successfully",
        })
      } else {
        await navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`)
        toast({
          title: "Copied to Clipboard",
          description: "Song details copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Share failed:", error)
      toast({
        title: "Share Failed",
        description: "Unable to share this song",
        variant: "destructive",
      })
    }
  }, [currentSong])

  const formatTime = useCallback((time: number) => {
    if (!time || isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const progress =
    duration && !isNaN(duration) && isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0

  if (!currentSong) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <AnimatePresence mode="wait">{showQueue && <QueueView onClose={() => setShowQueue(false)} />}</AnimatePresence>

      {!isExpanded && (
        <motion.div
          variants={playerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute bottom-16 left-0 right-0 bg-gradient-to-r from-gray-900/98 to-black/98 backdrop-blur-xl border-t border-gray-800/50 px-2 py-1 md:px-6 lg:px-8 md:py-3"
        >
          <motion.div variants={childVariants} className="flex justify-center mb-1 md:mb-2">
            <motion.button
              onClick={() => setIsExpanded(true)}
              className="w-6 h-0.5 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
              whileHover={{ scaleX: 1.2 }}
              whileTap={{ scaleY: 0.8 }}
            />
          </motion.div>

          <motion.div variants={childVariants} className="flex items-center justify-between max-w-7xl mx-auto">
            <motion.div
              className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => setIsExpanded(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <SafeImage
                  src={currentSong.image}
                  alt={currentSong.title}
                  width={36}
                  height={36}
                  className="rounded-lg sm:w-12 sm:h-12 md:w-14 md:h-14"
                  priority
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-white font-medium truncate text-xs sm:text-sm md:text-base">{currentSong.title}</h4>
                <p className="text-gray-400 text-xs truncate">{currentSong.artist}</p>
              </div>
            </motion.div>

            <motion.div
              variants={childVariants}
              className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4"
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePrevious}
                  className="text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                >
                  <SkipBack className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white hover:bg-gray-200 text-black rounded-full w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12"
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  ) : (
                    <Play className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 ml-0.5" />
                  )}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNext}
                  className="text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                >
                  <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleFavorite}
                  className="text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                >
                  <Heart
                    className={cn("w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5", isFavorite && "fill-red-500 text-red-500")}
                  />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowQueue(!showQueue)}
                  className="text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                >
                  <ListMusic className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div variants={childVariants} className="mt-1.5 sm:mt-3">
            <div className="w-full bg-gray-700 rounded-full h-0.5">
              <motion.div
                className="bg-white rounded-full h-0.5"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          </motion.div>

          <motion.div variants={childVariants} className="flex justify-between text-xs text-gray-400 mt-0.5 sm:mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            variants={fullScreenVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 flex flex-col"
          >
            <motion.div
              variants={childVariants}
              className="flex items-center justify-between p-3 md:p-6 lg:p-8 pt-6 sm:pt-8 md:pt-12"
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:bg-white/10"
                >
                  <ChevronDown className="w-6 h-6" />
                </Button>
              </motion.div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">PLAYING FROM</p>
                <p className="text-white font-medium">Musica</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                      <MoreHorizontal className="w-6 h-6" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-700" align="end">
                  <DropdownMenuItem onClick={handleDownload} className="text-white hover:bg-gray-800">
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloaded ? "Downloaded" : "Download"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} className="text-white hover:bg-gray-800">
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowQueue(!showQueue)} className="text-white hover:bg-gray-800">
                    <ListMusic className="mr-2 h-4 w-4" />
                    Show Queue
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={toggleFavorite} className="text-white hover:bg-gray-800">
                    <Heart className={cn("mr-2 h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>

            <motion.div variants={childVariants} className="flex justify-center mb-4">
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="w-12 h-1 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
                whileHover={{ scaleX: 1.2 }}
                whileTap={{ scaleY: 0.8 }}
              />
            </motion.div>

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 md:px-8 lg:px-16 gap-8">
              <motion.div
                variants={childVariants}
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[400px] lg:h-[400px] flex-shrink-0"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
                >
                  <SafeImage
                    src={currentSong.image}
                    alt={currentSong.title}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover rounded-2xl shadow-2xl"
                    priority
                  />
                </motion.div>
              </motion.div>

              <motion.div
                variants={childVariants}
                className="flex flex-col items-center lg:items-start w-full lg:w-auto lg:flex-1 max-w-md lg:max-w-none"
              >
                <motion.div variants={childVariants} className="text-center lg:text-left mb-8 w-full">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 truncate">
                    {currentSong.title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-400 truncate">{currentSong.artist}</p>
                  {currentSong.album && (
                    <p className="text-base md:text-lg text-gray-500 truncate mt-1">{currentSong.album}</p>
                  )}
                </motion.div>

                <motion.div variants={childVariants} className="w-full mb-8">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={handleProgressChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </motion.div>

                <motion.div
                  variants={childVariants}
                  className="flex items-center justify-center space-x-4 sm:space-x-6 md:space-x-8 mb-6 md:mb-8"
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleShuffle}
                      className={cn("text-gray-400 hover:text-white", isShuffled && "text-green-500")}
                    >
                      <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handlePrevious}
                      className="text-white hover:text-gray-300"
                    >
                      <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="icon"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="bg-white hover:bg-gray-200 text-black rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                      ) : (
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ml-1" />
                      )}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button size="icon" variant="ghost" onClick={handleNext} className="text-white hover:text-gray-300">
                      <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleRepeat}
                      className={cn("text-gray-400 hover:text-white", repeatMode !== "off" && "text-green-500")}
                    >
                      {repeatMode === "one" ? (
                        <Repeat1 className="w-5 h-5 md:w-6 md:h-6" />
                      ) : (
                        <Repeat className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                    </Button>
                  </motion.div>
                </motion.div>

                <motion.div variants={childVariants} className="flex items-center justify-between w-full">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleFavorite}
                      className="text-gray-400 hover:text-white"
                    >
                      <Heart className={cn("w-5 h-5 md:w-6 md:h-6", isFavorite && "fill-red-500 text-red-500")} />
                    </Button>
                  </motion.div>

                  <div className="flex items-center space-x-2 flex-1 mx-8">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleMute}
                        className="text-gray-400 hover:text-white"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                    </motion.div>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="flex-1"
                    />
                  </div>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleShare}
                      className="text-gray-400 hover:text-white"
                    >
                      <Share className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" playsInline />
    </div>
  )
}
