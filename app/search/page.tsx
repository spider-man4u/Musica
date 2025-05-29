"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, X, Play, Heart, MoreHorizontal, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const browseCategories = [
  { name: "Bollywood", color: "from-red-500 to-pink-500", image: "🎬" },
  { name: "Punjabi", color: "from-orange-500 to-yellow-500", image: "🎵" },
  { name: "Tamil", color: "from-green-500 to-emerald-500", image: "🎶" },
  { name: "Telugu", color: "from-blue-500 to-cyan-500", image: "🎼" },
  { name: "Pop", color: "from-purple-500 to-pink-500", image: "🎤" },
  { name: "Rock", color: "from-gray-600 to-gray-800", image: "🎸" },
  { name: "Classical", color: "from-amber-500 to-orange-500", image: "🎻" },
  { name: "Devotional", color: "from-indigo-500 to-purple-500", image: "🙏" },
]

const recentSearches = ["Arijit Singh", "Kesariya", "Bollywood hits", "AR Rahman", "Shreya Ghoshal"]

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    searchResults,
    searchHistory,
    isLoading,
    error,
    userData,
    searchContent,
    clearSearchHistory,
    setCurrentSong,
    setIsPlaying,
    addToFavorites,
    removeFromFavorites,
  } = useStore()

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim()) {
      setQuery(searchQuery)
      await searchContent(searchQuery)
    }
  }

  const clearSearch = () => {
    setQuery("")
    setIsSearching(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  ref={inputRef}
                  placeholder="What do you want to listen to?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsSearching(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(query)
                    }
                  }}
                  className="pl-12 pr-12 py-3 bg-white text-black placeholder:text-gray-600 rounded-full text-lg border-0 focus:ring-2 focus:ring-white/20"
                />
                {query && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          {query && searchResults ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search Tabs */}
              <div className="flex space-x-1 mb-6 bg-white/10 rounded-full p-1 w-fit">
                {["all", "songs", "artists", "albums", "playlists"].map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "default" : "ghost"}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "rounded-full px-6 capitalize",
                      activeTab === tab ? "bg-white text-black hover:bg-white/90" : "text-white hover:bg-white/10",
                    )}
                  >
                    {tab}
                  </Button>
                ))}
              </div>

              {/* Search Results */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                    />
                    <span>Searching...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => handleSearch(query)}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Top Result */}
                  {searchResults.songs?.data[0] && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Top Result</h3>
                      <div className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="flex items-center space-x-6">
                          <div className="relative">
                            <Image
                              src={
                                searchResults.songs.data[0].image[searchResults.songs.data[0].image.length - 1]?.link ||
                                "/placeholder.svg"
                              }
                              alt={searchResults.songs.data[0].name}
                              width={120}
                              height={120}
                              className="rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Button
                                size="icon"
                                onClick={() =>
                                  playSong({
                                    id: searchResults.songs.data[0].id,
                                    title: searchResults.songs.data[0].name,
                                    artist: searchResults.songs.data[0].primaryArtists,
                                    album: searchResults.songs.data[0].album.name,
                                    image:
                                      searchResults.songs.data[0].image[searchResults.songs.data[0].image.length - 1]
                                        ?.link,
                                    audio:
                                      searchResults.songs.data[0].downloadUrl[
                                        searchResults.songs.data[0].downloadUrl.length - 1
                                      ]?.link,
                                    duration: Number.parseInt(searchResults.songs.data[0].duration),
                                  })
                                }
                                className="bg-green-500 hover:bg-green-600 rounded-full w-16 h-16"
                              >
                                <Play className="w-8 h-8 ml-1" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-3xl font-bold text-white mb-2">{searchResults.songs.data[0].name}</h4>
                            <p className="text-gray-400 text-lg mb-2">{searchResults.songs.data[0].primaryArtists}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-white/10 text-white">
                                Song
                              </Badge>
                              <Badge variant="outline" className="border-white/20 text-white">
                                {searchResults.songs.data[0].language}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Songs */}
                  {searchResults.songs?.data && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">Songs</h3>
                      <div className="space-y-2">
                        {searchResults.songs.data.slice(0, 10).map((song, index) => {
                          const convertedSong = {
                            id: song.id,
                            title: song.name,
                            artist: song.primaryArtists,
                            album: song.album.name,
                            image: song.image[song.image.length - 1]?.link || "/placeholder.svg",
                            audio: song.downloadUrl[song.downloadUrl.length - 1]?.link || "",
                            duration: Number.parseInt(song.duration),
                          }

                          const isFavorite = userData.favorites.some((fav) => fav.id === song.id)

                          return (
                            <motion.div
                              key={song.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                            >
                              <div className="relative">
                                <Image
                                  src={convertedSong.image || "/placeholder.svg"}
                                  alt={song.name}
                                  width={48}
                                  height={48}
                                  className="rounded-lg"
                                />
                                <div
                                  onClick={() => playSong(convertedSong)}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                                >
                                  <Play className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{song.name}</h4>
                                <p className="text-gray-400 text-sm truncate">{song.primaryArtists}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleFavorite(convertedSong)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                                >
                                  <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
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
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="search-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Recent Searches</h3>
                    <Button variant="ghost" onClick={clearSearchHistory} className="text-gray-400 hover:text-white">
                      Clear all
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {searchHistory.slice(0, 5).map((search, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSearch(search)}
                        className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                      >
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-white">{search}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Trending Searches
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <motion.div
                      key={search}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSearch(search)}
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                    >
                      <TrendingUp className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{search}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Browse All */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Browse All</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {browseCategories.map((category, index) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSearch(category.name)}
                      className={`aspect-square bg-gradient-to-br ${category.color} rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform duration-300 relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <h4 className="text-white font-bold text-lg">{category.name}</h4>
                        <div className="text-right">
                          <span className="text-4xl">{category.image}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
