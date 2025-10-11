"use client"

import type React from "react"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Play, Heart, Clock, Music, Trash2, ListMusic } from "lucide-react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function LibraryPage() {
  const router = useRouter()
  const { userData, createPlaylist, deletePlaylist, playSong } = useStore()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [plName, setPlName] = useState("")
  const [plDesc, setPlDesc] = useState("")

  const playlists = userData.playlists || []
  const favorites = userData.favorites || []
  const recent = userData.recentlyPlayed || []

  const filteredPlaylists = useMemo(() => {
    if (!query.trim()) return playlists
    const q = query.toLowerCase()
    return playlists.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q))
  }, [playlists, query])

  const handleCreate = () => {
    if (!plName.trim()) return
    const pl = createPlaylist(plName.trim(), plDesc.trim())
    setPlName("")
    setPlDesc("")
    setOpen(false)
    // Navigate into the new playlist for immediate editing
    router.push(`/library/${pl.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-[120px]">
      <header className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ListMusic className="w-7 h-7" />
              Library
            </h1>
            <p className="text-white/60 text-sm">
              {playlists.length} playlists • {favorites.length} liked • {recent.length} recent
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 w-60"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-purple-900 hover:bg-white/90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Playlist
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900/90 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Create playlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={plName}
                    onChange={(e) => setPlName(e.target.value)}
                    placeholder="Playlist name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Input
                    value={plDesc}
                    onChange={(e) => setPlDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)} className="text-white/80">
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} className="bg-white text-purple-900 hover:bg-white/90">
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Liked Songs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-semibold">Liked Songs</h2>
            <Badge className="bg-white/10 text-white">{favorites.length}</Badge>
          </div>
          {favorites.length === 0 ? (
            <EmptyState icon={Heart} title="No liked songs yet" description="Like songs to save them here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favorites.map((s, i) => (
                <SongTile key={s.id} song={s} onPlay={() => playSong(s, favorites)} delay={i * 0.03} />
              ))}
            </div>
          )}
        </section>

        {/* Recently Played */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-semibold">Recently Played</h2>
            <Badge className="bg-white/10 text-white">{recent.length}</Badge>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Nothing here yet"
              description="Your recently played songs will show up here."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recent.map((s, i) => (
                <SongTile key={s.id} song={s} onPlay={() => playSong(s, recent)} delay={i * 0.03} />
              ))}
            </div>
          )}
        </section>

        {/* Playlists */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-semibold">Your Playlists</h2>
            <Badge className="bg-white/10 text-white">{filteredPlaylists.length}</Badge>
          </div>
          {filteredPlaylists.length === 0 ? (
            <EmptyState
              icon={Music}
              title="No playlists yet"
              description="Create a playlist to start organizing your music."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPlaylists.map((pl, i) => (
                <motion.div
                  key={pl.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="bg-white/5 border-white/10 overflow-hidden group">
                    <CardContent className="p-0">
                      <div
                        className="relative cursor-pointer"
                        onClick={() => router.push(`/library/${pl.id}`)}
                        role="button"
                        aria-label={`Open ${pl.name}`}
                      >
                        <Image
                          src={pl.image || "/playlist-cover.jpg"}
                          alt={pl.name}
                          width={600}
                          height={600}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (pl.songs.length > 0) {
                              useStore.getState().setQueue(pl.songs, 0)
                              useStore.getState().setIsPlaying(true)
                            }
                          }}
                          className="absolute bottom-2 right-2 bg-white text-purple-900 rounded-full p-3 opacity-0 group-hover:opacity-100 transition"
                          aria-label={`Play ${pl.name}`}
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h3 className="text-white font-semibold truncate">{pl.name}</h3>
                            <p className="text-white/60 text-xs truncate">{pl.description || "Playlist"}</p>
                            <p className="text-white/50 text-xs mt-1">{pl.songs.length} songs</p>
                          </div>
                          <button
                            onClick={() => deletePlaylist(pl.id)}
                            className="text-white/60 hover:text-red-400 p-2 rounded-lg"
                            aria-label="Delete playlist"
                            title="Delete playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/70">
      <Icon className="w-10 h-10 mx-auto mb-3" />
      <div className="font-medium">{title}</div>
      <div className="text-sm">{description}</div>
    </div>
  )
}

function SongTile({
  song,
  onPlay,
  delay = 0,
}: {
  song: {
    id: string
    title: string
    artist: string
    image: string
    duration?: number
  }
  onPlay: () => void
  delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition group">
        <div className="relative">
          <Image
            src={song.image || "/album-art.jpg"}
            alt={song.title}
            width={56}
            height={56}
            className="rounded-lg object-cover"
          />
          <button
            onClick={onPlay}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg"
            aria-label="Play"
          >
            <Play className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate">{song.title}</div>
          <div className="text-white/60 text-sm truncate">{song.artist}</div>
        </div>
        {typeof song.duration === "number" && song.duration > 0 ? (
          <div className="text-white/60 text-xs">
            {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, "0")}
          </div>
        ) : (
          <div className="text-white/40 text-xs">--:--</div>
        )}
      </div>
    </motion.div>
  )
}
