"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Music, ChevronLeft, Play, MoreHorizontal } from "lucide-react"
import { useStore } from "@/lib/store"
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

export default function MoodPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.slug as string) || "happy"
  const { getOrCreateMoodPlaylist, playSong } = useStore()
  const [ready, setReady] = useState(false)

  // Build or refresh the mood playlist on mount
  const playlist = useMemo(() => {
    // fallback keywords if not in catalog (store will pick default)
    return getOrCreateMoodPlaylist(slug, [slug])
  }, [slug, getOrCreateMoodPlaylist])

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready || !playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white/70">
        Loading mood playlist...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-white hover:bg-white/10">
          <ChevronLeft className="mr-2 w-5 h-5" /> Back
        </Button>

        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 mb-8">
          <div className="relative w-64 h-64">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl w-full h-full flex items-center justify-center overflow-hidden border border-white/10">
              <SafeImage
                src={playlist.image}
                alt={playlist.name}
                width={256}
                height={256}
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
          </div>
          <div className="flex-1">
            <Badge variant="secondary" className="mb-2 bg-white/10 text-white">
              Mood
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">{playlist.name}</h1>
            <p className="text-white/70 text-lg mb-4">{playlist.description}</p>
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span>{playlist.songs.length} songs</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {playlist.songs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: index * 0.01 } }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-4 flex items-center justify-between hover:bg-white/10 cursor-pointer group transition-all duration-200 border border-white/10"
              onClick={() => playSong(song, playlist.songs)}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="w-8 text-white/70 text-sm group-hover:opacity-0 transition-opacity">
                    {index + 1}
                  </span>
                  <Play className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <SafeImage src={song.image} alt={song.title} width={48} height={48} className="rounded-lg" />
                <div>
                  <p className="font-medium text-white group-hover:text-green-400 transition-colors">{song.title}</p>
                  <p className="text-sm text-white/70">{song.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm w-12 text-right tabular-nums">
                  {typeof song.duration === "number"
                    ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}`
                    : "0:00"}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/70 hover:text-white transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
