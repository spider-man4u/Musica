"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, ChevronLeft, Play, Heart, Share2, CheckCircle2, Album } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { getArtistDetails, getArtistSongs, getArtistAlbums } from "@/lib/modernMusicApi"

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

export default function ArtistPage() {
  const params = useParams()
  const router = useRouter()
  const artistId = (params?.id as string) || ""

  const [artist, setArtist] = useState<any>(null)
  const [songs, setSongs] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { playSong, userData, addToFavorites, removeFromFavorites } = useStore()

  useEffect(() => {
    const loadArtist = async () => {
      if (!artistId) {
        setError("No artist ID provided")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        console.log(`👨‍🎤 Loading artist: ${artistId}`)

        const [artistRes, songsRes, albumsRes] = await Promise.all([
          getArtistDetails(artistId),
          getArtistSongs(artistId),
          getArtistAlbums(artistId),
        ])

        if (!artistRes.success || !artistRes.data) {
          setError(artistRes.message || "Failed to load artist")
          console.error("❌ Failed to load artist:", artistRes.message)
          setArtist(null)
          setSongs([])
          setAlbums([])
          return
        }

        setArtist(artistRes.data)
        setSongs(songsRes.data || [])
        setAlbums(albumsRes.data || [])

        console.log(`✅ Loaded artist: ${artistRes.data.name}`)
        console.log(`✅ Found ${songsRes.data?.length || 0} songs`)
        console.log(`✅ Found ${albumsRes.data?.length || 0} albums`)
      } catch (error) {
        console.error("Error loading artist:", error)
        setError("Error loading artist. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadArtist()
  }, [artistId])

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
          title: artist?.name || "Artist",
          text: `Check out ${artist?.name} on Musica!`,
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
        <div className="flex flex-col items-center space-x-4">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 mt-4">Loading artist...</span>
        </div>
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-white hover:bg-white/10">
          <ChevronLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 mb-6">
            <Music className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Artist Not Found</h2>
            <p className="text-gray-300 mb-6">
              {error || "The artist could not be loaded. Please try searching again."}
            </p>
            <Button onClick={() => router.push("/search")} className="bg-purple-600 hover:bg-purple-700">
              Search for Artists
            </Button>
          </div>
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
          <h1 className="text-white font-bold text-xl md:text-2xl truncate">{artist.name}</h1>
          <div />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Artist Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-12"
        >
          <div className="relative w-56 h-56 md:w-72 md:h-72 flex-shrink-0 mb-8">
            <SafeImage
              src={artist.image}
              alt={artist.name}
              width={288}
              height={288}
              className="rounded-full w-full h-full object-cover border-4 border-white/10 shadow-2xl"
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white">{artist.name}</h1>
            {artist.verified && <CheckCircle2 className="w-8 h-8 text-blue-400" />}
          </div>

          {artist.bio && <p className="text-gray-300 text-lg mb-6 max-w-2xl">{artist.bio}</p>}

          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="text-white/60 text-sm">Followers</p>
              <p className="text-white text-2xl font-bold">{(artist.followers / 1000000).toFixed(1)}M</p>
            </div>
            {artist.genres && artist.genres.length > 0 && (
              <div className="text-center">
                <p className="text-white/60 text-sm">Genres</p>
                <div className="flex gap-2 mt-2 flex-wrap justify-center">
                  {artist.genres.slice(0, 3).map((genre: string) => (
                    <Badge key={genre} className="bg-purple-500/50">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              onClick={() => songs.length > 0 && handlePlaySong(songs[0], 0)}
              disabled={songs.length === 0}
              className="bg-white text-purple-900 hover:bg-white/90 disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" />
              {songs.length > 0 ? "Play Top Songs" : "No Songs"}
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
        </motion.div>

        {/* Top Songs */}
        {songs.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-400" />
              Top Songs
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {songs.slice(0, 10).map((song, index) => {
                const isFavorite = userData?.favorites?.some((fav) => fav?.id === song.id) || false
                return (
                  <motion.div
                    key={song.id || `song-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-4 p-4 hover:bg-white/10 group transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="text-white/60 w-8 text-center font-semibold flex-shrink-0">{index + 1}</div>
                    <div className="relative flex-shrink-0">
                      <SafeImage
                        src={song.image}
                        alt={song.title || "Unknown Song"}
                        width={48}
                        height={48}
                        className="rounded-lg"
                      />
                      <div
                        onClick={() => handlePlaySong(song, index)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                      >
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{song.title || "Unknown Song"}</h4>
                      <p className="text-gray-400 text-sm truncate">{song.album || "Unknown Album"}</p>
                    </div>
                    <span className="text-white/60 text-sm tabular-nums flex-shrink-0">
                      {formatDuration(song.duration)}
                    </span>
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
                      className="text-gray-400 hover:text-white w-8 h-8 flex-shrink-0"
                    >
                      <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Album className="w-6 h-6 text-pink-400" />
              Albums ({albums.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 group transition-all cursor-pointer"
                >
                  <div className="relative mb-4 overflow-hidden rounded-lg">
                    <SafeImage
                      src={album.image}
                      alt={album.name}
                      width={200}
                      height={200}
                      className="rounded-lg w-full aspect-square object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <h3 className="text-white font-bold truncate">{album.name}</h3>
                  {album.releaseDate && <p className="text-gray-400 text-sm">{album.releaseDate}</p>}
                  {album.songCount && <p className="text-gray-400 text-sm">{album.songCount} songs</p>}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {songs.length === 0 && albums.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-12 text-center"
          >
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-white/70 text-lg">No content available</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
