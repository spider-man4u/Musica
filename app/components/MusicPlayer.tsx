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
  Mic2,
  Save,
  ArrowUp,
  ArrowDown,
  PlayCircle,
  PlusCircle,
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

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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

type LyricLine = { t?: number; text: string }

const useLyrics = (title?: string, artist?: string) => {
  const [lines, setLines] = useState<LyricLine[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!title) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist || "")}`,
          {
            cache: "no-store",
          },
        )
        const data = await res.json()
        if (!cancelled) {
          if (data?.lines?.length) setLines(data.lines as LyricLine[])
          else if (data?.fallback?.lyrics) {
            setLines(
              String(data.fallback.lyrics)
                .split("\n")
                .map((text: string) => ({ text })),
            )
          } else {
            setLines([])
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Lyrics unavailable")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [title, artist])

  return { lines, loading, error }
}

const LyricsView = ({
  lines,
  currentTime,
}: {
  lines: LyricLine[]
  currentTime: number
}) => {
  const activeIndex = useMemo(() => {
    if (!lines.length) return -1
    // Find last line with t <= currentTime
    let idx = -1
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].t
      if (typeof t === "number" && t <= currentTime) idx = i
    }
    return idx
  }, [lines, currentTime])

  return (
    <div className="relative max-h-56 overflow-y-auto rounded-xl bg-white/5 p-4 border border-gray-700">
      {!lines.length ? (
        <p className="text-gray-400 text-sm">Lyrics are not available for this track.</p>
      ) : (
        <ul className="space-y-2">
          {lines.map((l, i) => {
            const active = i === activeIndex
            return (
              <li
                key={`${i}-${l.text.slice(0, 12)}`}
                className={cn("text-sm transition-all", active ? "text-white font-semibold" : "text-gray-400")}
              >
                {l.text}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const QueueView = ({ onClose }: { onClose: () => void }) => {
  const {
    queue,
    queueIndex,
    currentSong,
    removeFromQueue,
    moveQueueItem,
    playFromQueue,
    saveQueueAsPlaylist,
    clearQueue,
  } = useStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="absolute bottom-full left-0 right-0 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-t-xl max-h-[70vh] overflow-hidden shadow-2xl"
    >
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Queue</h3>
          <p className="text-xs text-gray-400">
            {queue.length} {queue.length === 1 ? "song" : "songs"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs bg-transparent border-gray-700"
            onClick={() => {
              const playlist = saveQueueAsPlaylist()
              toast({
                title: "Queue saved",
                description: `Saved as "${playlist.name}"`,
              })
            }}
          >
            <Save className="mr-2 h-3 w-3" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={clearQueue} className="text-xs">
            Clear
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[60vh]">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-60" />
            Your queue is empty
          </div>
        ) : (
          queue.map((song, index) => (
            <div
              key={`${song.id}-${index}`}
              className={cn(
                "flex items-center gap-3 px-4 py-2 border-b border-gray-800/60",
                index === queueIndex && "bg-white/5",
              )}
            >
              <div className="w-6 text-center">
                {index === queueIndex && currentSong?.id === song.id ? (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto animate-pulse" />
                ) : (
                  <span className="text-gray-500 text-xs">{index + 1}</span>
                )}
              </div>
              <SafeImage src={song.image} alt={song.title} width={36} height={36} className="rounded" />
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  playFromQueue(index)
                  onClose()
                }}
              >
                <p className="text-white text-sm font-medium truncate">{song.title}</p>
                <p className="text-gray-400 text-xs truncate">{song.artist}</p>
              </div>

              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => moveQueueItem(index, Math.max(0, index - 1))}>
                  <ArrowUp className="w-4 h-4 text-gray-300" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => moveQueueItem(index, Math.min(queue.length - 1, index + 1))}
                >
                  <ArrowDown className="w-4 h-4 text-gray-300" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal className="w-4 h-4 text-gray-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-900 border-gray-700" align="end">
                    <DropdownMenuItem onClick={() => playFromQueue(index)} className="text-white">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Play now
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => moveQueueItem(index, Math.min(queue.length - 1, queueIndex + 1))}
                      className="text-white"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Play next
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem onClick={() => removeFromQueue(index)} className="text-red-400">
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default function MusicPlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const durationPollRef = useRef<NodeJS.Timeout | null>(null)

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

  const { lines: lyricLines, loading: lyricsLoading } = useLyrics(currentSong?.title, currentSong?.artist)

  // Audio event listeners + robust duration fix
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateDurationIfValid = (fallback?: number) => {
      const d = audio.duration
      if (d && !isNaN(d) && isFinite(d) && d > 0) {
        setDuration(d)
        if (durationPollRef.current) {
          clearInterval(durationPollRef.current)
          durationPollRef.current = null
        }
      } else if (typeof fallback === "number" && fallback > 0) {
        setDuration(fallback)
      }
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => updateDurationIfValid(currentSong?.duration || 0)
    const handleDurationChange = () => updateDurationIfValid(currentSong?.duration || 0)
    const handleCanPlay = () => updateDurationIfValid(currentSong?.duration || 0)
    const handleCanPlayThrough = () => updateDurationIfValid(currentSong?.duration || 0)

    const handleError = () => {
      toast({
        title: "Playback Error",
        description: "Unable to play this song. Skipping...",
        variant: "destructive",
      })
      setTimeout(() => handleNext(), 800)
    }

    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0
        audio.play().catch(() => setIsPlaying(false))
      } else {
        handleNext()
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("canplaythrough", handleCanPlayThrough)
    audio.addEventListener("error", handleError)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("canplaythrough", handleCanPlayThrough)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("ended", handleEnded)
      if (durationPollRef.current) {
        clearInterval(durationPollRef.current)
        durationPollRef.current = null
      }
    }
  }, [repeatMode, setCurrentTime, setDuration, currentSong?.duration])

  // Handle audio source and autoplay + duration polling fallback
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    const src = (currentSong.download_url || currentSong.audio || "").trim()
    if (!src) {
      toast({ title: "No audio source", description: "This track has no playable audio.", variant: "destructive" })
      return
    }

    audio.crossOrigin = "anonymous"
    if (audio.src !== src) {
      audio.src = src
      audio.preload = "metadata"
      audio.load()
      setCurrentTime(0)
      setDuration(0)

      // Poll for duration for a short time to handle slow metadata or CORS quirks
      if (durationPollRef.current) clearInterval(durationPollRef.current)
      durationPollRef.current = setInterval(() => {
        const d = audio.duration
        if (d && !isNaN(d) && isFinite(d) && d > 0) {
          setDuration(d)
          if (durationPollRef.current) {
            clearInterval(durationPollRef.current)
            durationPollRef.current = null
          }
        }
      }, 250)
      setTimeout(() => {
        if (durationPollRef.current) {
          clearInterval(durationPollRef.current)
          durationPollRef.current = null
          // final fallback to known duration from the song object
          if (currentSong.duration && currentSong.duration > 0) setDuration(currentSong.duration)
        }
      }, 3000)
    }

    if (isPlaying) {
      const p = audio.play()
      if (p) p.catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [currentSong, isPlaying, setCurrentTime, setDuration, setIsPlaying])

  // Volume/mute
  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const handleNext = useCallback(() => {
    useStore.getState().playNext()
  }, [])
  const handlePrevious = useCallback(() => {
    useStore.getState().playPrevious()
  }, [])

  const handleProgressChange = useCallback(
    (newValue: number[]) => {
      const [percent] = newValue
      const audio = audioRef.current
      if (audio && duration && !isNaN(duration) && duration > 0) {
        const newTime = (percent / 100) * duration
        audio.currentTime = newTime
        setCurrentTime(newTime)
      }
    },
    [duration, setCurrentTime],
  )

  const handleSeekExact = useCallback(
    (newValue: number[]) => {
      const [newTime] = newValue
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = newTime
        setCurrentTime(newTime)
      }
    },
    [setCurrentTime],
  )

  const handleVolumeChange = useCallback((newValue: number[]) => setVolume(newValue[0]), [setVolume])

  const toggleFavorite = useCallback(() => {
    if (!currentSong) return
    if (isFavorite) {
      removeFromFavorites(currentSong.id)
      toast({ title: "Removed from Favorites", description: `${currentSong.title}` })
    } else {
      addToFavorites(currentSong)
      toast({ title: "Added to Favorites", description: `${currentSong.title}` })
    }
  }, [currentSong, isFavorite, addToFavorites, removeFromFavorites])

  const toggleRepeat = useCallback(() => {
    const modes: Array<"off" | "all" | "one"> = ["off", "all", "one"]
    const idx = modes.indexOf(repeatMode)
    const nextMode = modes[(idx + 1) % modes.length]
    setRepeatMode(nextMode)
    const modeNames = { off: "Repeat Off", one: "Repeat One", all: "Repeat All" }
    toast({ title: modeNames[nextMode], description: `Repeat set to ${modeNames[nextMode]}` })
  }, [repeatMode, setRepeatMode])

  const handleDownload = useCallback(() => {
    if (!currentSong) return
    if (isDownloaded) {
      toast({ title: "Already Downloaded", description: currentSong.title })
    } else {
      addToDownloads(currentSong)
      toast({ title: "Download Started", description: currentSong.title })
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
        toast({ title: "Shared Successfully" })
      } else {
        await navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`)
        toast({ title: "Copied to Clipboard" })
      }
    } catch {
      toast({ title: "Share Failed", variant: "destructive" })
    }
  }, [currentSong])

  const formatTime = useCallback((time: number) => {
    if (!time || isNaN(time) || !isFinite(time)) return "0:00"
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }, [])

  const progress = duration && duration > 0 ? (currentTime / duration) * 100 : 0
  if (!currentSong) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <AnimatePresence>{showQueue && <QueueView onClose={() => setShowQueue(false)} />}</AnimatePresence>

      {/* Mini player */}
      <div className="absolute bottom-16 left-0 right-0 bg-gradient-to-r from-gray-900/98 to-black/98 backdrop-blur-xl border-t border-gray-800/50 px-2 py-1 md:px-6 lg:px-8 md:py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div
            className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => setIsExpanded(true)}
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
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button size="icon" variant="ghost" onClick={handlePrevious} className="text-gray-300 hover:text-white">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white hover:bg-gray-200 text-black rounded-full w-8 h-8 sm:w-10 sm:h-10"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={handleNext} className="text-gray-300 hover:text-white">
              <SkipForward className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowQueue(!showQueue)}
              className="ml-1 border-gray-700 text-xs text-gray-200 bg-black/30 hover:bg-black/40"
            >
              <ListMusic className="w-3 h-3 mr-1" />
              Queue <span className="ml-1 rounded bg-emerald-500/20 px-1 text-emerald-300">{queue.length}</span>
            </Button>
          </div>
        </div>

        {/* Progress bar (exact seek for accessibility on desktop) */}
        <div className="mt-2 hidden md:block max-w-7xl mx-auto">
          <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeekExact} />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || currentSong.duration || 0)}</span>
          </div>
        </div>
        {/* Slim bar on mobile */}
        <div className="mt-1 block md:hidden">
          <div className="w-full bg-gray-700 rounded-full h-0.5">
            <motion.div
              className="bg-white rounded-full h-0.5"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        </div>
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-3 md:p-6 lg:p-8 pt-6 sm:pt-8 md:pt-12">
              <Button size="icon" variant="ghost" onClick={() => setIsExpanded(false)} className="text-white">
                <ChevronDown className="w-6 h-6" />
              </Button>
              <div className="text-center">
                <p className="text-gray-400 text-sm">PLAYING FROM</p>
                <p className="text-white font-medium">Musica</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-white">
                    <MoreHorizontal className="w-6 h-6" />
                  </Button>
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
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={toggleFavorite} className="text-white hover:bg-gray-800">
                    <Heart className={cn("mr-2 h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
                    {isFavorite ? "Remove Favorite" : "Add Favorite"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 md:px-8 lg:px-16 gap-8">
              <motion.div
                variants={childVariants}
                initial="hidden"
                animate="visible"
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px] flex-shrink-0"
              >
                <SafeImage
                  src={currentSong.image}
                  alt={currentSong.title}
                  width={420}
                  height={420}
                  className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  priority
                />
              </motion.div>

              <motion.div
                variants={childVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center lg:items-start w-full lg:w-auto lg:flex-1 max-w-md lg:max-w-none"
              >
                <div className="text-center lg:text-left mb-4 w-full">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
                    {currentSong.title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-300 truncate">{currentSong.artist}</p>
                  {currentSong.album && <p className="text-base text-gray-400 truncate mt-1">{currentSong.album}</p>}
                </div>

                {/* Seek slider */}
                <div className="w-full mb-3">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={handleProgressChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-300 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || currentSong.duration || 0)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4 sm:space-x-6 md:space-x-8 mb-5 md:mb-6">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleShuffle}
                    className={cn("text-gray-300 hover:text-white", isShuffled && "text-emerald-400")}
                  >
                    <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>

                  <Button size="icon" variant="ghost" onClick={handlePrevious} className="text-white">
                    <SkipBack className="w-6 h-6 md:w-8 md:h-8" />
                  </Button>

                  <Button
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-white hover:bg-gray-200 text-black rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 md:w-8 md:h-8" />
                    ) : (
                      <Play className="w-6 h-6 md:w-8 md:h-8 ml-1" />
                    )}
                  </Button>

                  <Button size="icon" variant="ghost" onClick={handleNext} className="text-white">
                    <SkipForward className="w-6 h-6 md:w-8 md:h-8" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleRepeat}
                    className={cn("text-gray-300 hover:text-white", repeatMode !== "off" && "text-emerald-400")}
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="w-5 h-5 md:w-6 md:h-6" />
                    ) : (
                      <Repeat className="w-5 h-5 md:w-6 md:h-6" />
                    )}
                  </Button>
                </div>

                {/* Lyrics + volume/share row */}
                <div className="flex items-center gap-3 w-full mb-3">
                  <Button
                    size="sm"
                    variant={showLyrics ? "default" : "outline"}
                    onClick={() => setShowLyrics((s) => !s)}
                    className={cn(
                      "border-gray-700",
                      showLyrics ? "bg-emerald-500 hover:bg-emerald-600 text-black" : "bg-transparent text-white",
                    )}
                  >
                    <Mic2 className="w-4 h-4 mr-2" />
                    {showLyrics ? "Hide Lyrics" : "Show Lyrics"}
                  </Button>

                  <div className="flex items-center gap-2 ml-auto">
                    <Button size="icon" variant="ghost" onClick={toggleMute} className="text-gray-300 hover:text-white">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="w-32"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleShare}
                      className="border-gray-700 text-white bg-transparent"
                    >
                      Share
                    </Button>
                  </div>
                </div>

                {showLyrics && (
                  <div className="w-full">
                    {lyricsLoading ? (
                      <div className="text-gray-400 text-sm">Loading lyrics...</div>
                    ) : (
                      <LyricsView lines={lyricLines} currentTime={currentTime} />
                    )}
                  </div>
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
