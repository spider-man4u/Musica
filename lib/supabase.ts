import { createClient, type User } from "@supabase/supabase-js"

// Supabase configuration (envs are pre-provisioned in this workspace)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zlxmcnazmnzkyhbuzafr.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseG1jbmF6bW56a3loYnV6YWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MjY1NzYsImV4cCI6MjA2NDUwMjU3Nn0.xGfM5CPYph8nnYgmRPDy66RTdNfaEoNdMImSZXL_HnU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export interface Profile {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  selected_artists?: string[]
  created_at?: string
  updated_at?: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme?: "dark" | "light"
  audio_quality?: "low" | "medium" | "high"
  notifications_enabled?: boolean
  auto_play?: boolean
  ai_suggestions?: boolean
  ai_shuffle?: boolean
  crossfade?: boolean
  download_enabled?: boolean
  language?: string
  created_at?: string
  updated_at?: string
}

export interface Favorite {
  id: string
  user_id: string
  song_id: string
  song_title: string
  song_artist: string
  song_album?: string
  song_image?: string
  song_audio?: string
  song_duration?: number
  song_language?: string
  song_year?: string
  created_at: string
}

export interface Playlist {
  id: string
  user_id: string
  name: string
  description?: string
  cover_image?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface PlaylistSong {
  id: string
  playlist_id: string
  song_id: string
  song_title: string
  song_artist: string
  song_album?: string
  song_image?: string
  song_audio?: string
  song_duration?: number
  position: number
  created_at: string
}

export interface RecentlyPlayed {
  id: string
  user_id: string
  song_id: string
  song_title: string
  song_artist: string
  song_album?: string
  song_image?: string
  song_audio?: string
  song_duration?: number
  played_at: string
}

export interface Download {
  id: string
  user_id: string
  song_id: string
  song_title: string
  song_artist: string
  song_album?: string
  song_image?: string
  song_audio?: string
  song_duration?: number
  download_url?: string
  file_size?: number
  downloaded_at: string
}

export interface ListeningHistory {
  id: string
  user_id: string
  song_id: string
  listened_at: string
  duration_played: number
}

export interface SearchHistory {
  id: string
  user_id: string
  query: string
  searched_at: string
}

// Minimal sign up; if DB triggers cause "Database error saving new user", fall back to magic link.
export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      if (error.message?.toLowerCase().includes("database error saving new user")) {
        const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined
        const { error: magicErr } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        })
        if (magicErr) {
          return { success: false, error: magicErr.message }
        }
        return {
          success: true,
          needsEmailConfirmation: true,
          usedMagicLink: true,
          message: "We emailed you a magic link. Open it to finish signing up.",
        }
      }
      return { success: false, error: error.message }
    }
    if (!data.session) {
      return { success: true, user: data.user, needsEmailConfirmation: true }
    }
    return { success: true, user: data.user, needsEmailConfirmation: false }
  } catch (err: any) {
    return { success: false, error: err?.message || "Unexpected error during sign up" }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Invalid email or password" }
      }
      if (error.message.includes("Email not confirmed")) {
        return { success: false, error: "Please confirm your email before signing in" }
      }
      return { success: false, error: error.message }
    }
    return { success: true, user: data.user, session: data.session }
  } catch (err: any) {
    return { success: false, error: err?.message || "Unexpected error during sign in" }
  }
}

// Open OAuth in a new tab and redirect to /auth/callback where we exchange the code
export const signInWithProvider = async (provider: "google" | "github" | "gitlab" | "bitbucket") => {
  try {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    })
    if (error) return { success: false, error: error.message }
    if (typeof window !== "undefined" && data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer")
    }
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err?.message || "Unexpected error during OAuth sign in" }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || "Unexpected error during sign out" }
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return null
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) return null
    return user
  } catch {
    return null
  }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
  if (error) {
    console.error("Get user profile error:", error)
    return null
  }
  return data
}

