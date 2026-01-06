"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Music, Play, Loader2, Users, Disc3, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useStore } from "@/lib/store"
import { searchMusic, searchArtists, searchPlaylists } from "@/lib/modernMusicApi"
import { cn } from "@/lib/utils"

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

type Tab = "all" | "songs" | "artists" | "playlists"

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const [loading, setLoading] = useState(false)

  const [songs, setSongs] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [playlists, setPlaylists] = useState<any[]>([])

  const { playSong, addToFavorites, userData, searchHistory } = useStore()

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSongs([])
      setArtists([])
      setPlaylists([])
      return
    }

    setLoading(true)
    try {
      console.log(`\n🔍 Searching for: "${query}"`)

      const [songsRes, artistsRes, playlistsRes] = await Promise.all([
        searchMusic(query),
        searchArtists(query),
        searchPlaylists(query),
      ])

      console.log(`✅ Songs: ${songsRes.data.results.length}`)
      console.log(`✅ Artists: ${artistsRes.data.length}`)
      console.log(`✅ Playlists: ${playlistsRes.data.length}`)

      setSongs(songsRes.data.results || [])
      setArtists(artistsRes.data || [])
      setPlaylists(playlistsRes.data || [])
    } catch (error) {
      console.error("Search error:", error)
      setSongs([])
      setArtists([])
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePlaySong = (song: any) => {
    const converted = {
      id: song.id,
      title: song.title || "Unknown Song",
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      image: song.image || "/placeholder.svg?height=300&width=300",
      audio: song.audio || song.download_url || "",
      duration: song.duration || 0,
    }
    playSong(converted, [converted])
  }

  const isFavorite = (songId: string) => userData?.favorites?.some((fav) => fav?.id === songId) || false

  const getDisplayCount = () => {
    switch (activeTab) {
      case "songs":
        return songs.length
      case "artists":
        return artists.length
      case "playlists":
        return playlists.length
      case "all":
        return songs.length + artists.length + playlists.length
      default:
        return 0
    }
  }

  const showSongs = activeTab === "all" || activeTab === "songs"
  const showArtists = activeTab === "all" || activeTab === "artists"
  const showPlaylists = activeTab === "all" || activeTab === "playlists"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-white hover:bg-white/10 flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Input
              placeholder="Search songs, artists, playlists..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!searchQuery && searchHistory.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Music className="w-6 h-6 text-blue-400" />
              Recent Searches
            </h2>
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {searchHistory.map((query, index) => (
                <motion.div
                  key={`${query}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => {
                    setSearchQuery(query)
                    handleSearch(query)
                  }}
                  className="flex items-center gap-3 p-4 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{query}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {searchQuery && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-8 flex-wrap">
              <Button
                onClick={() => setActiveTab("all")}
                variant={activeTab === "all" ? "default" : "outline"}
                className={cn(
                  "transition-all",
                  activeTab === "all"
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "border-white/20 text-white/70 hover:text-white",
                )}
              >
                All ({getDisplayCount()})
              </Button>
              <Button
                onClick={() => setActiveTab("songs")}
                variant={activeTab === "songs" ? "default" : "outline"}
                className={cn(
                  "transition-all",
                  activeTab === "songs"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-white/20 text-white/70 hover:text-white",
                )}
              >
                <Music className="w-4 h-4 mr-2" />
                Songs ({songs.length})
              </Button>
              <Button
                onClick={() => setActiveTab("artists")}
                variant={activeTab === "artists" ? "default" : "outline"}
                className={cn(
                  "transition-all",
                  activeTab === "artists"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "border-white/20 text-white/70 hover:text-white",
                )}
              >
                <Users className="w-4 h-4 mr-2" />
                Artists ({artists.length})
              </Button>
              <Button
                onClick={() => setActiveTab("playlists")}
                variant={activeTab === "playlists" ? "default" : "outline"}
                className={cn(
                  "transition-all",
                  activeTab === "playlists"
                    ? "bg-pink-600 text-white hover:bg-pink-700"
                    : "border-white/20 text-white/70 hover:text-white",
                )}
              >
                <Disc3 className="w-4 h-4 mr-2" />
                Playlists ({playlists.length})
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </div>
              </div>
            )}

            {!loading && getDisplayCount() === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 text-gray-400"
              >
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No {activeTab === "all" ? "results" : activeTab} found</p>
                <p className="text-sm mt-2">Try a different search query</p>
              </motion.div>
            )}

            {/* Songs */}
            {!loading && showSongs && songs.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                {activeTab === "all" && (
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Music className="w-6 h-6 text-blue-400" />
                    Songs
                  </h2>
                )}
                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {songs.map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center gap-4 p-4 hover:bg-white/10 group transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <div className="relative">
                        <SafeImage src={song.image} alt={song.title} width={48} height={48} className="rounded-lg" />
                        <button
                          onClick={() => handlePlaySong(song)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                        >
                          <Play className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{song.title}</h4>
                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                      </div>
                      <span className="text-white/60 text-sm">
                        {song.duration
                          ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
                          : ""}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Artists */}
            {!loading && showArtists && artists.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                {activeTab === "all" && (
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-400" />
                    Artists
                  </h2>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {artists.map((artist, index) => (
                    <motion.div
                      key={artist.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => router.push(`/artist/${artist.id}`)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-all group"
                    >
                      <div className="relative mb-4 overflow-hidden rounded-lg">
                        <SafeImage
                          src={artist.image}
                          alt={artist.name}
                          width={200}
                          height={200}
                          className="rounded-lg w-full aspect-square object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <h3 className="text-white font-bold truncate group-hover:text-purple-300">{artist.name}</h3>
                      {artist.followers && (
                        <p className="text-gray-400 text-sm">{(artist.followers / 1000).toFixed(0)}K followers</p>
                      )}
                      {artist.verified && <Badge className="mt-2 bg-blue-500">Verified</Badge>}
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Playlists */}
            {!loading && showPlaylists && playlists.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                {activeTab === "all" && (
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Disc3 className="w-6 h-6 text-pink-400" />
                    Playlists
                  </h2>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {playlists.map((playlist, index) => (
                    <motion.div
                      key={playlist.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-all group"
                    >
                      <div
                        onClick={() =>
                          router.push(`/playlist/${playlist.id}?name=${encodeURIComponent(playlist.name)}`)
                        }
                        className="relative mb-4 overflow-hidden rounded-lg"
                      >
                        <SafeImage
                          src={playlist.image}
                          alt={playlist.name}
                          width={200}
                          height={200}
                          className="rounded-lg w-full aspect-square object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h3
                        onClick={() =>
                          router.push(`/playlist/${playlist.id}?name=${encodeURIComponent(playlist.name)}`)
                        }
                        className="text-white font-bold truncate group-hover:text-purple-300 cursor-pointer"
                      >
                        {playlist.name}
                      </h3>
                      {playlist.songCount && <p className="text-gray-400 text-sm">{playlist.songCount} songs</p>}
                      {playlist.followerCount && (
                        <p className="text-gray-400 text-sm">{(playlist.followerCount / 1000).toFixed(0)}K followers</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </>
        )}

        {!searchQuery && searchHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 text-gray-400"
          >
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Start searching for songs, artists, or playlists</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
