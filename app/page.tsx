"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  TrendingUp,
  Music,
  Headphones,
  Radio,
  Clock,
  Star,
  Loader2,
  User,
  Settings,
  LogOut,
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
import SearchBar from "./components/SearchBar"

const quickAccessItems = [
  { name: "Liked Songs", icon: Heart, color: "from-purple-500 to-pink-500", type: "favorites" },
  { name: "Recently Played", icon: Clock, color: "from-green-500 to-emerald-500", type: "recent" },
  { name: "My Playlist #1", icon: Music, color: "from-blue-500 to-cyan-500", type: "playlist" },
  { name: "Discover Weekly", icon: Star, color: "from-orange-500 to-red-500", type: "discover" },
  { name: "Daily Mix 1", icon: Radio, color: "from-indigo-500 to-purple-500", type: "mix" },
  { name: "Chill Hits", icon: Headphones, color: "from-teal-500 to-blue-500", type: "chill" },
]

const moodCategories = [
  { name: "Happy", emoji: "😊", color: "from-yellow-400 to-orange-400", keywords: ["happy", "upbeat", "cheerful"] },
  { name: "Chill", emoji: "😌", color: "from-blue-400 to-cyan-400", keywords: ["chill", "relaxed", "calm"] },
  { name: "Energetic", emoji: "⚡", color: "from-red-400 to-pink-400", keywords: ["energetic", "workout", "pump"] },
  { name: "Romantic", emoji: "💕", color: "from-pink-400 to-rose-400", keywords: ["romantic", "love", "ballad"] },
  { name: "Focus", emoji: "🎯", color: "from-green-400 to-emerald-400", keywords: ["focus", "study", "concentration"] },
  { name: "Party", emoji: "🎉", color: "from-purple-400 to-pink-400", keywords: ["party", "dance", "celebration"] },
]

