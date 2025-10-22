"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, ChevronLeft, Play, Share2, Heart } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { getPlaylistDetails } from "@/lib/modernMusicApi"

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
        <Music className="w-6 h-6 text-gray-400" />
      </div>
    )
  }
  return <Image src={validSrc || "/placeholder.svg"} alt={alt} width={width} height={height} className={className} />
}

export default function PlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const playlistId = (params?.id as string) || ""

  const [playlist, setPlaylist] = useState<any>(null)
  const [songs, setSongs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { playSong, userData, addToFavorites, removeFromFavorites } = useStore()

  useEffect(() => {
    const loadPlaylist = async () => {
      if (!playlistId) return
      try {
        setLoading(true)
        console.log(`📋 Loading playlist: ${playlistId}`)
        const result = await getPlaylistDetails(playlistId)
        console.log(`📋 Playlist result:`, result)

        if (result.success && result.data) {
          setPlaylist(result.data)

          // Extract songs from playlist
          if (Array.isArray(result.data.songs) && result.data.songs.length > 0) {
            console.log(`🎵 Found ${result.data.songs.length} songs in playlist`)
            setSongs(result.data.songs)
          } else {
            console.warn(`⚠️ No songs found in playlist`)
            setSongs([])
          }
        }
      } catch (error) {
        console.error("Error loading playlist:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPlaylist()
  }, [playlistId])

  const handlePlaySong = (song: any, index: number) => {
    const convertedSong = {
      id: song.id || `song-${index}`,
      title: song.title || "Unknown Song",
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      image: song.image || "/placeholder.svg?height=300&width=300",
      audio: song.audio || song.download_url || "",
      duration: song.duration || 0,
    }

    playSong(
      convertedSong,
      songs.map((s, i) => ({
        id: s.id || `song-${i}`,
        title: s.title || "Unknown Song",
        artist: s.artist || "Unknown Artist",
        album: s.album || "Unknown Album",
        image: s.image || "/placeholder.svg?height=300&width=300",
        audio: s.audio || s.download_url || "",
        duration: s.duration || 0,
      })),
    )
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: playlist?.name || "Playlist",
          text: `Check out ${playlist?.name} on Musica!`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch (error) {
      console.error("Share failed:", error)
    }
  }

  const formatDuration = (d: number | string) => {
    if (typeof d === "string") return d
    if (!d || isNaN(d)) return "0:00"
    const m = Math.floor(d / 60)
    const s = Math.floor(d % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading playlist...</span>
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-white hover:bg-white/10">
          <ChevronLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <div className="text-center text-white/70">
          <p className="text-lg">Playlist not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-white font-bold text-2xl truncate">{playlist.name}</h1>
          <div />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Playlist Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start gap-6 md:gap-8 mb-12"
        >
          <div className="relative w-56 h-56 md:w-64 md:h-64 flex-shrink-0">
            <SafeImage
              src={playlist.image}
              alt={playlist.name}
              width={256}
              height={256}
              className="rounded-xl w-full h-full object-cover border-4 border-white/10"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-500">Playlist</Badge>
              {playlist.isPublic && <Badge className="bg-green-500">Public</Badge>}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{playlist.name}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div>
                <p className="text-white/60 text-sm">Songs</p>
                <p className="text-white text-lg font-semibold">{songs.length || 0}</p>
              </div>
              {playlist.followerCount && (
                <div>
                  <p className="text-white/60 text-sm">Followers</p>
                  <p className="text-white text-lg font-semibold">{playlist.followerCount.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => songs.length > 0 && handlePlaySong(songs[0], 0)}
                disabled={songs.length === 0}
                className="bg-white text-purple-900 hover:bg-white/90 disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                {songs.length > 0 ? "Play All" : "No Songs"}
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Playlist Info */}
        {playlist.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8"
          >
            <h2 className="text-white text-xl font-bold mb-2">About this Playlist</h2>
            <p className="text-white/70">{playlist.description}</p>
          </motion.div>
        )}

        {/* Songs List */}
        {songs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <h2 className="text-white text-2xl font-bold mb-4">Songs ({songs.length})</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {songs.map((song, index) => {
                const isFavorite = userData?.favorites?.some((fav) => fav?.id === song.id) || false
                return (
                  <motion.div
                    key={song.id || `song-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-4 p-4 hover:bg-white/10 cursor-pointer group transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="text-white/60 w-8 text-center font-semibold">{index + 1}</div>
                    <div className="relative">
                      <SafeImage
                        src={song.image}
                        alt={song.title || "Unknown Song"}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                      <div
                        onClick={() => handlePlaySong(song, index)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{song.title || "Unknown Song"}</h4>
                      <p className="text-gray-400 text-sm truncate">{song.artist || "Unknown Artist"}</p>
                    </div>
                    <span className="text-white/60 text-sm tabular-nums">{formatDuration(song.duration)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const converted = {
                          id: song.id,
                          title: song.title || "Unknown Song",
                          artist: song.artist || "Unknown Artist",
                          album: song.album || "Unknown Album",
                          image: song.image || "/placeholder.svg?height=300&width=300",
                          audio: song.audio || song.download_url || "",
                          duration: song.duration || 0,
                        }
                        if (isFavorite) removeFromFavorites(song.id)
                        else addToFavorites(converted)
                      }}
                      className="text-gray-400 hover:text-white w-8 h-8"
                    >
                      <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-xl p-12 text-center"
          >
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-white/70 text-lg">No songs in this playlist</p>
            <p className="text-white/50 text-sm mt-2">Songs will appear here when added to the playlist</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
