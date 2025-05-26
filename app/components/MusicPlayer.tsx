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
  ChevronUp,
  List,
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
        <div className="bg-gradient-to-r from-gray-900 to-black border-t border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Song Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="relative cursor-pointer" onClick={() => setIsExpanded(true)}>
                <Image
                  src={currentSong.image || "/placeholder.svg"}
                  alt={currentSong.title}
                  width={56}
                  height={56}
                  className="rounded-lg"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-white font-medium truncate cursor-pointer hover:underline">{currentSong.title}</h4>
                <p className="text-gray-400 text-sm truncate cursor-pointer hover:underline">{currentSong.artist}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={toggleFavorite} className="text-gray-400 hover:text-white">
                <Heart className={cn("w-4 h-4", isFavorite && "fill-green-500 text-green-500")} />
              </Button>
            </div>

            {/* Player Controls */}
            <div className="flex items-center space-x-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleShuffle}
                className={cn("text-gray-400 hover:text-white", isShuffled && "text-green-500")}
              >
                <Shuffle className="w-4 h-4" />
              </Button>

              <Button size="icon" variant="ghost" onClick={playPrevious} className="text-gray-400 hover:text-white">
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-white hover:bg-gray-200 text-black rounded-full w-8 h-8"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>

              <Button size="icon" variant="ghost" onClick={playNext} className="text-gray-400 hover:text-white">
                <SkipForward className="w-5 h-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={toggleRepeat}
                className={cn("text-gray-400 hover:text-white", repeatMode !== "off" && "text-green-500")}
              >
                {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </Button>
            </div>

            {/* Volume and Queue */}
            <div className="flex items-center space-x-4 flex-1 justify-end">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowQueue(!showQueue)}
                className="text-gray-400 hover:text-white"
              >
                <List className="w-4 h-4" />
              </Button>

              <div className="flex items-center space-x-2 w-32">
                <Button size="icon" variant="ghost" onClick={toggleMute} className="text-gray-400 hover:text-white">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsExpanded(true)}
                className="text-gray-400 hover:text-white"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="max-w-7xl mx-auto mt-2">
            <Slider value={[progress]} max={100} step={0.1} onValueChange={handleProgressChange} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Full Screen Player */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:bg-white/10"
                >
                  <ChevronUp className="w-6 h-6 rotate-180" />
                </Button>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">PLAYING FROM PLAYLIST</p>
                  <p className="text-white font-medium">Liked Songs</p>
                </div>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                  <MoreHorizontal className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center px-8">
                {/* Album Art */}
                <div className="w-80 h-80 mb-8">
                  <Image
                    src={currentSong.image || "/placeholder.svg"}
                    alt={currentSong.title}
                    width={320}
                    height={320}
                    className="w-full h-full object-cover rounded-lg shadow-2xl"
                  />
                </div>

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
                    <Heart className={cn("w-6 h-6", isFavorite && "fill-green-500 text-green-500")} />
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
          )}
        </AnimatePresence>

        <audio ref={audioRef} src={currentSong?.audio} preload="metadata" />
      </motion.div>
    </AnimatePresence>
  )
}
