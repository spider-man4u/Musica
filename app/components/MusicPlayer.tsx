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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

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
  } = useStore()

  const isFavorite = currentSong ? userData.favorites.some((song) => song.id === currentSong.id) : false

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
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
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [repeatMode, playNext, setCurrentTime, setDuration])

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong])

  // Volume control
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const handleProgressChange = useCallback(
    (newValue: number[]) => {
      const [newProgress] = newValue
      const audio = audioRef.current
      if (audio && duration) {
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

  // Gesture handlers
  const handlePanEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info

    if (isExpanded) {
      // Full screen gestures
      if (offset.y > 100 || velocity.y > 500) {
        // Swipe down to minimize
        setIsExpanded(false)
      } else if (Math.abs(offset.x) > 100) {
        if (offset.x > 0) {
          // Swipe right for previous
          playPrevious()
        } else {
          // Swipe left for next
          playNext()
        }
      }
    } else {
      // Mini player gestures
      if (offset.y < -50 || velocity.y < -300) {
        // Swipe up to expand
        setIsExpanded(true)
      } else if (Math.abs(offset.x) > 80) {
        if (offset.x > 0) {
          // Swipe right for previous
          playPrevious()
        } else {
          // Swipe left for next
          playNext()
        }
      }
    }

    // Reset drag states
    setDragY(0)
    setDragX(0)
  }

  const handlePan = (event: any, info: PanInfo) => {
    setDragY(info.offset.y)
    setDragX(info.offset.x)
  }

  if (!currentSong) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Mini Player */}
        {!isExpanded && (
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
            style={{ y: dragY }}
            className="bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl border-t border-gray-800/50 px-4 py-2"
          >
            {/* Drag indicator */}
            <div className="flex justify-center mb-1">
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
                  <Image
                    src={currentSong.image || "/placeholder.svg"}
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
                  onClick={playPrevious}
                  className="text-gray-400 hover:text-white w-8 h-8"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white hover:bg-gray-200 text-black rounded-full w-10 h-10"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={playNext}
                  className="text-gray-400 hover:text-white w-8 h-8"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleFavorite}
                  className="text-gray-400 hover:text-white w-8 h-8"
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
                </Button>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className="bg-white rounded-full h-1 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Screen Player */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 flex flex-col"
            >
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
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
                    <p className="text-white font-medium">Your Library</p>
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
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
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
                    className="w-80 h-80 mb-8 cursor-grab active:cursor-grabbing"
                  >
                    <Image
                      src={currentSong.image || "/placeholder.svg"}
                      alt={currentSong.title}
                      width={320}
                      height={320}
                      className="w-full h-full object-cover rounded-2xl shadow-2xl"
                      priority
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

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={playPrevious}
                      className="text-white hover:text-gray-300"
                    >
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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleMute}
                        className="text-gray-400 hover:text-white"
                      >
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

        <audio ref={audioRef} src={currentSong?.audio} preload="metadata" />
      </motion.div>
    </AnimatePresence>
  )
}
