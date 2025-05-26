"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Play,
  Pause,
  Search,
  Heart,
  MoreHorizontal,
  TrendingUp,
  Music,
  Headphones,
  Radio,
  Clock,
  Star,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const quickAccessItems = [
  { name: "Liked Songs", icon: Heart, color: "from-purple-500 to-pink-500", count: "47 songs" },
  { name: "Recently Played", icon: Clock, color: "from-green-500 to-emerald-500", count: "23 songs" },
  { name: "My Playlist #1", icon: Music, color: "from-blue-500 to-cyan-500", count: "12 songs" },
  { name: "Discover Weekly", icon: Star, color: "from-orange-500 to-red-500", count: "30 songs" },
  { name: "Daily Mix 1", icon: Radio, color: "from-indigo-500 to-purple-500", count: "50 songs" },
  { name: "Chill Hits", icon: Headphones, color: "from-teal-500 to-blue-500", count: "25 songs" },
]

const moodCategories = [
  { name: "Happy", emoji: "😊", color: "from-yellow-400 to-orange-400" },
  { name: "Chill", emoji: "😌", color: "from-blue-400 to-cyan-400" },
  { name: "Energetic", emoji: "⚡", color: "from-red-400 to-pink-400" },
  { name: "Romantic", emoji: "💕", color: "from-pink-400 to-rose-400" },
  { name: "Focus", emoji: "🎯", color: "from-green-400 to-emerald-400" },
  { name: "Party", emoji: "🎉", color: "from-purple-400 to-pink-400" },
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState("")

  const {
    trendingSongs,
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
  } = useStore()

  useEffect(() => {
    fetchTrendingSongs()
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

  const playSong = (song: any) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }

  const toggleFavorite = (song: any) => {
    const isFavorite = userData.favorites.some((fav) => fav.id === song.id)
    if (isFavorite) {
      removeFromFavorites(song.id)
    } else {
      addToFavorites(song)
    }
  }

  const userName = localStorage.getItem("username") || userData.name || "Music Lover"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Musica</h1>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="What do you want to listen to?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">{currentTime}</div>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{userName[0]?.toUpperCase()}</span>
              </div>
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

        {/* Quick Access Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAccessItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
                    <p className="text-gray-400 text-sm">{item.count}</p>
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

        {/* Browse by Mood */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Browse by Mood</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {moodCategories.map((mood, index) => (
              <motion.div
                key={mood.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
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

        {/* Trending Now */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Trending Now
            </h3>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Show all
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-gray-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                />
                <span>Loading trending songs...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-center">{error}</p>
              <div className="text-center mt-2">
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
          ) : (
            <ScrollArea className="w-full">
              <div className="flex space-x-4 pb-4">
                {trendingSongs.slice(0, 10).map((song, index) => {
                  const convertedSong = {
                    id: song.id,
                    title: song.name,
                    artist: song.primaryArtists,
                    album: song.album.name,
                    image: song.image[song.image.length - 1]?.link || "/placeholder.svg",
                    audio: song.downloadUrl[song.downloadUrl.length - 1]?.link || "",
                    duration: Number.parseInt(song.duration),
                    language: song.language,
                    year: song.year,
                    playCount: song.playCount,
                  }

                  const isFavorite = userData.favorites.some((fav) => fav.id === song.id)

                  return (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="min-w-[200px] bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-white/20"
                    >
                      <div className="relative mb-4">
                        <Image
                          src={convertedSong.image || "/placeholder.svg"}
                          alt={song.name}
                          width={160}
                          height={160}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            size="icon"
                            onClick={() => playSong(convertedSong)}
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
                          onClick={() => toggleFavorite(convertedSong)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                        >
                          <Heart className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
                        </Button>
                      </div>
                      <div>
                        <h4 className="text-white font-medium truncate mb-1">{song.name}</h4>
                        <p className="text-gray-400 text-sm truncate">{song.primaryArtists}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>

        {/* Recently Played */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Recently Played</h3>
          <div className="space-y-2">
            {userData.recentlyPlayed.slice(0, 5).map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                onClick={() => playSong(song)}
              >
                <div className="relative">
                  <Image
                    src={song.image || "/placeholder.svg"}
                    alt={song.title}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{song.title}</h4>
                  <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">3:45</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Made For You */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Made For You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Discover Weekly",
                desc: "Your weekly mixtape of fresh music",
                color: "from-purple-600 to-blue-600",
              },
              {
                name: "Daily Mix 1",
                desc: "Arijit Singh, Shreya Ghoshal and more",
                color: "from-green-600 to-teal-600",
              },
              { name: "Daily Mix 2", desc: "Bollywood hits and classics", color: "from-orange-600 to-red-600" },
              { name: "Release Radar", desc: "Catch all the latest music", color: "from-pink-600 to-purple-600" },
            ].map((playlist, index) => (
              <motion.div
                key={playlist.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-white/20"
              >
                <div
                  className={`w-full aspect-square bg-gradient-to-br ${playlist.color} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}
                >
                  <Music className="w-12 h-12 text-white/80" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" className="bg-green-500 hover:bg-green-600 rounded-full">
                      <Play className="w-5 h-5 ml-0.5" />
                    </Button>
                  </div>
                </div>
                <h4 className="text-white font-medium mb-1">{playlist.name}</h4>
                <p className="text-gray-400 text-sm">{playlist.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
