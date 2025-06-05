"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

// Safe Image Component for Music Player
const SafeImage = ({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string | undefined | null
  alt: string
  width: number
  height: number
  className?: string
}) => {
  const validSrc = src && typeof src === "string" && src.trim() !== "" ? src.trim() : null

  if (!validSrc) {
    return (
      <div className={cn("bg-gray-800 flex items-center justify-center", className)} style={{ width, height }}>
        <Music className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  return <Image src={validSrc || "/placeholder.svg"} alt={alt} width={width} height={height} className={className} />
}

export default function MusicPlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragX, setDragX] = useState(0)
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
    fetchSongDetails,
  } = useStore()

  const isFavorite = currentSong ? userData.favorites.some((song) => song.id === currentSong.id) : false

  // Media Session API for notifications
  useEffect(() => {
    if (!currentSong || typeof navigator === "undefined" || !("mediaSession" in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title || "Unknown Song",
      artist: currentSong.artist || "Unknown Artist",
      album: currentSong.album || "Unknown Album",
      artwork: [
        {
          src: currentSong.image || "/placeholder.svg?height=512&width=512",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    })

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"

    // Set action handlers
    navigator.mediaSession.setActionHandler("play", () => {
      setIsPlaying(true)
    })

    navigator.mediaSession.setActionHandler("pause", () => {
      setIsPlaying(false)
    })

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      playPrevious()
    })

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      playNext()
    })

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime && audioRef.current) {
        audioRef.current.currentTime = details.seekTime
        setCurrentTime(details.seekTime)
      }
    })

    // Update position state
    if (duration && !isNaN(duration)) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: currentTime,
      })
    }

    return () => {
      // Clear action handlers
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("previoustrack", null)
      navigator.mediaSession.setActionHandler("nexttrack", null)
      navigator.mediaSession.setActionHandler("seekto", null)
    }
  }, [currentSong, isPlaying, currentTime, duration, setIsPlaying, playNext, playPrevious, setCurrentTime])

  // Enhanced audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      // Update media session position
      if ("mediaSession" in navigator && duration && !isNaN(duration)) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: audio.currentTime,
        })
      }
    }

    const handleDurationChange = () => {
      console.log("🎵 Audio metadata loaded:", {
        duration: audio.duration,
        src: audio.src,
      })
      setDuration(audio.duration)
    }

    const handleLoadedMetadata = () => {
      console.log("🎵 Audio metadata loaded:", {
        duration: audio.duration,
        src: audio.src,
      })
      setDuration(audio.duration)
    }

    const handleCanPlay = () => {
      console.log("🎵 Audio can play")
    }

    const handleError = (e: any) => {
      console.error("🎵 Audio error:", e.target.error)
    }

    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0
        audio.play()
      } else {
        playNext()
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("error", handleError)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [repeatMode, playNext, setCurrentTime, setDuration, duration])

  // Enhanced play/pause control with better audio URL handling
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    // Get the best available audio URL
    const audioUrl = currentSong.download_url || currentSong.audio

    if (!audioUrl || audioUrl.trim() === "") {
      console.warn("🎵 No valid audio URL found for song:", currentSong.title)
      return
    }

    // Update audio source if it's different
    if (audio.src !== audioUrl) {
      console.log("🎵 Loading new audio:", audioUrl)
      audio.src = audioUrl
      audio.load()
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
  }, [isPlaying, currentSong, setIsPlaying])

  // Enhanced volume control
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Enhanced song details fetching
  useEffect(() => {
    if (currentSong && !currentSong.download_url && !currentSong.audio) {
      console.log("🎵 Fetching enhanced song details for:", currentSong.id)
      fetchSongDetails(currentSong.id).then((enhancedSong) => {
        if (enhancedSong && enhancedSong.download_url) {
          console.log("🎵 Enhanced song details received with audio URL")
          // Update the current song with enhanced details
          // This would require updating the store to handle enhanced song updates
        }
      })
    }
  }, [currentSong, fetchSongDetails])

  const handleProgressChange = useCallback(
    (newValue: number[]) => {
      const [newProgress] = newValue
      const audio = audioRef.current
      if (audio && duration && !isNaN(duration)) {
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

  const toggleFavorite = () => {
    if (!currentSong) return

    if (isFavorite) {
      removeFromFavorites(currentSong.id)
    } else {
      addToFavorites(currentSong)
    }
  }

  const toggleRepeat = () => {
    const modes: Array<"off" | "one" | "all"> = ["off", "all", "one"]
    const currentIndex = modes.indexOf(repeatMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setRepeatMode(nextMode)
  }

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  // Fixed gesture handlers to prevent disappearing
  const handlePanEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info

    if (isExpanded) {
      // Full screen gestures - only close if significant downward swipe
      if (offset.y > 150 && velocity.y > 300) {
        setIsExpanded(false)
      } else if (Math.abs(offset.x) > 100 && Math.abs(offset.y) < 50) {
        if (offset.x > 0) {
          playPrevious()
        } else {
          playNext()
        }
      }
    } else {
      // Mini player gestures - only expand if significant upward swipe
      if (offset.y < -100 && velocity.y < -300) {
        setIsExpanded(true)
      } else if (Math.abs(offset.x) > 80 && Math.abs(offset.y) < 50) {
        if (offset.x > 0) {
          playPrevious()
        } else {
          playNext()
        }
      }
    }

    // Reset drag states
    setDragY(0)
    setDragX(0)
  }

  const handlePan = (event: any, info: PanInfo) => {
    // Limit drag to prevent excessive movement
    const maxDrag = isExpanded ? 200 : 100
    setDragY(Math.max(-maxDrag, Math.min(maxDrag, info.offset.y)))
    setDragX(Math.max(-maxDrag, Math.min(maxDrag, info.offset.x)))
  }

  if (!currentSong) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Mini Player - Resso Style */}
      {!isExpanded && (
        <motion.div
          drag="y"
          dragConstraints={{ top: -50, bottom: 50 }}
          dragElastic={0.1}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          style={{ y: dragY }}
          className="absolute bottom-16 left-0 right-0 bg-gradient-to-r from-gray-900/98 to-black/98 backdrop-blur-xl border-t border-gray-800/50 px-4 py-3"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {/* Drag indicator */}
          <div className="flex justify-center mb-2">
            <div className="w-8 h-1 bg-gray-600 rounded-full" />
          </div>

          <div className="flex items-center justify-between">
            {/* Song Info */}
            <motion.div
              className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => setIsExpanded(true)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <SafeImage
                  src={currentSong.image}
                  alt={currentSong.title}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-white font-medium truncate text-sm">{currentSong.title}</h4>
                <p className="text-gray-400 text-xs truncate">{currentSong.artist}</p>
              </div>
            </motion.div>

            {/* Mini Controls */}
            <div className="flex items-center space-x-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  playPrevious()
                }}
                className="text-gray-400 hover:text-white w-8 h-8"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPlaying(!isPlaying)
                }}
                className="bg-white hover:bg-gray-200 text-black rounded-full w-10 h-10"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  playNext()
                }}
                className="text-gray-400 hover:text-white w-8 h-8"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite()
                }}
                className="text-gray-400 hover:text-white w-8 h-8"
              >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
              </Button>
            </div>
          </div>

          {/* Mini Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div
                className="bg-white rounded-full h-1 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Full Screen Player - Resso Style */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 flex flex-col"
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: -100, bottom: 100 }}
              dragElastic={0.1}
              onPan={handlePan}
              onPanEnd={handlePanEnd}
              style={{ y: dragY }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pt-12">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:bg-white/10"
                >
                  <ChevronDown className="w-6 h-6" />
                </Button>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">PLAYING FROM</p>
                  <p className="text-white font-medium">Musica</p>
                </div>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                  <MoreHorizontal className="w-6 h-6" />
                </Button>
              </div>

              {/* Drag indicator */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1 bg-gray-600 rounded-full" />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center px-8">
                {/* Album Art with gesture area */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -50, right: 50 }}
                  dragElastic={0.1}
                  onPan={(event, info) => setDragX(info.offset.x)}
                  onPanEnd={(event, info) => {
                    if (Math.abs(info.offset.x) > 100) {
                      if (info.offset.x > 0) {
                        playPrevious()
                      } else {
                        playNext()
                      }
                    }
                    setDragX(0)
                  }}
                  style={{ x: dragX }}
                  className="w-80 h-80 mb-8 cursor-grab active:cursor-grabbing relative"
                >
                  <SafeImage
                    src={currentSong.image}
                    alt={currentSong.title}
                    width={320}
                    height={320}
                    className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  />

                  {/* Swipe indicators */}
                  <AnimatePresence>
                    {Math.abs(dragX) > 50 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50",
                          dragX > 0 ? "text-green-400" : "text-blue-400",
                        )}
                      >
                        {dragX > 0 ? (
                          <div className="flex items-center space-x-2">
                            <SkipBack className="w-8 h-8" />
                            <span className="text-lg font-medium">Previous</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-medium">Next</span>
                            <SkipForward className="w-8 h-8" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Song Info */}
                <div className="text-center mb-8 max-w-md">
                  <h1 className="text-3xl font-bold text-white mb-2 truncate">{currentSong.title}</h1>
                  <p className="text-xl text-gray-400 truncate">{currentSong.artist}</p>
                  {currentSong.album && <p className="text-lg text-gray-500 truncate mt-1">{currentSong.album}</p>}
                </div>

                {/* Progress */}
                <div className="w-full max-w-md mb-8">
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
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-8 mb-8">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleShuffle}
                    className={cn("text-gray-400 hover:text-white", isShuffled && "text-green-500")}
                  >
                    <Shuffle className="w-6 h-6" />
                  </Button>

                  <Button size="icon" variant="ghost" onClick={playPrevious} className="text-white hover:text-gray-300">
                    <SkipBack className="w-8 h-8" />
                  </Button>

                  <Button
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-white hover:bg-gray-200 text-black rounded-full w-16 h-16"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </Button>

                  <Button size="icon" variant="ghost" onClick={playNext} className="text-white hover:text-gray-300">
                    <SkipForward className="w-8 h-8" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleRepeat}
                    className={cn("text-gray-400 hover:text-white", repeatMode !== "off" && "text-green-500")}
                  >
                    {repeatMode === "one" ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
                  </Button>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between w-full max-w-md">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleFavorite}
                    className="text-gray-400 hover:text-white"
                  >
                    <Heart className={cn("w-6 h-6", isFavorite && "fill-red-500 text-red-500")} />
                  </Button>

                  <div className="flex items-center space-x-2 flex-1 mx-8">
                    <Button size="icon" variant="ghost" onClick={toggleMute} className="text-gray-400 hover:text-white">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="flex-1"
                    />
                  </div>

                  <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                    <Share className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Audio Element */}
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </div>
  )
}
