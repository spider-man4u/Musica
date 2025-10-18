"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  Play,
  Pause,
  ListPlus,
  Pencil,
  Trash2,
  MoveUp,
  MoveDown,
  MinusCircle,
  Globe,
  Shuffle,
  Repeat,
  Repeat1,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function PlaylistDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = (params?.id as string) || ""

  // Get fresh state directly from store each render
  const store = useStore()
  const playlist = store.getPlaylistById(id)

  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (playlist) {
      setName(playlist.name)
      setDescription(playlist.description)
      setIsPublic(playlist.isPublic)
    }
  }, [playlist]) // Updated dependency to [playlist]

  const handlePlayAll = () => {
    const pl = store.getPlaylistById(id)
    if (!pl || pl.songs.length === 0) return
    store.setQueue(pl.songs, 0)
    store.setIsPlaying(true)
  }

  const handleToggleShuffle = () => {
    store.toggleShuffle()
  }

  const handleCycleRepeat = () => {
    const modes: Array<"off" | "one" | "all"> = ["off", "one", "all"]
    const current = store.repeatMode
    const idx = modes.indexOf(current)
    const next = modes[(idx + 1) % modes.length]
    store.setRepeatMode(next)
  }

  const handleTogglePublic = (value: boolean) => {
    store.updatePlaylistMeta(id, { isPublic: value })
    setIsPublic(value)
    toast({
      title: value ? "Playlist is now public" : "Playlist set to private",
      description: value ? "Anyone can discover it." : "Only you can see this playlist.",
    })
  }

  const handleSaveMeta = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter a name.", variant: "destructive" })
      return
    }
    store.updatePlaylistMeta(id, { name: name.trim(), description: description.trim() })
    setEditOpen(false)
    toast({ title: "Playlist updated", description: "Your changes have been saved." })
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    await store.searchContent(query.trim())
  }

  const resultSongs = useMemo(() => store.searchResults?.songs?.data || [], [store.searchResults?.songs?.data])

  const toggleSelected = (sid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      return next
    })
  }

  const handleAddSongs = () => {
    if (!playlist) return
    const songsToAdd = resultSongs.filter((s) => selectedIds.has(s.id))
    if (songsToAdd.length === 0) {
      toast({ title: "No songs selected", description: "Choose at least one song.", variant: "destructive" })
      return
    }
    store.addSongsToPlaylist(id, songsToAdd)
    setSelectedIds(new Set())
    setAddOpen(false)
    toast({ title: "Songs added", description: `${songsToAdd.length} song(s) added.` })
  }

  const handleDeletePlaylist = () => {
    store.deletePlaylist(id)
    toast({ title: "Playlist deleted", description: "It has been removed from your library." })
    router.push("/library")
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 text-white/80">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        Playlist not found.
      </div>
    )
  }

  const playingThisPlaylist = store.currentSong && playlist.songs.some((s) => s.id === store.currentSong?.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-[120px]">
      <header className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Badge className={cn("bg-white/10 text-white", isPublic && "bg-emerald-600/20 text-emerald-300")}>
              {isPublic ? "Public" : "Private"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <Globe className={cn("w-4 h-4", isPublic ? "text-emerald-300" : "text-white/60")} />
              <span className="text-xs text-white/80">Public</span>
              <Switch checked={isPublic} onCheckedChange={handleTogglePublic} />
            </div>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              onClick={handlePlayAll}
            >
              {store.isPlaying && playingThisPlaylist ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {store.isPlaying && playingThisPlaylist ? "Pause" : "Play"}
            </Button>
            <Button
              variant="ghost"
              className={cn("text-white/80 hover:text-white", store.isShuffled && "text-emerald-400")}
              onClick={handleToggleShuffle}
              title={`Shuffle: ${store.isShuffled ? "on" : "off"}`}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className={cn("text-white/80 hover:text-white", store.repeatMode !== "off" && "text-emerald-400")}
              onClick={handleCycleRepeat}
              title={`Repeat: ${store.repeatMode}`}
            >
              {store.repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white"
              onClick={() => setEditOpen(true)}
              title="Edit details"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={handleDeletePlaylist}
              title="Delete playlist"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header block */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <Image
              src={playlist.image || "/playlist-cover.jpg"}
              alt={playlist.name}
              width={512}
              height={512}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-white/60 text-sm">Playlist</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white mt-1">{playlist.name}</h1>
            <p className="text-white/70 mt-3">{playlist.description || "No description"}</p>
            <div className="flex items-center gap-4 mt-4 text-white/60 text-sm">
              <span>{playlist.songs.length} songs</span>
              <span>•</span>
              <span>{isPublic ? "Public" : "Private"}</span>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={handlePlayAll} className="bg-white text-purple-900 hover:bg-white/90">
                <Play className="w-4 h-4 mr-2" /> Play all
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                onClick={() => setAddOpen(true)}
              >
                <ListPlus className="w-4 h-4 mr-2" /> Add songs
              </Button>
            </div>
          </div>
        </div>

        {/* Songs list */}
        {playlist.songs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-white/70">
            No songs yet. Click "Add songs" to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {playlist.songs.map((song, idx) => (
              <motion.div
                key={`${song.id}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition group"
              >
                <div className="w-6 text-center text-white/50 text-sm">{idx + 1}</div>
                <div className="relative">
                  <Image
                    src={song.image || "/album-art.jpg"}
                    alt={song.title}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover"
                  />
                  <button
                    onClick={() => store.playSong(song, playlist.songs)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg"
                    aria-label={`Play ${song.title}`}
                  >
                    <Play className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate">{song.title}</div>
                  <div className="text-white/60 text-sm truncate">{song.artist}</div>
                </div>
                <div className="hidden sm:block text-white/50 text-xs w-12 text-right">
                  {typeof song.duration === "number" && song.duration > 0
                    ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, "0")}`
                    : "--:--"}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/70 hover:text-white w-8 h-8"
                    onClick={() => store.reorderPlaylistItem(id, idx, Math.max(0, idx - 1))}
                    title="Move up"
                  >
                    <MoveUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/70 hover:text-white w-8 h-8"
                    onClick={() => store.reorderPlaylistItem(id, idx, Math.min(playlist.songs.length - 1, idx + 1))}
                    title="Move down"
                  >
                    <MoveDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 w-8 h-8"
                    onClick={() => store.removeFromPlaylist(id, song.id)}
                    title="Remove from playlist"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-900/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <div className="flex items-center gap-3">
              <Switch checked={isPublic} onCheckedChange={handleTogglePublic} />
              <span className="text-white/80 text-sm">Make public</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-white/80">
              Cancel
            </Button>
            <Button onClick={handleSaveMeta} className="bg-white text-purple-900 hover:bg-white/90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add songs dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-slate-900/95 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add songs to playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for songs..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button onClick={handleSearch} className="bg-white text-purple-900 hover:bg-white/90">
                Search
              </Button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {resultSongs.length === 0 ? (
                <div className="text-white/60 text-sm text-center py-8">
                  {query ? "No results. Try a different search." : "Search above to find songs."}
                </div>
              ) : (
                resultSongs.slice(0, 50).map((s) => {
                  const checked = selectedIds.has(s.id)
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer",
                        checked
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-white/5 hover:bg-white/10 border-white/10",
                      )}
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
                        <div className="text-white truncate">{s.title}</div>
                        <div className="text-white/60 text-sm truncate">{s.artist}</div>
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
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="text-white/80">
              Cancel
            </Button>
            <Button onClick={handleAddSongs} className="bg-white text-purple-900 hover:bg-white/90">
              Add selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
