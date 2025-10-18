"use client"

import type React from "react"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Play, Heart, Clock, Music, Trash2, Grid3X3 } from "lucide-react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getPlaylistSuggestions } from "@/lib/modernMusicApi"

export default function LibraryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { userData, createPlaylist, deletePlaylist, playSong, searchContent, searchResults } = useStore()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [plName, setPlName] = useState("")
  const [plDesc, setPlDesc] = useState("")
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestQuery, setSuggestQuery] = useState("")
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())
  const [newPlaylistId, setNewPlaylistId] = useState<string | null>(null)
  const [playlistSuggestions, setPlaylistSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  const playlists = userData.playlists || []
  const favorites = userData.favorites || []
  const recent = userData.recentlyPlayed || []

  // Filter out mood/auto-generated playlists
  const userPlaylists = playlists.filter((p) => !p.id.startsWith("mood-") && !p.id.startsWith("curated-"))

  const filteredPlaylists = useMemo(() => {
    if (!query.trim()) return userPlaylists
    const q = query.toLowerCase()
    return userPlaylists.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q))
  }, [userPlaylists, query])

  const handleCreatePlaylist = async () => {
    if (!plName.trim()) {
      toast({ title: "Name required", description: "Please enter a playlist name.", variant: "destructive" })
      return
    }
    const pl = createPlaylist(plName.trim(), plDesc.trim())
    setNewPlaylistId(pl.id)
    setPlName("")
    setPlDesc("")
    setOpen(false)

    // Load playlist suggestions for this query
    setLoadingSuggestions(true)
    try {
      const suggestions = await getPlaylistSuggestions(plName.trim())
      setPlaylistSuggestions(suggestions.data || [])
    } catch (error) {
      console.error("Failed to load playlist suggestions:", error)
      setPlaylistSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }

    setSuggestOpen(true)
  }

  const handleSearchSuggestions = async () => {
    if (!suggestQuery.trim()) return
    await searchContent(suggestQuery.trim())
  }

  const resultSongs = useMemo(() => searchResults?.songs?.data || [], [searchResults?.songs?.data])

  const toggleSelected = (sid: string) => {
    setSelectedSongs((prev) => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      return next
    })
  }

  const handleAddSuggestedSongs = () => {
    if (!newPlaylistId) return
    const songsToAdd = resultSongs.filter((s) => selectedSongs.has(s.id))
    if (songsToAdd.length > 0) {
      useStore.getState().addSongsToPlaylist(newPlaylistId, songsToAdd)
      toast({ title: "Songs added", description: `${songsToAdd.length} song(s) added to your new playlist.` })
    }
    setSuggestOpen(false)
    setSuggestQuery("")
    setSelectedSongs(new Set())
    if (newPlaylistId) {
      router.push(`/library/${newPlaylistId}`)
    }
    setNewPlaylistId(null)
  }

  const handleSkipSuggestions = () => {
    setSuggestOpen(false)
    setSuggestQuery("")
    setSelectedSongs(new Set())
    setPlaylistSuggestions([])
    if (newPlaylistId) {
      router.push(`/library/${newPlaylistId}`)
    }
    setNewPlaylistId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-[120px]">
      <header className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/musica-logo.png" alt="Musica" width={40} height={40} className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold text-white">Your Library</h1>
              <p className="text-white/60 text-sm">
                {filteredPlaylists.length} playlists • {favorites.length} liked • {recent.length} recent
              </p>
            </div>
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
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900/90 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Create new playlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-white/80 text-sm">Playlist name</label>
                    <Input
                      value={plName}
                      onChange={(e) => setPlName(e.target.value)}
                      placeholder="My awesome playlist"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-white/80 text-sm">Description (optional)</label>
                    <Input
                      value={plDesc}
                      onChange={(e) => setPlDesc(e.target.value)}
                      placeholder="Add a description..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-2"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)} className="text-white/80">
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePlaylist} className="bg-white text-purple-900 hover:bg-white/90">
                    Create playlist
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
              description="Create a playlist to organize your favorite music."
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
                  <Card className="bg-white/5 border-white/10 overflow-hidden group cursor-pointer hover:bg-white/10 transition">
                    <CardContent className="p-0">
                      <div
                        className="relative"
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
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (pl.songs.length > 0) {
                              useStore.getState().setQueue(pl.songs, 0)
                              useStore.getState().setIsPlaying(true)
                            }
                          }}
                          className="absolute bottom-3 right-3 bg-white text-purple-900 rounded-full p-3 opacity-0 group-hover:opacity-100 transition hover:bg-white/90 shadow-lg"
                          aria-label={`Play ${pl.name}`}
                          title="Play playlist"
                        >
                          <Play className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-bold truncate">{pl.name}</h3>
                        <p className="text-white/60 text-xs truncate">{pl.description || "Playlist"}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-white/50 text-xs">{pl.songs.length} songs</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePlaylist(pl.id)
                              toast({
                                title: "Playlist deleted",
                                description: `"${pl.name}" removed from your library.`,
                              })
                            }}
                            className="text-white/60 hover:text-red-400 transition"
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

      {/* Create Playlist with Suggestions Dialog */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="bg-slate-900/95 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add songs to your playlist</DialogTitle>
          </DialogHeader>

          {/* Playlist Suggestions */}
          {playlistSuggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white/80 text-sm font-semibold mb-3 flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Suggested playlists like yours
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {playlistSuggestions.slice(0, 4).map((playlist) => (
                  <div
                    key={playlist.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer text-xs"
                  >
                    {playlist.image && (
                      <Image
                        src={playlist.image || "/playlist-cover.jpg"}
                        alt={playlist.name}
                        width={80}
                        height={80}
                        className="w-full aspect-square object-cover rounded mb-2"
                      />
                    )}
                    <p className="text-white/80 font-medium truncate">{playlist.name}</p>
                    <p className="text-white/50">{playlist.songCount || 0} songs</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Song Search */}
          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm">Search for songs</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={suggestQuery}
                  onChange={(e) => setSuggestQuery(e.target.value)}
                  placeholder="Search songs to add..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Button onClick={handleSearchSuggestions} className="bg-white text-purple-900 hover:bg-white/90">
                  Search
                </Button>
              </div>
            </div>

            <div className="max-h-[40vh] overflow-y-auto space-y-2">
              {resultSongs.length === 0 ? (
                <div className="text-white/60 text-sm text-center py-8">
                  {suggestQuery ? "No results. Try another search." : "Search to find songs."}
                </div>
              ) : (
                resultSongs.slice(0, 50).map((s) => {
                  const checked = selectedSongs.has(s.id)
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                        checked
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-white/5 hover:bg-white/10 border-white/10"
                      }`}
                      onClick={() => toggleSelected(s.id)}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelected(s.id)}
                        className="accent-emerald-400"
                        aria-label={`Select ${s.title}`}
                      />
                      <Image
                        src={s.image || "/album-art.jpg"}
                        alt={s.title}
                        width={40}
                        height={40}
                        className="rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-white truncate text-sm">{s.title}</div>
                        <div className="text-white/60 text-xs truncate">{s.artist}</div>
                      </div>
                      <div className="text-white/50 text-xs w-12 text-right">
                        {typeof s.duration === "number" && s.duration > 0
                          ? `${Math.floor(s.duration / 60)}:${String(s.duration % 60).padStart(2, "0")}`
                          : "--:--"}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleSkipSuggestions} className="text-white/80">
              Skip for now
            </Button>
            <Button onClick={handleAddSuggestedSongs} className="bg-white text-purple-900 hover:bg-white/90">
              {selectedSongs.size > 0
                ? `Add ${selectedSongs.size} song${selectedSongs.size !== 1 ? "s" : ""}`
                : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
