"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Play, Pause, Heart, MoreHorizontal, ChevronLeft, Download, Shuffle, Search, Filter, Grid, List, Clock, Music, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

interface Song {
  id: string
  title: string
  artist: string
  duration: string
  album?: string
  image?: string
  dateAdded?: string
}

interface Playlist {
  id: string
  title: string
  songs: number
  image: string
  songList: Song[]
  description?: string
  dateCreated?: string
  totalDuration?: string
}

// Safe Image Component
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
        <Music className="w-6 h-6 text-gray-400" />
      </div>
    )
  }

  return <Image src={validSrc || "/placeholder.svg"} alt={alt} width={width} height={height} className={className} />
}

export default function Library() {
  const [expandedPlaylist, setExpandedPlaylist] = useState<Playlist | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"recent" | "name" | "artist" | "duration">("recent")
  const [activeTab, setActiveTab] = useState("playlists")

  const { setCurrentSong, setIsPlaying: setGlobalPlaying, userData } = useStore()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for tab parameter
    const tab = searchParams.get("tab")
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Create real playlists based on user data
  const realPlaylists = [
    {
      id: "favorites",
      title: "Liked Songs",
      songs: userData.favorites.length,
      image: "/placeholder.svg?height=150&width=150",
      description: "Your favorite tracks",
      dateCreated: "Always updating",
      totalDuration: `${Math.floor((userData.favorites.length * 3.5) / 60)}h ${Math.floor((userData.favorites.length * 3.5) % 60)}m`,
      songList: userData.favorites.map((song, index) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || "Unknown Album",
        duration:
          typeof song.duration === "number"
            ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}`
            : "3:45",
        dateAdded: `${Math.floor(Math.random() * 30) + 1} days ago`,
        image: song.image,
      })),
    },
  ]

  const handlePlaylistClick = (playlist: Playlist) => {
    setExpandedPlaylist(playlist)
  }

  const handleBack = () => {
    setExpandedPlaylist(null)
  }

  const handleSongClick = (song: any) => {
    // Enhanced song data for better playback
    const enhancedSong = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || "Unknown Album",
      image: song.image || "/placeholder.svg?height=300&width=300",
      audio: song.audio || "",
      duration:
        typeof song.duration === "string"
          ? Number.parseInt(song.duration.split(":")[0]) * 60 + Number.parseInt(song.duration.split(":")[1])
          : song.duration || 0,
      language: "hindi",
      year: "2023",
      playCount: "1000000",
      explicit: false,
      url: "",
      hasLyrics: true,
      label: "Music Label",
    }

    setCurrentSong(enhancedSong)
    setGlobalPlaying(true)
  }

  const filteredPlaylists = realPlaylists.filter(
    (playlist) =>
      playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playlist.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedSongs = (songs: Song[]) => {
    return [...songs].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title)
        case "artist":
          return a.artist.localeCompare(b.artist)
        case "duration":
          return a.duration.localeCompare(b.duration)
        default:
          return 0
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="pb-20">
        <AnimatePresence mode="wait">
          {expandedPlaylist ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <Button variant="ghost" onClick={handleBack} className="mb-6 text-white hover:bg-white/10">
                <ChevronLeft className="mr-2 w-5 h-5" /> Back to Library
              </Button>

              {/* Enhanced Playlist Header */}
              <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 mb-8">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-64 h-64">
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl w-full h-full flex items-center justify-center overflow-hidden border border-white/10">
                    <SafeImage
                      src={expandedPlaylist.image}
                      alt={expandedPlaylist.title}
                      width={256}
                      height={256}
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  </div>
                </motion.div>

                <div className="flex-1">
                  <Badge variant="secondary" className="mb-2 bg-white/10 text-white">
                    Playlist
                  </Badge>
                  <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">{expandedPlaylist.title}</h1>
                  <p className="text-white/70 text-lg mb-4">{expandedPlaylist.description}</p>
                  <div className="flex items-center gap-4 text-white/60 text-sm">
                    <span>{expandedPlaylist.songs} songs</span>
                    <span>•</span>
                    <span>{expandedPlaylist.totalDuration}</span>
                    <span>•</span>
                    <span>{expandedPlaylist.dateCreated}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Controls */}
              <div className="flex items-center gap-4 mb-8">
                <Button
                  size="lg"
                  className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 text-black"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 text-white hover:bg-white/10">
                  <Shuffle className="w-6 h-6" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 text-white hover:bg-white/10">
                  <Download className="w-6 h-6" />
                </Button>
                <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 text-white hover:bg-white/10">
                  <MoreHorizontal className="w-6 h-6" />
                </Button>
              </div>

              {/* Enhanced Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search in playlist"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    className="text-white hover:bg-white/10"
                  >
                    {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
                    className="text-white hover:bg-white/10"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Sort
                  </Button>
                </div>
              </div>

              {/* Enhanced Song List */}
              <ScrollArea className="h-[calc(100vh-600px)]">
                <div className="space-y-1">
                  {sortedSongs(expandedPlaylist.songList)
                    .filter(
                      (song) =>
                        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        song.artist.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                    .map((song, index) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: index * 0.02 },
                        }}
                        className="bg-white/5 backdrop-blur-xl rounded-xl p-4 flex items-center justify-between hover:bg-white/10 cursor-pointer group transition-all duration-200 border border-white/10"
                        onClick={() => handleSongClick(song)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <span className="w-8 text-white/70 text-sm group-hover:opacity-0 transition-opacity">
                              {index + 1}
                            </span>
                            <Play className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <SafeImage src={song.image} alt={song.title} width={48} height={48} className="rounded-lg" />
                          <div>
                            <p className="font-medium text-white group-hover:text-green-400 transition-colors">
                              {song.title}
                            </p>
                            <p className="text-sm text-white/70">{song.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white/70 text-sm hidden sm:block">{song.album}</span>
                          <span className="text-white/70 text-sm hidden sm:block">{song.dateAdded}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <span className="text-white/70 text-sm w-12 text-right">{song.duration}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
                <ScrollBar />
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              {/* Enhanced Header */}
              <div className="pt-8 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/70 text-sm">Good evening</p>
                    <h1 className="text-4xl font-bold text-white mt-2">Your Library</h1>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      <Search className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" className="text-white hover:bg-white/10">
                      <Filter className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search your library"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Enhanced Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/10 mb-8">
                  <TabsTrigger
                    value="playlists"
                    className="data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Playlists
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="data-[state=active]:bg-white data-[state=active]:text-black">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent
                  </TabsTrigger>
                  <TabsTrigger
                    value="favorites"
                    className="data-[state=active]:bg-white data-[state=active]:text-black"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Favorites
                  </TabsTrigger>
                  <TabsTrigger value="albums" className="data-[state=active]:bg-white data-[state=active]:text-black">
                    <Star className="w-4 h-4 mr-2" />
                    Albums
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="playlists" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlaylists.map((playlist, index) => (
                      <motion.div
                        key={playlist.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: index * 0.1 },
                        }}
                        onClick={() => handlePlaylistClick(playlist)}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 group border border-white/10"
                      >
                        <div className="relative mb-4">
                          <SafeImage
                            src={playlist.image}
                            alt={playlist.title}
                            width={200}
                            height={200}
                            className="w-full aspect-square object-cover rounded-xl"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <Button size="icon" className="bg-green-500 hover:bg-green-600 rounded-full w-12 h-12">
                              <Play className="w-6 h-6 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">{playlist.title}</h3>
                        <p className="text-white/70 text-sm mb-3">{playlist.description}</p>
                        <div className="flex items-center justify-between text-white/60 text-sm">
                          <span>{playlist.songs} songs</span>
                          <span>{playlist.totalDuration}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="space-y-4">
                  {userData.recentlyPlayed.length > 0 ? (
                    userData.recentlyPlayed.map((song, index) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 backdrop-blur-xl rounded-xl p-4 flex items-center space-x-4 cursor-pointer hover:bg-white/10 transition-all duration-300 group border border-white/10"
                        onClick={() => handleSongClick(song)}
                      >
                        <div className="relative">
                          <SafeImage src={song.image} alt={song.title} width={64} height={64} className="rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{song.title}</h3>
                          <p className="text-white/70 text-sm">{song.artist}</p>
                          <p className="text-white/50 text-xs">{song.album}</p>
                        </div>
                        <div className="text-white/70 text-sm">
                          {typeof song.duration === "number"
                            ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}`
                            : "3:45"}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No recently played songs</p>
                      <p className="text-gray-500 text-sm">Start listening to see your history here</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="favorites" className="space-y-4">
                  {userData.favorites.length > 0 ? (
                    userData.favorites.map((song, index) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 backdrop-blur-xl rounded-xl p-4 flex items-center space-x-4 cursor-pointer hover:bg-white/10 transition-all duration-300 group border border-white/10"
                        onClick={() => handleSongClick(song)}
                      >
                        <div className="relative">
                          <SafeImage src={song.image} alt={song.title} width={64} height={64} className="rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{song.title}</h3>
                          <p className="text-white/70 text-sm">{song.artist}</p>
                          <p className="text-white/50 text-xs">{song.album}</p>
                        </div>
                        <div className="text-white/70 text-sm">
                          {typeof song.duration === "number"
                            ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}`
                            : "3:45"}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No favorite songs yet</p>
                      <p className="text-gray-500 text-sm">Like songs to see them here</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="albums" className="space-y-4">
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">No albums yet</p>
                    <p className="text-gray-500 text-sm">Albums will appear here as you explore music</p>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
