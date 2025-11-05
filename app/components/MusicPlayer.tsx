"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  ArrowUp,
  ArrowDown,
  Save,
  Sparkles,
  ScrollText,
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
import EnhancedQueueManager from "./EnhancedQueueManager"

const NAV_HEIGHT = 64 // approx bottom nav height
const MINI_HEIGHT = 68 // approx mini player height

const playerVariants = {
  hidden: { opacity: 0, y: 100, scale: 0.95, transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] } },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1], staggerChildren: 0.05 },
  },
  exit: { opacity: 0, y: 100, scale: 0.95, transition: { duration: 0.2, ease: [0.4, 0.0, 1, 1] } },
}

const fullScreenVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 50, transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] } },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1], staggerChildren: 0.1 },
  },
  exit: { opacity: 0, scale: 0.9, y: 50, transition: { duration: 0.25, ease: [0.4, 0.0, 1, 1] } },
}

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1] } },
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

function formatTimeSec(time: number) {
  if (!time || isNaN(time)) return "0:00"
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

/* Lyrics panel with real-time sync */
type LrcLine = { t: number; text: string }
function parseLRC(raw: string): LrcLine[] {
  const lines = raw.split(/\r?\n/).filter(Boolean)
  const parsed: LrcLine[] = []
  const timeTag = /^\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,2}))?\]/
  for (const line of lines) {
    const match = line.match(timeTag)
    if (match) {
      const m = Number.parseInt(match[1] || "0", 10)
      const s = Number.parseInt(match[2] || "0", 10)
      const cs = Number.parseInt(match[3] || "0", 10)
      const t = m * 60 + s + cs / 100
      const text = line.replace(timeTag, "").trim()
      if (text) parsed.push({ t, text })
    }
  }
  return parsed.sort((a, b) => a.t - b.t)
}

function makeAutoSyncLines(raw: string, totalDuration: number): LrcLine[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []
  const chunk = Math.max(1, Math.floor(totalDuration / lines.length))
  return lines.map((text, i) => ({ t: Math.min(totalDuration - 1, i * chunk), text }))
}

