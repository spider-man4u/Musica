"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, ChevronLeft, Play, Share2, Users } from "lucide-react"
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
  const playlistName = searchParams.get("name") || "Playlist"

  const [playlist, setPlaylist] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { playSong, isPlaying, currentSong } = useStore()

  useEffect(() => {
    const loadPlaylist = async () => {
      if (!playlistId) return
      try {
        setLoading(true)
        const result = await getPlaylistDetails(playlistId)
        if (result.success && result.data) {
          setPlaylist(result.data)
        }
      } catch (error) {
        console.error("Error loading playlist:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPlaylist()
  }, [playlistId])

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
                <p className="text-white text-lg font-semibold">{playlist.songCount || 0}</p>
              </div>
              {playlist.followerCount && (
                <div>
                  <p className="text-white/60 text-sm">Followers</p>
                  <p className="text-white text-lg font-semibold">{playlist.followerCount.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button className="bg-white text-purple-900 hover:bg-white/90">
                <Play className="w-4 h-4 mr-2" />
                Play All
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

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-white text-xl font-bold">Playlist Stats</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-sm">Total Songs</p>
              <p className="text-white text-2xl font-bold">{playlist.songCount || 0}</p>
            </div>
            {playlist.followerCount && (
              <div>
                <p className="text-white/60 text-sm">Total Followers</p>
                <p className="text-white text-2xl font-bold">{playlist.followerCount.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-white/60 text-sm">Type</p>
              <p className="text-white text-2xl font-bold">{playlist.isPublic ? "Public" : "Private"}</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
