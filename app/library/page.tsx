"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { supabase, getCurrentUser } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export const dynamic = "force-static"

type PlaylistItem = {
  id: string
  name: string
  description?: string
  cover_image?: string
  is_public: boolean
  created_at: string
  songs?: {
    id: string
    song_id: string
    song_title: string
    song_artist: string
    song_duration?: number
    position: number
  }[]
}

const playlists = [
  { id: "liked", name: "Liked Songs", image: "/playlist-cover.jpg", count: 42 },
  { id: "focus", name: "Deep Focus", image: "/abstract-album-cover.png", count: 27 },
  { id: "chill", name: "Chill Vibes", image: "/abstract-album-cover.png", count: 19 },
  { id: "workout", name: "Beast Mode", image: "/abstract-album-cover.png", count: 33 },
]

export default function LibraryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [playlistsState, setPlaylists] = useState<PlaylistItem[]>([])
  const [query, setQuery] = useState("")
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "" })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const user = await getCurrentUser()
        if (!mounted) return
        if (!user) {
          setUserId(null)
          setPlaylists([])
          setLoading(false)
          return
        }
        setUserId(user.id)
        const { data, error } = await supabase
          .from("playlists")
          .select(`id, name, description, cover_image, is_public, created_at, playlist_songs:playlist_songs (*)`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error(error)
          toast({ title: "Error", description: "Could not load your library.", variant: "destructive" })
          setPlaylists([])
        } else {
          const mapped: PlaylistItem[] =
            (data as any[])?.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description || "",
              cover_image: p.cover_image || "/playlist-cover.jpg",
              is_public: p.is_public,
              created_at: p.created_at,
              songs:
                (p.playlist_songs as any[])?.map((s) => ({
                  id: s.id,
                  song_id: s.song_id,
                  song_title: s.song_title,
                  song_artist: s.song_artist,
                  song_duration: s.song_duration ?? undefined,
                  position: s.position,
                })) || [],
            })) || []
          setPlaylists(mapped)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return playlistsState
    return playlistsState.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
  }, [playlistsState, query])

  const createPlaylist = async () => {
    if (!userId) {
      toast({ title: "Sign in required", description: "Please sign in to create playlists." })
      return
    }
    if (!form.name.trim()) {
      toast({ title: "Name required", description: "Please enter a playlist name.", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const { error } = await supabase.from("playlists").insert({
        id,
        user_id: userId,
        name: form.name.trim(),
        description: form.description.trim(),
        cover_image: "/playlist-cover.jpg",
        is_public: false,
        created_at: now,
        updated_at: now,
      })
      if (error) {
        toast({ title: "Create failed", description: error.message, variant: "destructive" })
      } else {
        toast({ title: "Playlist created", description: `"${form.name}" has been added.` })
        // Optimistic refresh
        setPlaylists((prev) => [
          {
            id,
            name: form.name.trim(),
            description: form.description.trim(),
            cover_image: "/playlist-cover.jpg",
            is_public: false,
            created_at: now,
            songs: [],
          },
          ...prev,
        ])
        setForm({ name: "", description: "" })
        setOpen(false)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-900/30 to-slate-900/60 text-white">
      <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Library</h1>
        <p className="text-white/60 mt-1">Playlists you love and collections you have created.</p>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-[7rem] md:pb-[6rem]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {userId ? (
            filtered.length > 0 ? (
              filtered.map((pl) => (
                <Card
                  key={pl.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors overflow-hidden"
                  role="button"
                  tabIndex={0}
                >
                  <CardHeader className="p-0">
                    <div className="relative w-full aspect-square">
                      <Image
                        src={pl.cover_image || "/placeholder.svg"}
                        alt={`${pl.name} cover`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                        priority={false}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <CardTitle className="text-base sm:text-lg">{pl.name}</CardTitle>
                    <p className="text-xs text-white/60 mt-1">{pl.songs?.length || 0} songs</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-sm text-white/60 py-20">No playlists found.</div>
            )
          ) : loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            </div>
          ) : (
            <div className="text-center text-sm text-white/60 py-20">Sign in to view and manage your playlists.</div>
          )}
        </div>
      </section>
    </main>
  )
}