export default function Home() {
  const [currentTime, setCurrentTime] = useState("")
  const [showAllTrending, setShowAllTrending] = useState(false)
  const [trendingPage, setTrendingPage] = useState(1)
  const router = useRouter()

  const {
    trendingSongs = [],
    userData,
    isLoading,
    error,
    currentSong,
    isPlaying,
    fetchTrendingSongs,
    setCurrentSong,
    setIsPlaying,
    addToFavorites,
    removeFromFavorites,
    searchContent,
  } = useStore()

  // Fetch trending songs on mount and refresh every 5 minutes
  useEffect(() => {
    fetchTrendingSongs()

    // Set up interval for refreshing trending songs
    const refreshInterval = setInterval(
      () => {
        fetchTrendingSongs()
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(refreshInterval)
  }, [fetchTrendingSongs])

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

  const playSong = useCallback(
    (song: any) => {
      if (!song) return
      setCurrentSong(song)
      setIsPlaying(true)
    },
    [setCurrentSong, setIsPlaying],
  )

  const toggleFavorite = useCallback(
    (song: any) => {
      if (!song || !userData?.favorites) return

      const isFavorite = userData.favorites.some((fav) => fav.id === song.id)
      if (isFavorite) {
        removeFromFavorites(song.id)
      } else {
        addToFavorites(song)
      }
    },
    [userData?.favorites, addToFavorites, removeFromFavorites],
  )

  const handleQuickAccess = useCallback(
    (item: any) => {
      switch (item.type) {
        case "favorites":
          router.push("/library?tab=favorites")
          break
        case "recent":
          router.push("/library?tab=recent")
          break
        case "playlist":
        case "discover":
        case "mix":
        case "chill":
          router.push("/library")
          break
        default:
          break
      }
    },
    [router],
  )

  const handleMoodClick = useCallback(
    async (mood: any) => {
      const randomKeyword = mood.keywords[Math.floor(Math.random() * mood.keywords.length)]
      await searchContent(randomKeyword)
      router.push(`/search?q=${randomKeyword}`)
    },
    [searchContent, router],
  )

  const handleShowAllTrending = () => {
    setShowAllTrending(true)
  }

  const loadMoreTrending = () => {
    setTrendingPage((prev) => prev + 1)
    // In a real app, this would fetch more songs
  }

  const userName = localStorage.getItem("username") || userData?.name || "Music Lover"
  const userEmail = localStorage.getItem("email") || userData?.email || ""

  // Safe access to arrays with fallbacks
  const safeTrendingSongs = Array.isArray(trendingSongs) ? trendingSongs : []
  const safeRecentlyPlayed = Array.isArray(userData?.recentlyPlayed) ? userData.recentlyPlayed : []
  const safeFavorites = Array.isArray(userData?.favorites) ? userData.favorites : []

  const displayedTrending = showAllTrending ? safeTrendingSongs : safeTrendingSongs.slice(0, 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* Musica Logo */}
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Musica</h1>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-8">
              <SearchBar />
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">{currentTime}</div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{userName[0]?.toUpperCase() || "U"}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-gray-400">{userEmail}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="text-white hover:bg-gray-800 cursor-pointer"
                    onClick={() => router.push("/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white hover:bg-gray-800 cursor-pointer"
                    onClick={() => router.push("/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    className="text-red-400 hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      localStorage.clear()
                      window.location.reload()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {/* Greeting Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {getGreeting()}, {userName}
          </h2>
          <p className="text-gray-400">Ready to discover some great music?</p>
        </div>

        {/* Quick Access Grid - Now Functional */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAccessItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleQuickAccess(item)}
                className="group bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center`}
                  >
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{item.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {item.type === "favorites"
                        ? `${safeFavorites.length} songs`
                        : item.type === "recent"
                          ? `${safeRecentlyPlayed.length} songs`
                          : "Playlist"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/10"
                  >
                    <Play className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Browse by Mood - Now Functional */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Browse by Mood</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {moodCategories.map((mood, index) => (
              <motion.div
                key={mood.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleMoodClick(mood)}
                className={`aspect-square bg-gradient-to-br ${mood.color} rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform duration-300 relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="text-3xl">{mood.emoji}</div>
                  <div>
                    <h4 className="text-white font-semibold">{mood.name}</h4>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trending Now - Enhanced with Show More and Infinite Scroll */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Trending Now
            </h3>
            {!showAllTrending && safeTrendingSongs.length > 10 && (
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={handleShowAllTrending}>
                Show all
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading trending songs...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-center mb-2">{error}</p>
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
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
                // List view for Show All
                <div className="space-y-2">
                  {displayedTrending.map((song, index) => {
                    if (!song) return null
                    const isFavorite = safeFavorites.some((fav) => fav?.id === song.id)

                    return (
                      <motion.div
                        key={song.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                      >
                        <div className="relative">
                          <Image
                            src={song.image || "/placeholder.svg?height=48&width=48"}
                            alt={song.title || "Song"}
                            width={48}
                            height={48}
                            className="rounded-lg"
                          />
                          <div
                            onClick={() => playSong(song)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                          >
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{song.title || "Unknown Song"}</h4>
                          <p className="text-gray-400 text-sm truncate">{song.artist || "Unknown Artist"}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(song)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                          >
                            <Heart className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Load More Button for Infinite Scroll */}
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={loadMoreTrending}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Load More
                    </Button>
                  </div>
                </div>
              ) : (
                // Card view for initial display
                <ScrollArea className="w-full">
                  <div className="flex space-x-4 pb-4">
                    {displayedTrending.map((song, index) => {
                      if (!song) return null
                      const isFavorite = safeFavorites.some((fav) => fav?.id === song.id)

                      return (
                        <motion.div
                          key={song.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="min-w-[200px] bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-white/20"
                        >
                          <div className="relative mb-4">
                            <Image
                              src={song.image || "/placeholder.svg?height=160&width=160"}
                              alt={song.title || "Song"}
                              width={160}
                              height={160}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Button
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  playSong(song)
                                }}
                                className="bg-green-500 hover:bg-green-600 rounded-full w-12 h-12"
                              >
                                {currentSong?.id === song.id && isPlaying ? (
                                  <Pause className="w-6 h-6" />
                                ) : (
                                  <Play className="w-6 h-6 ml-0.5" />
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
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                            >
                              <Heart
                                className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")}
                              />
                            </Button>
                          </div>
                          <div>
                            <h4 className="text-white font-medium truncate mb-1">{song.title || "Unknown Song"}</h4>
                            <p className="text-gray-400 text-sm truncate">{song.artist || "Unknown Artist"}</p>
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
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No trending songs available</p>
              <Button
                variant="outline"
                onClick={() => fetchTrendingSongs()}
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                Refresh
              </Button>
            </div>
          )}
        </div>

        {/* Recently Played - Synced with Real Data */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Recently Played</h3>
          {safeRecentlyPlayed.length > 0 ? (
            <div className="space-y-2">
              {safeRecentlyPlayed.slice(0, 5).map((song, index) => {
                if (!song) return null

                return (
                  <motion.div
                    key={song.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                    onClick={() => playSong(song)}
                  >
                    <div className="relative">
                      <Image
                        src={song.image || "/placeholder.svg?height=48&width=48"}
                        alt={song.title || "Song"}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{song.title || "Unknown Song"}</h4>
                      <p className="text-gray-400 text-sm truncate">{song.artist || "Unknown Artist"}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">
                        {typeof song.duration === "number"
                          ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}`
                          : "3:45"}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No recently played songs</p>
              <p className="text-gray-500 text-sm">Start listening to see your history here</p>
            </div>
          )}
        </div>

        {/* Made For You - Enhanced with Thumbnails */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Made For You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Discover Weekly",
                desc: "Your weekly mixtape of fresh music",
                color: "from-purple-600 to-blue-600",
                thumbnail: "/placeholder.svg?height=200&width=200",
              },
              {
                name: "Daily Mix 1",
                desc: "Arijit Singh, Shreya Ghoshal and more",
                color: "from-green-600 to-teal-600",
                thumbnail: "/placeholder.svg?height=200&width=200",
              },
              {
                name: "Daily Mix 2",
                desc: "Bollywood hits and classics",
                color: "from-orange-600 to-red-600",
                thumbnail: "/placeholder.svg?height=200&width=200",
              },
              {
                name: "Release Radar",
                desc: "Catch all the latest music",
                color: "from-pink-600 to-purple-600",
                thumbnail: "/placeholder.svg?height=200&width=200",
              },
            ].map((playlist, index) => (
              <motion.div
                key={playlist.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-white/20"
              >
                <div className="relative mb-4">
                  <div
                    className={`w-full aspect-square bg-gradient-to-br ${playlist.color} rounded-lg flex items-center justify-center relative overflow-hidden`}
                  >
                    <Image
                      src={playlist.thumbnail || "/placeholder.svg"}
                      alt={playlist.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover rounded-lg opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="icon" className="bg-green-500 hover:bg-green-600 rounded-full">
                        <Play className="w-5 h-5 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <h4 className="text-white font-medium mb-1">{playlist.name}</h4>
                <p className="text-gray-400 text-sm">{playlist.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-white/10">
          <p className="text-gray-400 text-sm">Made with ❤️ by Ali Sheikh (Spider)</p>
        </div>
      </div>
    </div>
  )
}