export const ensureProfileExists = async (user: User) => {
  const existing = await getUserProfile(user.id)
  if (existing) return { created: false, profile: existing }

  const username = user.user_metadata?.username || user.email?.split("@")[0] || "User"

  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        username,
        full_name: user.user_metadata?.name || username,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Create profile error:", error)
      return { created: false, error: error.message }
    }
    return { created: true, profile: data }
  } catch (err: any) {
    console.error("Create profile exception:", err)
    return { created: false, error: err?.message || "Failed to create profile" }
  }
}

export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<Profile, "username" | "full_name" | "avatar_url" | "email">>,
) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("*")
      .single()
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update profile" }
  }
}

// Persist likes, recent, downloads, playlists, search history, preferences
export const syncUserData = async (userId: string, userData: any) => {
  try {
    if (userData.favorites?.length) {
      const favorites = userData.favorites.map((song: any) => ({
        user_id: userId,
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist,
        song_album: song.album,
        song_image: song.image,
        song_audio: song.audio,
        song_duration: song.duration,
        song_language: song.language,
        song_year: song.year,
        created_at: new Date().toISOString(),
      }))
      await supabase.from("favorites").upsert(favorites, { onConflict: "user_id,song_id", ignoreDuplicates: false })
    }

    if (userData.recentlyPlayed?.length) {
      await supabase.from("recently_played").delete().eq("user_id", userId)
      const recents = userData.recentlyPlayed.map((song: any, i: number) => ({
        user_id: userId,
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist,
        song_album: song.album,
        song_image: song.image,
        song_audio: song.audio,
        song_duration: song.duration,
        played_at: new Date(Date.now() - i * 60000).toISOString(),
      }))
      await supabase.from("recently_played").insert(recents)
    }

    if (userData.downloads?.length) {
      const downloads = userData.downloads.map((song: any) => ({
        user_id: userId,
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist,
        song_album: song.album,
        song_image: song.image,
        song_audio: song.audio,
        song_duration: song.duration,
        download_url: song.download_url,
        downloaded_at: new Date().toISOString(),
      }))
      await supabase.from("downloads").upsert(downloads, { onConflict: "user_id,song_id", ignoreDuplicates: false })
    }

    if (userData.playlists?.length) {
      for (const playlist of userData.playlists) {
        await supabase.from("playlists").upsert(
          {
            id: playlist.id,
            user_id: userId,
            name: playlist.name,
            description: playlist.description,
            cover_image: playlist.image,
            is_public: playlist.isPublic || false,
            created_at: playlist.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        await supabase.from("playlist_songs").delete().eq("playlist_id", playlist.id)
        if (playlist.songs?.length) {
          const rows = playlist.songs.map((song: any, i: number) => ({
            playlist_id: playlist.id,
            song_id: song.id,
            song_title: song.title,
            song_artist: song.artist,
            song_album: song.album,
            song_image: song.image,
            song_audio: song.audio,
            song_duration: song.duration,
            position: i,
            created_at: new Date().toISOString(),
          }))
          await supabase.from("playlist_songs").insert(rows)
        }
      }
    }

    if (Array.isArray(userData.recentSearches)) {
      await supabase.from("search_history").delete().eq("user_id", userId)
      const rows = userData.recentSearches.map((q: string, i: number) => ({
        user_id: userId,
        query: q,
        searched_at: new Date(Date.now() - i * 60000).toISOString(),
      }))
      if (rows.length) await supabase.from("search_history").insert(rows)
    }

    if (userData.settings) {
      await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          theme: userData.settings.theme || "dark",
          audio_quality: userData.settings.quality || "high",
          notifications_enabled: userData.settings.notifications ?? true,
          auto_play: userData.settings.autoplay ?? true,
          ai_suggestions: userData.settings.aiSuggestions ?? true,
          ai_shuffle: userData.settings.aiShuffle ?? true,
          crossfade: userData.settings.crossfade ?? false,
          download_enabled: userData.settings.downloadEnabled ?? true,
          language: userData.settings.language || "hindi",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
    }

    return { success: true }
  } catch (error) {
    console.error("syncUserData error:", error)
    return { success: false, error: "Failed to sync user data" }
  }
}

export const loadUserData = async (userId: string) => {
  try {
    const profile = await getUserProfile(userId)
    const { data: preferences } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()
    const { data: favorites } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    const { data: recentlyPlayed } = await supabase
      .from("recently_played")
      .select("*")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(20)
    const { data: downloads } = await supabase
      .from("downloads")
      .select("*")
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false })
    const { data: playlists } = await supabase
      .from("playlists")
      .select(`*, playlist_songs (*)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    const { data: searchHistory } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", userId)
      .order("searched_at", { ascending: false })
      .limit(10)

    const userData = {
      id: userId,
      name: profile?.username || "User",
      email: profile?.email || "",
      avatar: profile?.avatar_url || "/diverse-avatars.png",
      theme: (preferences as any)?.theme || "dark",
      selectedArtists: profile?.selected_artists || [],
      recentSearches: searchHistory?.map((h) => h.query) || [],
      recentlyPlayed:
        recentlyPlayed?.map((song) => ({
          id: song.song_id,
          title: song.song_title,
          artist: song.song_artist,
          album: song.song_album || "",
          image: song.song_image || "/album-art.jpg",
          audio: song.song_audio || "",
          duration: song.song_duration || 0,
          language: song.song_language,
          year: song.song_year,
        })) || [],
      favorites:
        favorites?.map((song) => ({
          id: song.song_id,
          title: song.song_title,
          artist: song.song_artist,
          album: song.song_album || "",
          image: song.song_image || "/album-art.jpg",
          audio: song.song_audio || "",
          duration: song.song_duration || 0,
          language: song.song_language,
          year: song.song_year,
        })) || [],
      downloads:
        downloads?.map((song) => ({
          id: song.song_id,
          title: song.song_title,
          artist: song.song_artist,
          album: song.song_album || "",
          image: song.song_image || "/album-art.jpg",
          audio: song.song_audio || "",
          duration: song.song_duration || 0,
          download_url: song.download_url,
        })) || [],
      playlists:
        playlists?.map((playlist: any) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || "",
          image: playlist.cover_image || "/playlist-cover.jpg",
          songs:
            (playlist.playlist_songs as any[])
              ?.sort((a, b) => a.position - b.position)
              .map((song) => ({
                id: song.song_id,
                title: song.song_title,
                artist: song.song_artist,
                album: song.song_album || "",
                image: song.song_image || "/album-art.jpg",
                audio: song.song_audio || "",
                duration: song.song_duration || 0,
              })) || [],
          createdAt: playlist.created_at,
          isPublic: playlist.is_public,
        })) || [],
      settings: {
        notifications: (preferences as any)?.notifications_enabled ?? true,
        quality: (preferences as any)?.audio_quality || "high",
        downloadEnabled: (preferences as any)?.download_enabled ?? true,
        language: (preferences as any)?.language || "hindi",
        autoplay: (preferences as any)?.auto_play ?? true,
        crossfade: (preferences as any)?.crossfade ?? false,
        aiShuffle: (preferences as any)?.ai_shuffle ?? true,
        aiSuggestions: (preferences as any)?.ai_suggestions ?? true,
      },
    }

    return { success: true, userData }
  } catch (error) {
    console.error("loadUserData error:", error)
    return { success: false, error: "Failed to load user data" }
  }
}

// Subscribe to all relevant tables; rely on Postgres Changes for realtime.
// NOTE: Ensure realtime is enabled on these tables in the Supabase dashboard.
export const setupRealtimeSync = (userId: string, onDataChange: (payload: any) => void) => {
  const channels = [
    supabase
      .channel(`favorites_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
    supabase
      .channel(`playlists_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "playlists", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
    supabase
      .channel(`playlist_songs_changes_${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "playlist_songs" }, (payload) => {
        // Filter by playlists that belong to this user on client side since playlist_songs doesn't have user_id
        onDataChange(payload)
      }),
    supabase
      .channel(`preferences_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_preferences", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
    supabase
      .channel(`recently_played_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recently_played", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
    supabase
      .channel(`downloads_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "downloads", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
    supabase
      .channel(`search_history_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "search_history", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
  ]

  channels.forEach((c) => c.subscribe())

  return () => channels.forEach((c) => supabase.removeChannel(c))
}
