"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  TrendingUp,
  Headphones,
  Radio,
  Clock,
  Star,
  Loader2,
  User,
  Settings,
  LogOut,
  Download,
  Search,
  Music,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getActiveHolidays } from "@/lib/holidays"
import { getPopularPlaylists } from "@/lib/playlists"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: [0.0, 0.0, 0.2, 1], staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.0, 0.0, 0.2, 1] } },
}

const quickAccessItems = [
  { name: "Liked Songs", icon: Heart, color: "from-purple-500 to-pink-500", type: "favorites" },
  { name: "Recently Played", icon: Clock, color: "from-green-500 to-emerald-500", type: "recent" },
  { name: "Downloads", icon: Download, color: "from-blue-500 to-cyan-500", type: "downloads" },
  { name: "Discover Weekly", icon: Star, color: "from-orange-500 to-red-500", type: "discover" },
  { name: "Daily Mix 1", icon: Radio, color: "from-indigo-500 to-purple-500", type: "mix" },
  { name: "Chill Hits", icon: Headphones, color: "from-teal-500 to-blue-500", type: "chill" },
]

const moodCategories = [
  {
    slug: "happy",
    name: "Happy",
    emoji: "😊",
    color: "from-yellow-400 to-orange-400",
    keywords: ["happy", "upbeat", "cheerful"],
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=faces",
  },
  {
    slug: "chill",
    name: "Chill",
    emoji: "😌",
    color: "from-blue-400 to-cyan-400",
    keywords: ["chill", "relaxed", "calm"],
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop&crop=center",
  },
  {
    slug: "energetic",
    name: "Energetic",
    emoji: "⚡",
    color: "from-red-400 to-pink-400",
    keywords: ["energetic", "workout", "pump"],
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f9b2d8b?w=150&h=150&fit=crop&crop=center",
  },
  {
    slug: "romantic",
    name: "Romantic",
    emoji: "💕",
    color: "from-pink-400 to-rose-400",
    keywords: ["romantic", "love", "ballad"],
    thumbnail: "https://images.unsplash.com/photo-1518199266791-0a1dd7228f2d?w=150&h=150&fit=crop&crop=center",
  },
  {
    slug: "focus",
    name: "Focus",
    emoji: "🎯",
    color: "from-green-400 to-emerald-400",
    keywords: ["focus", "study", "concentration"],
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=center",
  },
  {
    slug: "party",
    name: "Party",
    emoji: "🎉",
    color: "from-purple-400 to-pink-400",
    keywords: ["party", "dance", "celebration"],
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop&crop=center",
  },
]

