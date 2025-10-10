"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, MoreHorizontal, ChevronLeft, Download, Shuffle, Search, Music, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

type SortKey = "recent" | "name" | "artist" | "duration"

interface UISong {
  id: string
  title: string
  artist: string
  duration: string // mm:ss
  album?: string
  image?: string
  dateAdded?: string
  audio?: string
}

interface UIPlaylist {
  id: string
  title: string
  songs: number
  image: string
  songList: UISong[]
  description?: string
  dateCreated?: string
  totalDuration?: string
}

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
      <div
        className={cn("bg-gray-800/70 flex items-center justify-center rounded-md", className)}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <Music className="w-6 h-6 text-gray-400" />
      </div>
    )
  }
  return (
    <Image
      src={validSrc || "/placeholder.svg?height=300&width=300&query=music%20cover"}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  )
}

function formatMinutes(totalSongs: number) {
  const totalMinutes = totalSongs * 3.5
  const h = Math.floor(totalMinutes / 60)
  const m = Math.floor(totalMinutes % 60)
  return `${h}h ${m}m`
}

export default function LibraryPage() {
  const { toast } = useToast()
  const { setCurrentSong, setIsPlaying: setGlobalPlaying, userData, createPlaylist } = useStore()

  const [expandedPlaylist, setExpandedPlaylist] = useState<UIPlaylist | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("recent")
  const [openCreate, setOpenCreate] = useState(false)
  const [plName, setPlName] = useState("")
  const [plDesc, setPlDesc] = useState("")

  const allPlaylists: UIPlaylist[] = useMemo(() => {
    const favorites = Array.isArray(userData?.favorites) ? userData.favorites : []
    const playlists = Array.isArray(userData?.playlists) ? userData.playlists : []

    const liked: UIPlaylist = {
      id: "favorites",
      title: "Liked Songs",
      songs: favorites.length,
      image: "/liked-songs-cover.jpg",
      description: "Your favorite tracks",
      dateCreated: "Always updating",
      totalDuration: formatMinutes(favorites.length),
      songList: favorites.map((song: any) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || "Unknown Album",
        duration:
          typeof song.duration === "number"
            ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
            : typeof song.duration === "string"
              ? song.duration
              : "0:00",
        dateAdded: `${Math.floor(Math.random() * 30) + 1} days ago`,
        image: song.image,
        audio: song.audio,
      })),
    }

    const others: UIPlaylist[] = playlists.map((p: any) => ({
      id: p.id,
      title: p.name,
      songs: p.songs.length,
      image: p.image || "/playlist-cover.png",
      description: p.description,
      dateCreated: p.createdAt ? new Date(p.createdAt).toDateString() : "Recently",
      totalDuration: formatMinutes(p.songs.length),
      songList: p.songs.map((song: any) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album || "Unknown Album",
        duration:
          typeof song.duration === "number"
            ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
            : typeof song.duration === "string"
              ? song.duration
              : "0:00",
        dateAdded: `${Math.floor(Math.random() * 30) + 1} days ago`,
        image: song.image,
        audio: song.audio,
      })),
    }))

    return [liked, ...others]
  }, [userData?.favorites, userData?.playlists])

  const filteredPlaylists = useMemo(
    () =>
      allPlaylists.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
      ),
    [allPlaylists, searchQuery],
  )

  const sortedSongs = (songs: UISong[]) => {
    const arr = [...songs]
    switch (sortBy) {
      case "name":
        return arr.sort((a, b) => a.title.localeCompare(b.title))
      case "artist":
        return arr.sort((a, b) => a.artist.localeCompare(b.artist))
      case "duration":
        // safely compare mm:ss by converting to seconds
        const toSec = (d: string) => {
          const [m, s] = d.split(":").map((n) => Number.parseInt(n || "0", 10))
          return (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s)
        }
        return arr.sort((a, b) => toSec(a.duration) - toSec(b.duration))
      case "recent":
      default:
        return arr // original order
    }
  }

  const handlePlayToggle = () => setIsPlaying((p) => !p)

  const handlePlaylistClick = (playlist: UIPlaylist) => setExpandedPlaylist(playlist)
  const handleBack = () => setExpandedPlaylist(null)

  const handleSongClick = (song: UISong) => {
    const enhancedSong = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || "Unknown Album",
      image: song.image || "/abstract-album-art.png",
      audio: song.audio || "",
      duration:
        typeof song.duration === "string"
          ? Number.parseInt(song.duration.split(":")[0] || "0", 10) * 60 +
            Number.parseInt(song.duration.split(":")[1] || "0", 10)
          : 0,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="pb-40">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Welcome back</p>
            <h1 className="text-4xl font-bold text-white mt-2">Your Library</h1>
          </div>

          {/* Create Playlist */}
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="bg-white/10 hover:bg-white/20 border border-white/20">
                <Plus className="w-4 h-4 mr-2" /> Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create a Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pl-name" className="text-white">
                    Name
                  </Label>
                  <Input
                    id="pl-name"
                    value={plName}
                    onChange={(e) => setPlName(e.target.value)}
                    placeholder="My Playlist"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pl-desc" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="pl-desc"
                    value={plDesc}
                    onChange={(e) => setPlDesc(e.target.value)}
                    placeholder="Describe your playlist"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOpenCreate(false)} className="text-white hover:bg-white/10">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const name = plName.trim()
                      if (!name) {
                        toast({
                          title: "Name required",
                          description: "Please enter a playlist name",
                          variant: "destructive",
                        })
                        return
                      }
                      const pl = createPlaylist(name, plDesc.trim())
                      toast({ title: "Playlist created", description: `Created "${pl.name}"` })
                      setPlName("")
                      setPlDesc("")
                      setOpenCreate(false)
                    }}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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

              {/* Expanded Header */}
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
                  <h2 className="text-4xl lg:text-6xl font-bold text-white mb-4">{expandedPlaylist.title}</h2>
                  <p className="text-white/70 text-lg mb-4">{expandedPlaylist.description}</p>
                  <div className="flex items-center gap-4 text-white/60 text-sm">
                    <span>{expandedPlaylist.songs} songs</span>
                    <span>{"•"}</span>
                    <span>{expandedPlaylist.totalDuration}</span>
                    <span>{"•"}</span>
                    <span>{expandedPlaylist.dateCreated}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mb-8">
                <Button
                  size="lg"
                  className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600 text-black"
                  onClick={handlePlayToggle}
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

              {/* Search + Sort */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                    onClick={() => setSortBy(sortBy === "recent" ? "name" : "recent")}
                    className="text-white hover:bg-white/10"
                  >
                    Sort: {sortBy === "recent" ? "Recent" : "Name"}
                  </Button>
                </div>
              </div>

              {/* Songs */}
              <div className="max-h-[calc(100vh-520px)] overflow-y-auto">
                <div className="space-y-1">
                  {sortedSongs(
                    expandedPlaylist.songList.filter(
                      (song) =>
                        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        song.artist.toLowerCase().includes(searchQuery.toLowerCase()),
                    ),
                  ).map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.02 } }}
                      className="bg-white/5 backdrop-blur-xl rounded-xl p-4 flex items-center justify-between hover:bg-white/10 cursor-pointer group transition-all duration-200 border border-white/10"
                      onClick={() => handleSongClick(song)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-8">
                          <span className="inline-block w-8 text-white/70 text-sm group-hover:opacity-0 transition-opacity">
                            {index + 1}
                          </span>
                          <Play className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                          <span className="text-white/70 text-sm w-12 text-right tabular-nums">{song.duration}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              toast({ title: "Menu", description: "Track options coming soon." })
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              {/* Search */}
              <div className="relative max-w-md mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search your playlists"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Playlist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlaylists.map((playlist, index) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.06 } }}
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
                    {playlist.description && (
                      <p className="text-white/70 text-sm mb-3 line-clamp-2">{playlist.description}</p>
                    )}
                    <div className="flex items-center justify-between text-white/60 text-sm">
                      <span>{playlist.songs} songs</span>
                      <span>{playlist.totalDuration}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
