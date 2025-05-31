"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  ChevronLeft,
  Download,
  Shuffle,
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Music,
  Headphones,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

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

// Enhanced library content with better organization
const enhancedLibraryContent = {
  playlists: [
    {
      id: "1",
      title: "Liked Songs",
      songs: 47,
      image: "/placeholder.svg?height=150&width=150",
      description: "Your favorite tracks",
      dateCreated: "Always updating",
      totalDuration: "3h 12m",
      songList: Array.from({ length: 47 }, (_, i) => ({
        id: `liked-${i}`,
        title: `Liked Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        album: `Album ${i + 1}`,
        duration: `${Math.floor(Math.random() * 2) + 2}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
        dateAdded: `${Math.floor(Math.random() * 30) + 1} days ago`,
        image: "/placeholder.svg?height=60&width=60",
      })),
    },
    {
      id: "2",
      title: "Chill Vibes",
      songs: 23,
      image: "/placeholder.svg?height=150&width=150",
      description: "Relaxing music for peaceful moments",
      dateCreated: "2 weeks ago",
      totalDuration: "1h 45m",
      songList: Array.from({ length: 23 }, (_, i) => ({
        id: `chill-${i}`,
        title: `Chill Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        album: `Album ${i + 1}`,
        duration: `${Math.floor(Math.random() * 2) + 2}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
        dateAdded: `${Math.floor(Math.random() * 14) + 1} days ago`,
        image: "/placeholder.svg?height=60&width=60",
      })),
    },
    {
      id: "3",
      title: "Workout Mix",
      songs: 31,
      image: "/placeholder.svg?height=150&width=150",
      description: "High-energy tracks for your workout",
      dateCreated: "1 month ago",
      totalDuration: "2h 8m",
      songList: Array.from({ length: 31 }, (_, i) => ({
        id: `workout-${i}`,
        title: `Workout Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        album: `Album ${i + 1}`,
        duration: `${Math.floor(Math.random() * 2) + 2}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
        dateAdded: `${Math.floor(Math.random() * 30) + 1} days ago`,
        image: "/placeholder.svg?height=60&width=60",
      })),
    },
    {
      id: "4",
      title: "Bollywood Hits",
      songs: 56,
      image: "/placeholder.svg?height=150&width=150",
      description: "Best of Bollywood music",
      dateCreated: "3 months ago",
      totalDuration: "4h 22m",
      songList: Array.from({ length: 56 }, (_, i) => ({
        id: `bollywood-${i}`,
        title: `Bollywood Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        album: `Album ${i + 1}`,
        duration: `${Math.floor(Math.random() * 2) + 2}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
        dateAdded: `${Math.floor(Math.random() * 90) + 1} days ago`,
        image: "/placeholder.svg?height=60&width=60",
      })),
    },
  ],
  recentlyPlayed: [
    {
      id: "4",
      title: "Midnight City",
      artist: "M83",
      image: "/placeholder.svg?height=60&width=60",
      album: "Hurry Up, We're Dreaming",
      duration: "4:04",
    },
    {
      id: "5",
      title: "Blinding Lights",
      artist: "The Weeknd",
      image: "/placeholder.svg?height=60&width=60",
      album: "After Hours",
      duration: "3:20",
    },
    {
      id: "6",
      title: "Levitating",
      artist: "Dua Lipa",
      image: "/placeholder.svg?height=60&width=60",
      album: "Future Nostalgia",
      duration: "3:23",
    },
    {
      id: "7",
      title: "Good 4 U",
      artist: "Olivia Rodrigo",
      image: "/placeholder.svg?height=60&width=60",
      album: "SOUR",
      duration: "2:58",
    },
    {
      id: "8",
      title: "Stay",
      artist: "The Kid LAROI, Justin Bieber",
      image: "/placeholder.svg?height=60&width=60",
      album: "Stay",
      duration: "2:21",
    },
  ],
  albums: [
    {
      id: "album-1",
      title: "After Hours",
      artist: "The Weeknd",
      image: "/placeholder.svg?height=150&width=150",
      year: "2020",
      songs: 14,
    },
    {
      id: "album-2",
      title: "Future Nostalgia",
      artist: "Dua Lipa",
      image: "/placeholder.svg?height=150&width=150",
      year: "2020",
      songs: 11,
    },
    {
      id: "album-3",
      title: "SOUR",
      artist: "Olivia Rodrigo",
      image: "/placeholder.svg?height=150&width=150",
      year: "2021",
      songs: 11,
    },
  ],
  artists: [
    { id: "artist-1", name: "The Weeknd", image: "/placeholder.svg?height=150&width=150", followers: "88.2M" },
    { id: "artist-2", name: "Dua Lipa", image: "/placeholder.svg?height=150&width=150", followers: "87.6M" },
    { id: "artist-3", name: "Olivia Rodrigo", image: "/placeholder.svg?height=150&width=150", followers: "45.3M" },
  ],
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

  const filteredPlaylists = enhancedLibraryContent.playlists.filter(
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
    <div className="min-h-screen relative">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 pointer-events-none" />

      <div className="relative z-10 pb-20">
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
                  <div className="glass-purple rounded-3xl w-full h-full flex items-center justify-center overflow-hidden">
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
                        className="glass-dark rounded-xl p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer group transition-all duration-200"
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
                  <TabsTrigger value="artists" className="data-[state=active]:bg-white data-[state=active]:text-black">
                    <Headphones className="w-4 h-4 mr-2" />
                    Artists
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
                        className="glass-dark rounded-2xl p-6 cursor-pointer card-hover group"
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
                  {enhancedLibraryContent.recentlyPlayed.map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-dark rounded-xl p-4 flex items-center space-x-4 cursor-pointer card-hover group"
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
                      <div className="text-white/70 text-sm">{song.duration}</div>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="artists" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {enhancedLibraryContent.artists.map((artist, index) => (
                      <motion.div
                        key={artist.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-dark rounded-2xl p-6 text-center cursor-pointer card-hover group"
                      >
                        <SafeImage
                          src={artist.image}
                          alt={artist.name}
                          width={120}
                          height={120}
                          className="w-full aspect-square object-cover rounded-full mx-auto mb-4"
                        />
                        <h3 className="text-white font-semibold mb-1">{artist.name}</h3>
                        <p className="text-white/70 text-sm">{artist.followers} followers</p>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="albums" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {enhancedLibraryContent.albums.map((album, index) => (
                      <motion.div
                        key={album.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-dark rounded-2xl p-4 cursor-pointer card-hover group"
                      >
                        <SafeImage
                          src={album.image}
                          alt={album.title}
                          width={160}
                          height={160}
                          className="w-full aspect-square object-cover rounded-xl mb-4"
                        />
                        <h3 className="text-white font-semibold mb-1">{album.title}</h3>
                        <p className="text-white/70 text-sm mb-1">{album.artist}</p>
                        <p className="text-white/50 text-xs">
                          {album.year} • {album.songs} songs
                        </p>
                      </motion.div>
                    ))}
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
