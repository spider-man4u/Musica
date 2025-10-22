"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, ChevronLeft, Play, Heart, Share2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { getArtistDetails } from "@/lib/modernMusicApi"

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
  const searchParams = useSearchParams()
  const artistId = (params?.id as string) || ""
  const artistName = searchParams.get("name") || "Artist"

  const [artist, setArtist] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { userData, addToFavorites, removeFromFavorites } = useStore()

  useEffect(() => {
    const loadArtist = async () => {
      if (!artistId) return
      try {
        setLoading(true)
        const result = await getArtistDetails(artistId)
        if (result.success && result.data) {
          setArtist(result.data)
        }
      } catch (error) {
        console.error("Error loading artist:", error)
      } finally {
        setLoading(false)
      }
    }

    loadArtist()
  }, [artistId])

  const isFavorite = artist && userData.favorites.some((fav) => fav.artist === artist.name)

  const handleToggleFavorite = () => {
    if (!artist) return
    if (isFavorite) {
      userData.favorites.forEach((fav) => {
        if (fav.artist === artist.name) {
          removeFromFavorites(fav.id)
        }
      })
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading artist...</span>
        </div>
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-white hover:bg-white/10">
          <ChevronLeft className="mr-2 w-5 h-5" /> Back
        </Button>
        <div className="text-center text-white/70">
          <p className="text-lg">Artist not found</p>
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
          <h1 className="text-white font-bold text-2xl">{artist.name}</h1>
          <div />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Artist Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-12"
        >
          <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
            <SafeImage
              src={artist.image}
              alt={artist.name}
              width={256}
              height={256}
              className="rounded-full w-full h-full object-cover border-4 border-white/10"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              {artist.verified && <Badge className="bg-blue-500">Verified</Badge>}
              <span className="text-white/60">Artist</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{artist.name}</h1>

            {artist.bio && <p className="text-white/70 text-lg mb-4 max-w-2xl">{artist.bio}</p>}

            <div className="flex flex-wrap items-center gap-4 mb-6 justify-center md:justify-start">
              {artist.followers && (
                <div>
                  <p className="text-white/60 text-sm">Followers</p>
                  <p className="text-white text-lg font-semibold">{(artist.followers / 1000000).toFixed(1)}M</p>
                </div>
              )}
              {artist.genres && artist.genres.length > 0 && (
                <div>
                  <p className="text-white/60 text-sm">Genres</p>
                  <p className="text-white text-lg font-semibold">{artist.genres.join(", ")}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center md:justify-start">
              <Button className="bg-white text-purple-900 hover:bg-white/90">
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleFavorite}
                className={cn(
                  "border-white/20 text-white hover:bg-white/10",
                  isFavorite && "bg-red-500/20 border-red-500/20",
                )}
              >
                <Heart className={cn("w-4 h-4 mr-2", isFavorite && "fill-red-500")} />
                {isFavorite ? "Saved" : "Save"}
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

        {/* Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <h2 className="text-white text-2xl font-bold mb-4">About</h2>
            <p className="text-white/70">
              {artist.bio ||
                "This is a talented artist creating amazing music. Follow to stay updated with their latest releases and performances."}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <h2 className="text-white text-2xl font-bold mb-4">Stats</h2>
            <div className="space-y-3">
              {artist.followers && (
                <div>
                  <p className="text-white/60 text-sm">Total Followers</p>
                  <p className="text-white text-xl font-semibold">{(artist.followers / 1000000).toFixed(1)}M</p>
                </div>
              )}
              {artist.popularity && (
                <div>
                  <p className="text-white/60 text-sm">Popularity</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${artist.popularity}%` }}
                      />
                    </div>
                    <span className="text-white font-semibold">{artist.popularity}%</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
