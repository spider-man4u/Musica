"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Download, Play, Heart, MoreHorizontal, Music, Trash2, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export default function DownloadsPage() {
  const [selectedSongs, setSelectedSongs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"recent" | "name" | "artist">("recent")

  const { userData, playSong, addToFavorites, removeFromFavorites, removeFromDownloads, addToQueue } = useStore()

  const downloads = userData.downloads || []

  const handlePlaySong = (song: any, index: number) => {
    playSong(song, downloads)
  }

  const toggleFavorite = (song: any) => {
    const isFavorite = userData.favorites.some((fav) => fav.id === song.id)
    if (isFavorite) {
      removeFromFavorites(song.id)
      toast({
        title: "Removed from Favorites",
        description: `${song.title} removed from your favorites`,
      })
    } else {
      addToFavorites(song)
      toast({
        title: "Added to Favorites",
        description: `${song.title} added to your favorites`,
      })
    }
  }

  const handleRemoveDownload = (songId: string) => {
    removeFromDownloads(songId)
    toast({
      title: "Download Removed",
      description: "Song removed from downloads",
    })
  }

  const toggleSelectSong = (songId: string) => {
    setSelectedSongs((prev) => (prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]))
  }

  const handleRemoveSelected = () => {
    selectedSongs.forEach((songId) => {
      removeFromDownloads(songId)
    })
    setSelectedSongs([])
    toast({
      title: "Downloads Removed",
      description: `${selectedSongs.length} songs removed from downloads`,
    })
  }

  const handleAddToQueue = (song: any) => {
    addToQueue(song)
    toast({
      title: "Added to Queue",
      description: `${song.title} added to your queue`,
    })
  }

  const sortedDownloads = [...downloads].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.title.localeCompare(b.title)
      case "artist":
        return a.artist.localeCompare(b.artist)
      case "recent":
      default:
        return 0 // Keep original order for recent
    }
  })

  const totalSize = downloads.length * 3.5 // Approximate 3.5MB per song

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Downloads</h1>
              <p className="text-gray-400">
                {downloads.length} songs • {totalSize.toFixed(1)} MB
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {selectedSongs.length > 0 && (
                <Button variant="destructive" onClick={handleRemoveSelected} className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Selected ({selectedSongs.length})
                </Button>
              )}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-white/40"
              >
                <option value="recent">Recently Downloaded</option>
                <option value="name">Song Name</option>
                <option value="artist">Artist Name</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {downloads.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            <FolderOpen className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">No Downloads Yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start downloading your favorite songs to listen offline. Look for the download button when playing songs.
            </p>
            <Button onClick={() => window.history.back()} className="bg-green-600 hover:bg-green-700 text-white">
              Discover Music
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Play All Button */}
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={() => downloads.length > 0 && handlePlaySong(downloads[0], 0)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full"
              >
                <Play className="w-5 h-5 mr-2" />
                Play All
              </Button>
              <Badge variant="secondary" className="bg-white/10 text-white">
                <Download className="w-4 h-4 mr-1" />
                Downloaded
              </Badge>
            </div>

            {/* Downloads List */}
            <div className="space-y-2">
              {sortedDownloads.map((song, index) => {
                const isFavorite = userData.favorites.some((fav) => fav.id === song.id)
                const isSelected = selectedSongs.includes(song.id)

                return (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center space-x-4 p-4 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors",
                      isSelected && "bg-white/10 border border-white/20",
                    )}
                  >
                    {/* Selection Checkbox */}
                    <button
                      onClick={() => toggleSelectSong(song.id)}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected ? "bg-green-600 border-green-600" : "border-gray-400 hover:border-white",
                      )}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </button>

                    {/* Song Image */}
                    <div className="relative">
                      <SafeImage src={song.image} alt={song.title} width={56} height={56} className="rounded-lg" />
                      <div
                        onClick={() => handlePlaySong(song, index)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <Play className="w-5 h-5 text-white" />
                      </div>
                      {/* Downloaded indicator */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                        <Download className="w-2 h-2 text-white" />
                      </div>
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{song.title}</h4>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                    </div>

                    {/* Duration */}
                    <div className="text-gray-400 text-sm">
                      {song.duration
                        ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}`
                        : "--:--"}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleFavorite(song)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                      >
                        <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveDownload(song.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-900 border-gray-700" align="end">
                          <DropdownMenuItem onClick={() => addToQueue(song)} className="text-white hover:bg-gray-800">
                            Add to Queue
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleFavorite(song)}
                            className="text-white hover:bg-gray-800"
                          >
                            {userData.favorites.some((fav) => fav.id === song.id)
                              ? "Remove from Favorites"
                              : "Add to Favorites"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveDownload(song.id)}
                            className="text-white hover:bg-gray-800 text-red-400"
                          >
                            Remove Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
