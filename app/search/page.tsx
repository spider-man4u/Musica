"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Play, Heart, TrendingUp, Music, Search, Disc, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useSearchParams, useRouter } from "next/navigation"
import { searchArtists, searchPlaylists } from "@/lib/modernMusicApi"

const browseCategories = [
  {
    name: "Bollywood",
    color: "from-red-500 to-pink-500",
    image: "🎬",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop",
  },
  {
    name: "Punjabi",
    color: "from-orange-500 to-yellow-500",
    image: "🎵",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&h=150&fit=crop",
  },
  {
    name: "Tamil",
    color: "from-green-500 to-emerald-500",
    image: "🎶",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop",
  },
  {
    name: "Telugu",
    color: "from-blue-500 to-cyan-500",
    image: "🎼",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop",
  },
  {
    name: "Pop",
    color: "from-purple-500 to-pink-500",
    image: "🎤",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop",
  },
  {
    name: "Rock",
    color: "from-gray-600 to-gray-800",
    image: "🎸",
    thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop",
  },
]

const popularSearches = ["Arijit Singh", "Kesariya", "Bollywood hits", "AR Rahman", "Shreya Ghoshal"]

const SafeImage = ({
  src,
  alt,
  width,
  height,
  className,
}: { src: string | undefined | null; alt: string; width: number; height: number; className?: string }) => {
  const validSrc = src && typeof src === "string" && src.trim() !== "" ? src.trim() : null
  if (!validSrc) {
    return (
      <div className={cn("bg-gray-800 flex items-center justify-center", className)} style={{ width, height }}>
        <Music className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
      </div>
    )
  }
  return <Image src={validSrc || "/placeholder.svg"} alt={alt} width={width} height={height} className={className} />
}

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [hasSearched, setHasSearched] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [artists, setArtists] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])
  const [artistsLoading, setArtistsLoading] = useState(false)
  const [playlistsLoading, setPlaylistsLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const {
    searchResults,
    searchHistory,
    isLoading,
    error,
    userData,
    searchContent,
    clearSearchHistory,
    playSong,
    addToFavorites,
    removeFromFavorites,
  } = useStore()

  useEffect(() => {
    const q = searchParams.get("q")
    if (q && !hasSearched) {
      setSearchQuery(q)
      setHasSearched(true)
      handleSearch(q)
    }
  }, [searchParams, hasSearched])

  const handleSearch = useCallback(
    async (q: string) => {
      if (q.trim()) {
        setHasSearched(true)
        await searchContent(q)

        // Fetch artists and playlists
        setArtistsLoading(true)
        setPlaylistsLoading(true)
        try {
          console.log(`🔍 Searching for artists and playlists: "${q}"`)

          const [artistRes, playlistRes] = await Promise.all([
            searchArtists(q).catch((err) => {
              console.error("Artist search error:", err)
              return { success: false, data: [] }
            }),
            searchPlaylists(q).catch((err) => {
              console.error("Playlist search error:", err)
              return { success: false, data: [] }
            }),
          ])

          console.log(`✅ Artists response:`, artistRes)
          console.log(`✅ Playlists response:`, playlistRes)

          if (artistRes.success && Array.isArray(artistRes.data)) {
            console.log(`📊 Setting ${artistRes.data.length} artists`)
            setArtists(artistRes.data)
          } else {
            setArtists([])
          }

          if (playlistRes.success && Array.isArray(playlistRes.data)) {
            console.log(`📊 Setting ${playlistRes.data.length} playlists`)
            setPlaylists(playlistRes.data)
          } else {
            setPlaylists([])
          }
        } catch (error) {
          console.error("Error fetching artists/playlists:", error)
          setArtists([])
          setPlaylists([])
        } finally {
          setArtistsLoading(false)
          setPlaylistsLoading(false)
        }
      }
    },
    [searchContent],
  )

  const handlePlaySong = useCallback(
    (song: any, index: number) => {
      const convertedSong = {
        id: song.id || `song-${index}`,
        title: song.title || "Unknown Song",
        artist: song.artist || "Unknown Artist",
        album: song.album || "Unknown Album",
        image: song.image || "/placeholder.svg?height=300&width=300",
        audio: song.audio || song.download_url || "",
        duration: song.duration || 0,
      }
      const playlistSongs =
        searchResults?.songs?.data?.map((s, i) => ({
          id: s.id || `song-${i}`,
          title: s.title || "Unknown Song",
          artist: s.artist || "Unknown Artist",
          album: s.album || "Unknown Album",
          image: s.image || "/placeholder.svg?height=300&width=300",
          audio: s.audio || s.download_url || "",
          duration: s.duration || 0,
        })) || []
      playSong(convertedSong, playlistSongs)
    },
    [searchResults, playSong],
  )

  const toggleFavorite = useCallback(
    (song: any) => {
      const convertedSong = {
        id: song.id,
        title: song.title || "Unknown Song",
        artist: song.artist || "Unknown Artist",
        album: song.album || "Unknown Album",
        image: song.image || "/placeholder.svg?height=300&width=300",
        audio: song.audio || song.download_url || "",
        duration: song.duration || 0,
      }
      const isFavorite = userData.favorites.some((fav) => fav.id === song.id)
      if (isFavorite) removeFromFavorites(song.id)
      else addToFavorites(convertedSong)
    },
    [userData.favorites, addToFavorites, removeFromFavorites],
  )

  const currentQuery = searchParams.get("q") || ""
  const showResults = hasSearched && (searchResults || isLoading || error)

  const formatDuration = (d: number | string) => {
    if (typeof d === "string") return d
    if (!d || isNaN(d)) return "0:00"
    const m = Math.floor(d / 60)
    const s = Math.floor(d % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const songs = searchResults?.songs?.data || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="w-full px-2 py-2 sm:px-4 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="What do you want to listen to?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-2 py-3 pb-20 sm:px-4 sm:py-6 sm:pb-32">
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Tabs */}
              <div className="flex space-x-1 mb-4 sm:mb-6 bg-white/10 rounded-full p-1 w-fit overflow-x-auto">
                {[
                  { id: "all", label: "all", count: songs.length + artists.length + playlists.length },
                  { id: "songs", label: "songs", count: songs.length },
                  { id: "artists", label: "artists", count: artists.length },
                  { id: "playlists", label: "playlists", count: playlists.length },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-full px-3 sm:px-6 capitalize text-xs sm:text-sm whitespace-nowrap",
                      activeTab === tab.id ? "bg-white text-black hover:bg-white/90" : "text-white hover:bg-white/10",
                    )}
                  >
                    {tab.label} ({tab.count})
                  </Button>
                ))}
              </div>

              {/* Results */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm sm:text-base">Searching...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 sm:p-6 text-center">
                  <p className="text-red-400 mb-4 text-sm sm:text-base">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => handleSearch(currentQuery)}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {/* ALL TAB */}
                  {(activeTab === "all" || activeTab === "songs") && songs.length > 0 && (
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Songs</h3>
                      <div className="space-y-1 sm:space-y-2">
                        {(activeTab === "all" ? songs.slice(0, 5) : songs.slice(0, 10)).map((song, index) => {
                          const isFavorite = userData?.favorites?.some((fav) => fav?.id === song.id) || false
                          return (
                            <motion.div
                              key={song.id || `song-${index}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.04 }}
                              className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                            >
                              <div className="relative">
                                <SafeImage
                                  src={song.image}
                                  alt={song.title || "Unknown Song"}
                                  width={40}
                                  height={40}
                                  className="rounded-lg sm:w-12 sm:h-12"
                                />
                                <div
                                  onClick={() => handlePlaySong(song, index)}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                                >
                                  <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate text-sm sm:text-base">
                                  {song.title || "Unknown Song"}
                                </h4>
                                <p className="text-gray-400 text-xs sm:text-sm truncate">
                                  {song.artist || "Unknown Artist"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-white/60 text-xs tabular-nums">
                                  {formatDuration(song.duration)}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleFavorite(song)}
                                  className="text-gray-400 hover:text-white w-7 h-7 sm:w-8 sm:h-8"
                                >
                                  <Heart
                                    className={cn("w-3 h-3 sm:w-4 sm:h-4", isFavorite && "fill-red-500 text-red-500")}
                                  />
                                </Button>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ARTISTS TAB */}
                  {(activeTab === "all" || activeTab === "artists") && artists.length > 0 && (
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2" /> Artists
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {(activeTab === "all" ? artists.slice(0, 4) : artists.slice(0, 8)).map((artist, index) => (
                          <motion.div
                            key={artist.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => router.push(`/artist/${artist.id}?name=${encodeURIComponent(artist.name)}`)}
                            className="bg-white/5 hover:bg-white/10 rounded-xl p-4 text-center cursor-pointer transition-all group"
                          >
                            <div className="relative mb-3 mx-auto w-24 h-24 sm:w-28 sm:h-28">
                              <SafeImage
                                src={artist.image}
                                alt={artist.name}
                                width={112}
                                height={112}
                                className="rounded-full w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h4 className="text-white font-semibold truncate text-sm sm:text-base">{artist.name}</h4>
                            <p className="text-gray-400 text-xs">Artist</p>
                            {artist.followers && (
                              <p className="text-white/50 text-xs mt-1">
                                {artist.followers.toLocaleString()} followers
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PLAYLISTS TAB */}
                  {(activeTab === "all" || activeTab === "playlists") && playlists.length > 0 && (
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
                        <Disc className="w-5 h-5 mr-2" /> Playlists
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {(activeTab === "all" ? playlists.slice(0, 4) : playlists.slice(0, 8)).map(
                          (playlist, index) => (
                            <motion.div
                              key={playlist.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() =>
                                router.push(`/playlist/${playlist.id}?name=${encodeURIComponent(playlist.name)}`)
                              }
                              className="bg-white/5 hover:bg-white/10 rounded-xl overflow-hidden cursor-pointer transition-all group"
                            >
                              <div className="relative aspect-square mb-0">
                                <SafeImage
                                  src={playlist.image}
                                  alt={playlist.name}
                                  width={180}
                                  height={180}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button
                                    size="icon"
                                    className="bg-white text-purple-900 hover:bg-white/90 rounded-full w-10 h-10 sm:w-12 sm:h-12"
                                  >
                                    <Play className="w-5 h-5 ml-0.5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="p-3 sm:p-4">
                                <h4 className="text-white font-semibold truncate text-sm sm:text-base">
                                  {playlist.name}
                                </h4>
                                <p className="text-gray-400 text-xs">{playlist.songCount || 0} songs</p>
                              </div>
                            </motion.div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {songs.length === 0 && artists.length === 0 && playlists.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <p className="text-gray-400 text-base sm:text-lg mb-4">No results found for "{currentQuery}"</p>
                      <p className="text-gray-500 text-sm sm:text-base">
                        Try searching for different keywords or check your spelling.
                      </p>
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
              className="space-y-6 sm:space-y-8"
            >
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Recent Searches</h3>
                    <Button
                      variant="ghost"
                      onClick={clearSearchHistory}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    {searchHistory.slice(0, 5).map((search, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        onClick={() => handleSearch(search)}
                        className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                      >
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <span className="text-white text-sm sm:text-base">{search}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Popular Searches
                </h3>
                <div className="space-y-1 sm:space-y-2">
                  {popularSearches.map((search, index) => (
                    <motion.div
                      key={search}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => handleSearch(search)}
                      className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <span className="text-white text-sm sm:text-base">{search}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Browse All */}
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Browse All</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {browseCategories.map((category, index) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => handleSearch(category.name)}
                      className={`aspect-square bg-gradient-to-br ${category.color} rounded-lg p-3 sm:p-6 cursor-pointer hover:scale-105 transition-transform duration-300 relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/20" />
                      <Image
                        src={category.thumbnail || "/placeholder.svg"}
                        alt={category.name}
                        width={150}
                        height={150}
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                      />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <h4 className="text-white font-bold text-sm sm:text-lg">{category.name}</h4>
                        <div className="text-right">
                          <span className="text-2xl sm:text-4xl">{category.image}</span>
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