export default function Home() {
  const [currentTime, setCurrentTime] = useState("")
  const [showAllTrending, setShowAllTrending] = useState(false)
  const [showAllPlaylists, setShowAllPlaylists] = useState(false) // Added state to track showing all playlists
  const [activeHolidays, setActiveHolidays] = useState<any[]>([])
  const [smartPlaylists, setSmartPlaylists] = useState<any[]>([])
  const router = useRouter()

  const {
    trendingSongs = [],
    userData,
    isLoading,
    error,
    currentSong,
    isPlaying,
    curatedPlaylists,
    popularPlaylists = [],
    fetchTrendingSongs,
    fetchPopularPlaylists,
    playSong,
    addToFavorites,
    removeFromFavorites,
    addToQueue,
    searchContent,
    updateMoodPlaylists,
    recentlyPlayed = [],
  } = useStore()

  useEffect(() => {
    setActiveHolidays(getActiveHolidays())

    fetchTrendingSongs()
    fetchPopularPlaylists()
    const loadPlaylistsWithSongs = async () => {
      try {
        // Get popular playlists from store data which is already fetched
        if (Array.isArray(popularPlaylists) && popularPlaylists.length > 0) {
          setSmartPlaylists(popularPlaylists.slice(0, 20))
        }
      } catch (err) {
        console.error("Error loading playlists:", err)
      }
    }
    loadPlaylistsWithSongs()

    const refreshInterval = setInterval(
      () => {
        fetchTrendingSongs()
        fetchPopularPlaylists()
        updateMoodPlaylists()
        setActiveHolidays(getActiveHolidays())
      },
      5 * 60 * 1000,
    )
    return () => clearInterval(refreshInterval)
  }, [fetchTrendingSongs, fetchPopularPlaylists, updateMoodPlaylists, popularPlaylists])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const displayHours = hours % 12 || 12
      setCurrentTime(`${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const handlePlaySong = useCallback(
    (song: any, playlist?: any[]) => {
      playSong(song, playlist)
    },
    [playSong],
  )

  const toggleFavorite = useCallback(
    (song: any) => {
      if (!song || !userData?.favorites) return
      const isFavorite = userData.favorites.some((fav) => fav.id === song.id)
      if (isFavorite) removeFromFavorites(song.id)
      else addToFavorites(song)
    },
    [userData?.favorites, addToFavorites, removeFromFavorites],
  )

  const handleQuickAccess = useCallback(
    (item: any) => {
      switch (item.type) {
        case "favorites":
          router.push("/library?type=favorites")
          break
        case "recent":
          router.push("/library?type=recent")
          break
        case "downloads":
          router.push("/downloads")
          break
        case "discover":
          router.push("/mood/happy")
          break
        case "mix":
          searchContent("daily mix party")
          break
        case "chill":
          router.push("/mood/chill")
          break
        default:
          router.push("/library")
      }
    },
    [router, searchContent],
  )

  const handleMoodClick = useCallback(
    async (mood: any) => {
      router.push(`/mood/${mood.slug}`)
    },
    [router],
  )

  const userName =
    (typeof window !== "undefined" && localStorage.getItem("username")) || userData?.name || "Music Lover"
  const userEmail = (typeof window !== "undefined" && localStorage.getItem("email")) || userData?.email || ""
  const userAvatar = (typeof window !== "undefined" && localStorage.getItem("userImage")) || userData?.avatar || ""

  const safeTrendingSongs = Array.isArray(trendingSongs) ? trendingSongs : []
  const safeRecentlyPlayed = Array.isArray(userData?.recentlyPlayed) ? userData.recentlyPlayed : []
  const safeFavorites = Array.isArray(userData?.favorites) ? userData.favorites : []
  const safeDownloads = Array.isArray(userData?.downloads) ? userData.downloads : []
  const displayedTrending = showAllTrending ? safeTrendingSongs : safeTrendingSongs.slice(0, 10)

  const formatDuration = (duration: number | string) => {
    if (typeof duration === "string") return duration
    if (!duration || isNaN(duration)) return "0:00"
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getSmartPlaylists = useCallback(async () => {
    try {
      const safeRecentlyPlayed = Array.isArray(recentlyPlayed) ? recentlyPlayed : []

      if (!safeRecentlyPlayed || safeRecentlyPlayed.length === 0) {
        return popularPlaylists || []
      }

      const recentGenres = safeRecentlyPlayed
        .slice(0, 10)
        .map((s) => s.genre || s.mood || "")
        .filter(Boolean)
      const uniqueGenres = [...new Set(recentGenres)]

      if (uniqueGenres.length === 0) {
        return popularPlaylists || []
      }

      const playlistPromises = uniqueGenres.slice(0, 3).map((genre) => getPopularPlaylists(`${genre} playlist`))

      const results = await Promise.all(playlistPromises)
      const fetchedSmartPlaylists = results.flat().slice(0, 8)

      return fetchedSmartPlaylists.length > 0 ? fetchedSmartPlaylists : popularPlaylists || []
    } catch (error) {
      console.log("[v0] Error fetching smart playlists:", error)
      return popularPlaylists || []
    }
  }, [recentlyPlayed, popularPlaylists])

  useEffect(() => {
    const safeRecentlyPlayed = Array.isArray(recentlyPlayed) ? recentlyPlayed : []
    if (safeRecentlyPlayed.length > 0) {
      getSmartPlaylists().then(setSmartPlaylists)
    } else {
      setSmartPlaylists(popularPlaylists || [])
    }
  }, [recentlyPlayed, getSmartPlaylists, popularPlaylists])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      {/* Top Bar */}
      <motion.header variants={itemVariants} className="sticky top-0 z-40 border-b border-white/10">
        <div className="w-full px-3 py-2 sm:px-6 sm:py-3 bg-black/30 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20">
                <Image
                  src="/musica-logo.png"
                  alt="Musica Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative">
                <h1
                  className="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white"
                  style={{ backgroundSize: "200% auto" }}
                >
                  Musica
                </h1>
                <span className="sr-only">Musica Home</span>
              </div>
              <div className="hidden sm:flex items-center text-xs text-white/60 border border-white/10 rounded-full px-2 py-0.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                Fast & Ad‑Free
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-white text-sm tabular-nums">{currentTime}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/search")}
                className="text-white hover:bg-white/10 px-3"
              >
                <Search className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Search</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                      <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-500 text-white">
                        {userName[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border border-gray-700" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-gray-400">{userEmail}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="text-white hover:bg-gray-800 cursor-pointer"
                    onClick={() => router.push("/profile")}
                  >
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white hover:bg-gray-800 cursor-pointer"
                    onClick={() => router.push("/downloads")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Downloads
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white hover:bg-gray-800 cursor-pointer"
                    onClick={() => router.push("/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="text-red-400 hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      localStorage.clear()
                      window.location.reload()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <div className="w-full px-2 py-4 pb-40 sm:px-4 sm:py-6 sm:pb-40">
        {/* Greeting */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={getGreeting()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <div className="text-4xl sm:text-5xl">🎵</div>
              <div>
                <motion.h2
                  className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent"
                  animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  style={{ backgroundSize: "200% auto" }}
                >
                  {getGreeting()}, {userName}
                </motion.h2>
                <motion.p
                  className="text-gray-400 text-base sm:text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Ready to discover some great music?
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Quick Access */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Quick Access</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickAccessItems.map((item, index) => {
              let count = 0
              if (item.type === "favorites") count = safeFavorites.length
              else if (item.type === "recent") count = safeRecentlyPlayed.length
              else if (item.type === "downloads") count = safeDownloads.length
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => handleQuickAccess(item)}
                  className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 border border-white/10 hover:border-white/20"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <div
                      className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center`}
                    >
                      <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-base sm:text-lg truncate">{item.name}</h4>
                      <p className="text-gray-400 text-sm sm:text-base">{count} songs</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/10 w-10 h-10 sm:w-12 sm:h-12"
                    >
                      <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Browse by Mood */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Browse by Mood</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
            {moodCategories.map((mood, index) => (
              <motion.div
                key={mood.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => handleMoodClick(mood)}
                className={`aspect-square bg-gradient-to-br ${mood.color} rounded-xl p-3 sm:p-4 cursor-pointer hover:scale-105 transition-transform duration-300 relative overflow-hidden`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <Image
                  src={mood.thumbnail || "/placeholder.svg"}
                  alt={mood.name}
                  width={150}
                  height={150}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="text-2xl sm:text-3xl">{mood.emoji}</div>
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">{mood.name}</h4>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Popular Playlists */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-white">Popular Playlists</h3>
            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => router.push("/library")}>
              Show all
            </Button>
          </div>
          <ScrollArea className="w-full">
            <div className="flex space-x-4 sm:space-x-6 pb-4">
              {popularPlaylists.slice(0, 8).map((playlist, index) => (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => router.push(`/playlist/${playlist.id}`)}
                  className="min-w-[180px] sm:min-w-[220px] bg-white/5 hover:bg-white/10 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-white/20"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative mb-4 sm:mb-6">
                    <Image
                      src={playlist.image || "/placeholder.svg?height=180&width=180&query=popular+playlist+cover"}
                      alt={playlist.name}
                      width={180}
                      height={180}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <Button
                        size="icon"
                        className="bg-green-500 hover:bg-green-600 rounded-full w-12 h-12 sm:w-14 sm:h-14"
                      >
                        <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        const song = { id: playlist.id }
                        toggleFavorite(song)
                      }}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 w-8 h-8"
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4",
                          safeFavorites.some((fav) => fav?.id === playlist.id)
                            ? "fill-red-500 text-red-500"
                            : "text-white",
                        )}
                      />
                    </Button>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold truncate mb-2 text-base sm:text-lg">{playlist.name}</h4>
                    <p className="text-gray-400 text-sm sm:text-base truncate">
                      {playlist.description || "Popular collection"}
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 tabular-nums">
                      {playlist.songCount || playlist.songs?.length || 0} songs
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </motion.div>

        {activeHolidays.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">
              {activeHolidays[0].emoji} {activeHolidays[0].name} Specials
            </h3>
            <div className={`bg-gradient-to-r ${activeHolidays[0].color} rounded-2xl p-6 sm:p-8 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl sm:text-3xl font-bold mb-2">{activeHolidays[0].name}</h4>
                  <p className="text-sm sm:text-base opacity-90">Discover the perfect soundtrack for celebration</p>
                </div>
                <div className="text-6xl sm:text-8xl opacity-20">{activeHolidays[0].emoji}</div>
              </div>
              <Button
                onClick={() => searchContent(activeHolidays[0].keywords[0])}
                className="mt-4 bg-white text-gray-900 hover:bg-gray-100 font-semibold"
              >
                Explore {activeHolidays[0].name} Playlist
              </Button>
            </div>
          </motion.div>
        )}

        {/* Recommended For You / Discover New Playlists */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4 ml-4 md:ml-6">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {recentlyPlayed && Array.isArray(recentlyPlayed) && recentlyPlayed.length > 0
                ? "Recommended For You"
                : "Discover New Playlists"}
            </h2>
            {!showAllPlaylists && (smartPlaylists?.length || popularPlaylists?.length) > 8 && (
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowAllPlaylists(true)}
              >
                Show all
              </Button>
            )}
          </div>

          {showAllPlaylists ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 md:p-6">
              {(smartPlaylists && Array.isArray(smartPlaylists) && smartPlaylists.length > 0
                ? smartPlaylists
                : popularPlaylists || []
              ).map((playlist: any, index: number) => (
                <motion.div
                  key={`${playlist.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => router.push(`/playlist/${playlist.id}`)}
                  className="bg-white/5 hover:bg-white/10 rounded-xl p-4 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-white/20"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative mb-4">
                    <Image
                      src={playlist.image || "/placeholder.svg?height=180&width=180"}
                      alt={playlist.name || "Playlist"}
                      width={180}
                      height={180}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <Button
                        size="icon"
                        className="bg-green-500 hover:bg-green-600 rounded-full w-12 h-12 sm:w-14 sm:h-14"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/playlist/${playlist.id}`)
                        }}
                      >
                        <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold truncate mb-2 text-base sm:text-lg">{playlist.name}</h4>
                    <p className="text-gray-400 text-sm sm:text-base truncate">
                      {playlist.description || "Popular collection"}
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 tabular-nums">
                      {playlist.songCount || playlist.songs?.length || 0} songs
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-4 p-4 md:p-6">
                {(smartPlaylists && Array.isArray(smartPlaylists) && smartPlaylists.length > 0
                  ? smartPlaylists
                  : popularPlaylists || []
                )
                  .slice(0, 8)
                  .map((playlist: any, index: number) => (
                    <motion.div
                      key={`${playlist.id}-${index}`}
                      className="flex-shrink-0 w-40 sm:w-48"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => router.push(`/playlist/${playlist.id}`)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="bg-white/5 hover:bg-white/10 rounded-xl p-3 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-white/20 h-full">
                        <div className="relative mb-3">
                          <Image
                            src={playlist.image || "/placeholder.svg?height=150&width=150"}
                            alt={playlist.name || "Playlist"}
                            width={150}
                            height={150}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Button
                              size="icon"
                              className="bg-green-500 hover:bg-green-600 rounded-full w-10 h-10"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/playlist/${playlist.id}`)
                              }}
                            >
                              <Play className="w-5 h-5 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="text-white font-semibold truncate mb-1 text-sm">{playlist.name}</h4>
                        <p className="text-gray-400 text-xs truncate">{playlist.description || "Popular collection"}</p>
                        <p className="text-gray-500 text-xs mt-1 tabular-nums">
                          {playlist.songCount || playlist.songs?.length || 0} songs
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {showAllPlaylists && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllPlaylists(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Show Less
              </Button>
            </div>
          )}
        </div>

        {/* Trending Now */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Trending Now
            </h3>
            <div className="flex items-center gap-2">
              {!showAllTrending && safeTrendingSongs.length > 10 && (
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowAllTrending(true)}
                >
                  Show all
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => fetchTrendingSongs()}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 sm:py-16">
              <div className="flex items-center space-x-3 text-gray-400">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                <span className="text-base sm:text-lg">Loading trending songs...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 sm:p-6">
              <p className="text-red-400 text-center mb-4 text-base sm:text-lg">{error}</p>
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchTrendingSongs()}
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : displayedTrending.length > 0 ? (
            <>
              {showAllTrending ? (
                <div className="space-y-2 sm:space-y-3">
                  {displayedTrending.map((song, index) => {
                    if (!song) return null
                    const isFavorite = safeFavorites.some((fav) => fav?.id === song.id)
                    return (
                      <motion.div
                        key={song.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors"
                      >
                        <div className="relative">
                          <Image
                            src={song.image || "/placeholder.svg?height=56&width=56"}
                            alt={song.title || "Song"}
                            width={48}
                            height={48}
                            className="rounded-lg sm:w-14 sm:h-14"
                          />
                          <div
                            onClick={() => handlePlaySong(song, displayedTrending)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                          >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate text-base sm:text-lg">
                            {song.title || "Unknown Song"}
                          </h4>
                          <p className="text-gray-400 text-sm sm:text-base truncate">
                            {song.artist || "Unknown Artist"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className="text-gray-400 text-sm tabular-nums">{formatDuration(song.duration)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(song)
                            }}
                            className="text-gray-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                          >
                            <Heart
                              className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5",
                                safeFavorites.some((fav) => fav?.id === song.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-white",
                              )}
                            />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-gray-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                              >
                                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-40 bg-gray-900 border-gray-700">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToQueue(song)
                                }}
                                className="text-white hover:bg-gray-800 cursor-pointer"
                              >
                                Add to Queue
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(song)
                                }}
                                className="text-white hover:bg-gray-800 cursor-pointer"
                              >
                                {safeFavorites.some((fav) => fav?.id === song.id)
                                  ? "Remove from Favorites"
                                  : "Add to Favorites"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <div className="flex space-x-4 sm:space-x-6 pb-4">
                    {displayedTrending.map((song, index) => {
                      if (!song) return null
                      const isFavorite = safeFavorites.some((fav) => fav?.id === song.id)
                      return (
                        <motion.div
                          key={song.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06 }}
                          className="min-w-[180px] sm:min-w-[220px] bg-white/5 hover:bg-white/10 rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-white/20"
                        >
                          <div className="relative mb-4 sm:mb-6">
                            <Image
                              src={song.image || "/placeholder.svg?height=180&width=180"}
                              alt={song.title || "Song"}
                              width={180}
                              height={180}
                              className="w-full aspect-square object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <Button
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePlaySong(song, displayedTrending)
                                }}
                                className="bg-green-500 hover:bg-green-600 rounded-full w-12 h-12 sm:w-14 sm:h-14"
                              >
                                {currentSong?.id === song.id && isPlaying ? (
                                  <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                                ) : (
                                  <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" />
                                )}
                              </Button>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(song)
                              }}
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 w-8 h-8"
                            >
                              <Heart
                                className={cn(
                                  "w-4 h-4",
                                  safeFavorites.some((fav) => fav?.id === song.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-white",
                                )}
                              />
                            </Button>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold truncate mb-2 text-base sm:text-lg">
                              {song.title || "Unknown Song"}
                            </h4>
                            <p className="text-gray-400 text-sm sm:text-base truncate">
                              {song.artist || "Unknown Artist"}
                            </p>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1 tabular-nums">
                              {formatDuration(song.duration)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <Music className="w-16 h-16 sm:w-20 sm:h-20 text-gray-600 mx-auto mb-6" />
              <p className="text-gray-400 mb-6 text-base sm:text-lg">No trending songs available</p>
              <Button
                variant="outline"
                onClick={() => fetchTrendingSongs()}
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                Refresh
              </Button>
            </div>
          )}
        </motion.div>

        {/* Recently Played */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-white">Recently Played</h3>
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => router.push("/library?type=recent")}
            >
              Show all
            </Button>
          </div>
          {safeRecentlyPlayed.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {safeRecentlyPlayed.slice(0, 5).map((song, index) => {
                if (!song) return null
                return (
                  <motion.div
                    key={song.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="flex items-center space-x-4 sm:space-x-6 p-3 sm:p-4 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors"
                    onClick={() => handlePlaySong(song, safeRecentlyPlayed)}
                  >
                    <div className="relative">
                      <Image
                        src={song.image || "/placeholder.svg?height=56&width=56"}
                        alt={song.title || "Song"}
                        width={48}
                        height={48}
                        className="rounded-lg sm:w-14 sm:h-14"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate text-base sm:text-lg">
                        {song.title || "Unknown Song"}
                      </h4>
                      <p className="text-gray-400 text-sm sm:text-base truncate">{song.artist || "Unknown Artist"}</p>
                    </div>
                    <div className="text-gray-400 text-sm tabular-nums">{formatDuration(song.duration)}</div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-base sm:text-lg">No recently played songs</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