function LyricsPanel({
  title,
  artist,
  currentTime,
  duration,
}: {
  title: string
  artist: string
  currentTime: number
  duration: number
}) {
  const [raw, setRaw] = useState<string>("")
  const [lrc, setLrc] = useState<LrcLine[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    async function loadLyrics() {
      try {
        const res = await fetch(`/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`)
        if (!res.ok) throw new Error("lyrics fetch failed")
        const data = await res.json()
        if (!active) return
        const text: string = data?.lyrics || ""
        setRaw(text)
        const parsed =
          text.includes("[") && text.includes("]") ? parseLRC(text) : makeAutoSyncLines(text, duration || 180)
        setLrc(parsed)
      } catch {
        // Fallback: simple placeholder synced to duration
        const fallback =
          `${title} - ${artist}\n\n` +
          "Enjoy the music while we fetch lyrics...\n" +
          "Real-time sync active\n" +
          "Stay tuned for the full lyrics!"
        setRaw(fallback)
        setLrc(makeAutoSyncLines(fallback, duration || 180))
      }
    }
    loadLyrics()
    return () => {
      active = false
    }
  }, [title, artist, duration])

  const activeIndex = useMemo(() => {
    if (!lrc.length) return -1
    let idx = lrc.findIndex((ln, i) => {
      const next = lrc[i + 1]
      if (next) {
        return currentTime >= ln.t && currentTime < next.t
      }
      return currentTime >= ln.t
    })
    if (idx === -1) idx = lrc.length - 1
    return idx
  }, [lrc, currentTime])

  useEffect(() => {
    if (activeIndex < 0) return
    const el = containerRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    if (el && "scrollIntoView" in el) {
      ;(el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [activeIndex])

  return (
    <div className="w-full h-64 md:h-80 lg:h-[400px] bg-black/30 border border-white/10 rounded-xl overflow-hidden">
      <div ref={containerRef} className="h-full overflow-y-auto p-4 space-y-2">
        {lrc.length ? (
          lrc.map((line, i) => (
            <div
              key={i}
              data-idx={i}
              className={cn(
                "text-gray-300 text-sm md:text-base transition-colors duration-300",
                i === activeIndex ? "text-white font-semibold" : "text-gray-400",
              )}
            >
              {line.text}
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-sm">{raw || "Lyrics not available."}</div>
        )}
      </div>
    </div>
  )
}

const QueueView = ({ onClose }: { onClose: () => void }) => {
  const {
    queue,
    queueIndex,
    currentSong,
    playFromQueue,
    removeFromQueue,
    clearQueue,
    moveQueueItem,
    saveQueueAsPlaylist,
    generateRelatedSongs,
  } = useStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
      className="fixed inset-x-2 md:inset-x-10 z-[70]"
      style={{
        bottom: `calc(${NAV_HEIGHT}px + ${MINI_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`,
      }}
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl max-h-[60vh] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-white font-semibold">Queue ({queue.length})</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const pl = saveQueueAsPlaylist()
                toast({ title: "Queue saved", description: `Saved as "${pl.name}"` })
              }}
              className="text-xs bg-transparent border-gray-700"
            >
              <Save className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                if (currentSong) {
                  const added = await generateRelatedSongs(currentSong, 10)
                  toast({ title: "Related songs added", description: `${added.length} songs appended` })
                }
              }}
              className="text-xs bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Related
            </Button>
            <Button size="sm" variant="outline" onClick={clearQueue} className="text-xs bg-transparent border-gray-700">
              Clear
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[50vh]">
          {queue.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No songs in queue</p>
            </div>
          ) : (
            queue.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className={cn(
                  "flex items-center gap-3 p-3 hover:bg-gray-800/50 cursor-pointer border-l-2 transition-all duration-200",
                  index === queueIndex ? "border-l-green-500 bg-gray-800/30" : "border-l-transparent",
                )}
                onClick={() => playFromQueue(index)}
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
                <div className="text-gray-400 text-xs w-12 text-right">{formatTimeSec(song.duration)}</div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveQueueItem(index, Math.max(0, index - 1))
                    }}
                    className="text-gray-400 hover:text-white w-7 h-7"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveQueueItem(index, Math.min(queue.length - 1, index + 1))
                    }}
                    className="text-gray-400 hover:text-white w-7 h-7"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromQueue(index)
                    }}
                    className="text-gray-400 hover:text-white w-7 h-7"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function MusicPlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showLyrics, setShowLyrics] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  const skipThresholdRef = useRef<number>(3) // 3 seconds to determine a skip

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
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
    userData,
    updateSongDuration,
    trackInteraction, // Get track interaction function
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
          { src: currentSong.image || "/placeholder.svg?height=512&width=512", sizes: "512x512", type: "image/png" },
        ],
      })
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
      navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true))
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false))
      navigator.mediaSession.setActionHandler("previoustrack", () => handlePrevious())
      navigator.mediaSession.setActionHandler("nexttrack", () => handleNext())
      navigator.mediaSession.setActionHandler("seekto", (details: any) => {
        if (details.seekTime && audioRef.current) {
          audioRef.current.currentTime = details.seekTime
          setCurrentTime(details.seekTime)
        }
      })
      if (duration && !isNaN(duration)) {
        navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: currentTime })
      }
    } catch {}
  }, [currentSong, isPlaying, currentTime, duration, setIsPlaying, setCurrentTime])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime
      if (!isNaN(newTime) && isFinite(newTime)) setCurrentTime(newTime)
    }

    const patchDurationEverywhere = (d: number) => {
      if (currentSong?.id && d && Number.isFinite(d) && d > 0) {
        setDuration(d)
        updateSongDuration(currentSong.id, Math.round(d))
      }
    }

    const handleLoadedMetadata = () => patchDurationEverywhere(audio.duration)
    const handleDurationChange = () => patchDurationEverywhere(audio.duration)
    const handleCanPlay = () => patchDurationEverywhere(audio.duration)
    const handleError = () => {
      toast({
        title: "Playback Error",
        description: "Unable to play this song. Trying next song...",
        variant: "destructive",
      })
      setTimeout(() => {
        handleNext()
      }, 800)
    }
    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        handleNext()
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate as any, { passive: true } as any)
    audio.addEventListener("durationchange", handleDurationChange as any, { passive: true } as any)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata as any, { passive: true } as any)
    audio.addEventListener("canplay", handleCanPlay as any, { passive: true } as any)
    audio.addEventListener("error", handleError)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate as any)
      audio.removeEventListener("durationchange", handleDurationChange as any)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata as any)
      audio.removeEventListener("canplay", handleCanPlay as any)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [repeatMode, setCurrentTime, setDuration, updateSongDuration, currentSong?.id])

  // Handle audio source and playback
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return
    const audioUrl = currentSong.download_url || currentSong.audio
    if (!audioUrl || audioUrl.trim() === "") return

    if (audio.src !== audioUrl) {
      audio.src = audioUrl
      audio.load()
      setDuration(0)
      setCurrentTime(0)
    }

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong, setIsPlaying, setDuration, setCurrentTime])

  // Handle volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const handleNext = useCallback(() => playNext(), [playNext])
  const handlePrevious = useCallback(() => playPrevious(), [playPrevious])
  const handleProgressChange = useCallback(
    (vals: number[]) => {
      const [v] = vals
      if (audioRef.current && duration && !isNaN(duration) && duration > 0) {
        const newTime = (v / 100) * duration
        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
      }
    },
    [duration, setCurrentTime],
  )
  const handleVolumeChange = useCallback(
    (vals: number[]) => {
      const [v] = vals
      setVolume(v)
    },
    [setVolume],
  )

  const handleSkipTrack = useCallback(() => {
    if (currentSong && currentTime < skipThresholdRef.current) {
      trackInteraction(currentSong.id, "skip", Math.round(currentTime), Math.round(currentTime), Math.round(duration))
    }
    playNext()
  }, [currentSong, currentTime, duration, playNext, trackInteraction])

  useEffect(() => {
    if (!currentSong || !isPlaying) return

    const checkCompletion = setInterval(() => {
      if (audioRef.current) {
        const current = audioRef.current.currentTime
        const total = audioRef.current.duration
        const completionRate = (current / total) * 100

        // If song is more than 80% played, track as complete play
        if (completionRate > 80 && total > 0) {
          trackInteraction(currentSong.id, "complete", undefined, Math.round(current), Math.round(total))
          clearInterval(checkCompletion)
        }
      }
    }, 1000)

    return () => clearInterval(checkCompletion)
  }, [currentSong, isPlaying, trackInteraction])

  const toggleFavorite = useCallback(() => {
    if (!currentSong) return
    const isFavorite = userData.favorites.some((song) => song.id === currentSong.id)
    if (isFavorite) {
      removeFromFavorites(currentSong.id)
      trackInteraction(currentSong.id, "skip")
    } else {
      addToFavorites(currentSong)
      trackInteraction(currentSong.id, "like")
    }
  }, [currentSong, userData.favorites, addToFavorites, removeFromFavorites, trackInteraction])

  const cycleRepeat = useCallback(() => {
    // Enhanced repeat: off -> all -> one -> off
    const modes: Array<"off" | "all" | "one"> = ["off", "all", "one"]
    const idx = modes.indexOf(repeatMode as any)
    const next = modes[(idx + 1) % modes.length]
    setRepeatMode(next)
    const names = { off: "Repeat Off", one: "Repeat One", all: "Repeat All" }
    toast({ title: names[next], description: `Repeat mode set to ${names[next]}` })
  }, [repeatMode, setRepeatMode])

  const doShuffle = useCallback(() => {
    toggleShuffle()
    toast({ title: "Shuffle", description: "Shuffle toggled" })
  }, [toggleShuffle])

  const handleDownload = useCallback(() => {
    if (!currentSong) return
    if (isDownloaded) {
      toast({ title: "Already Downloaded", description: `${currentSong.title} is already in your downloads` })
    } else {
      addToDownloads(currentSong)
      toast({ title: "Download Started", description: `${currentSong.title} is being downloaded` })
    }
  }, [currentSong, isDownloaded, addToDownloads])

  const handleShare = useCallback(async () => {
    if (!currentSong) return
    const shareData = {
      title: `${currentSong.title} by ${currentSong.artist}`,
      text: `Check out this song: ${currentSong.title} by ${currentSong.artist}`,
      url: typeof window !== "undefined" ? window.location.href : "",
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast({ title: "Shared Successfully", description: "Song shared successfully" })
      } else {
        await navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`)
        toast({ title: "Copied to Clipboard", description: "Song details copied to clipboard" })
      }
    } catch {
      toast({ title: "Share Failed", description: "Unable to share this song", variant: "destructive" })
    }
  }, [currentSong])

  const progress =
    duration && !isNaN(duration) && isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0
  if (!currentSong) return null

  return (
    <div className="fixed left-0 right-0 z-[60]" style={{ bottom: 0 }}>
      <AnimatePresence mode="wait">
        {showQueue && <EnhancedQueueManager isOpen={showQueue} onClose={() => setShowQueue(false)} />}
      </AnimatePresence>

      {/* Mini player: placed above bottom nav using offset, avoiding overlap */}
      {!isExpanded && (
        <motion.div
          variants={playerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed left-0 right-0 bg-gradient-to-r from-gray-900/98 to-black/98 backdrop-blur-xl border-t border-gray-800/50 px-2 md:px-6 lg:px-8 md:py-3 py-3 pb-1.5 mb-2.5"
          style={{
            bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 8px)`,
          }}
        >
          <motion.div variants={childVariants} className="flex justify-center mb-1 md:mb-2"></motion.div>

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
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrevious}
                className="text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
              >
                <SkipBack className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Button>
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
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowQueue((v) => !v)}
                className="text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
              >
                <ListMusic className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSkipTrack} // Changed from handleNext
                className="text-gray-400 hover:text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
              >
                <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Button>
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
            <span>{formatTimeSec(currentTime)}</span>
            <span>{formatTimeSec(duration)}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Full player */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            variants={fullScreenVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-[65] flex flex-col"
          >
            <motion.div variants={childVariants} className="flex items-center justify-between p-3 md:p-6 lg:p-8 pt-6">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                    <MoreHorizontal className="w-6 h-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-700" align="end">
                  <DropdownMenuItem onClick={handleDownload} className="text-white hover:bg-gray-800">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} className="text-white hover:bg-gray-800">
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowQueue((v) => !v)} className="text-white hover:bg-gray-800">
                    <ListMusic className="mr-2 h-4 w-4" />
                    Show Queue
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={toggleFavorite} className="text-white hover:bg-gray-800">
                    <Heart className="mr-2 h-4 w-4" />
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 md:px-8 lg:px-16 gap-8">
              <motion.div
                variants={childVariants}
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[400px] lg:h-[400px] flex-shrink-0"
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

              <motion.div
                variants={childVariants}
                className="flex flex-col items-center lg:items-start w-full lg:w-auto lg:flex-1 max-w-md lg:max-w-none"
              >
                <div className="text-center lg:text-left mb-4 w-full">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
                    {currentSong.title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-400 truncate">{currentSong.artist}</p>
                  {currentSong.album && (
                    <p className="text-base md:text-lg text-gray-500 truncate mt-1">{currentSong.album}</p>
                  )}
                </div>

                <div className="w-full mb-4">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={handleProgressChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{formatTimeSec(currentTime)}</span>
                    <span>{formatTimeSec(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4 sm:space-x-6 md:space-x-8 mb-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={doShuffle}
                    className={cn("text-gray-400 hover:text-white", isShuffled && "text-green-500")}
                  >
                    <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handlePrevious}
                    className="text-white hover:text-gray-300"
                  >
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  </Button>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSkipTrack}
                    className="text-white hover:text-gray-300"
                  >
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={cycleRepeat}
                    className={cn("text-gray-400 hover:text-white", repeatMode !== "off" && "text-green-500")}
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="w-5 h-5 md:w-6 md:h-6" />
                    ) : (
                      <Repeat className="w-5 h-5 md:w-6 md:h-6" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowLyrics((v) => !v)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ScrollText className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                </div>

                <div className="flex items-center justify-between w-full mb-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleFavorite}
                    className="text-gray-400 hover:text-white"
                  >
                    <Heart className={cn("w-5 h-5 md:w-6 md:h-6", isFavorite && "fill-red-500 text-red-500")} />
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
                  <Button size="icon" variant="ghost" onClick={handleShare} className="text-gray-400 hover:text-white">
                    <Share className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                </div>

                {showLyrics && (
                  <LyricsPanel
                    title={currentSong.title}
                    artist={currentSong.artist}
                    currentTime={currentTime}
                    duration={duration || currentSong.duration || 180}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" playsInline />
    </div>
  )
}
