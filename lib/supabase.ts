import { createClient, type User } from "@supabase/supabase-js"

// Supabase configuration
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
  name: string
  avatar?: string
  theme?: string
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
    console.error("❌ Get user profile error:", error)
    return null
  }
  return data
}

export const ensureProfileExists = async (user: User) => {
  try {
    const existing = await getUserProfile(user.id)
    if (existing) {
      console.log("✅ Profile already exists")
      return { created: false, profile: existing }
    }

    const username = user.user_metadata?.username || user.email?.split("@")[0] || "User"

    console.log("📝 Creating new profile for user:", user.id)
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || username,
        avatar: user.user_metadata?.avatar_url || null,
      })
      .select("*")
      .single()

    if (error) {
      console.error("❌ Create profile error:", error.message)
      return {
        created: false,
        error: error.message,
        profile: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || username,
          avatar: user.user_metadata?.avatar_url || null,
        },
      }
    }
    console.log("✅ Profile created successfully")
    return { created: true, profile: data }
  } catch (err: any) {
    console.error("❌ Create profile exception:", err)
    return {
      created: false,
      error: err?.message || "Failed to create profile",
      profile: {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || "User",
        avatar: user.user_metadata?.avatar_url || null,
      },
    }
  }
}

export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<Profile, "name" | "avatar" | "email" | "theme">>,
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

export const syncUserData = async (userId: string, userData: any) => {
  if (!userId) {
    console.warn("⚠️ No userId for sync, skipping")
    return { success: false, error: "No user ID" }
  }

  try {
    console.log("🔄 Starting sync for user:", userId)

    // Sync favorites
    if (userData.favorites?.length > 0) {
      console.log(`📌 Syncing ${userData.favorites.length} favorites...`)
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
      const { error } = await supabase.from("user_favorites").upsert(favorites, { onConflict: "user_id,song_id" })
      if (error) console.error("❌ Favorites sync error:", error.message)
      else console.log("✅ Favorites synced")
    }

    // Sync recently played
    if (userData.recentlyPlayed?.length > 0) {
      console.log(`🎵 Syncing ${userData.recentlyPlayed.length} recently played...`)
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
      const { error } = await supabase.from("recently_played").insert(recents)
      if (error) console.error("❌ Recently played sync error:", error.message)
      else console.log("✅ Recently played synced")
    }

    // Sync downloads
    if (userData.downloads?.length > 0) {
      console.log(`⬇️ Syncing ${userData.downloads.length} downloads...`)
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
      const { error } = await supabase.from("downloads").upsert(downloads, { onConflict: "user_id,song_id" })
      if (error) console.error("❌ Downloads sync error:", error.message)
      else console.log("✅ Downloads synced")
    }

    // Sync playlists
    if (userData.playlists?.length > 0) {
      console.log(`📚 Syncing ${userData.playlists.length} playlists...`)
      for (const playlist of userData.playlists) {
        const { error: plError } = await supabase.from("playlists").upsert({
          id: playlist.id,
          user_id: userId,
          name: playlist.name,
          description: playlist.description,
          cover_image: playlist.image,
          is_public: playlist.isPublic || false,
          created_at: playlist.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        if (plError) {
          console.error(`❌ Playlist ${playlist.id} sync error:`, plError.message)
        } else {
          // Sync playlist songs
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
            const { error: psError } = await supabase.from("playlist_songs").insert(rows)
            if (psError) console.error("❌ Playlist songs sync error:", psError.message)
            else console.log(`✅ Playlist ${playlist.name} synced with ${rows.length} songs`)
          }
        }
      }
    }

    // Sync search history
    if (Array.isArray(userData.recentSearches) && userData.recentSearches.length > 0) {
      console.log(`🔍 Syncing ${userData.recentSearches.length} searches...`)
      await supabase.from("user_search_history").delete().eq("user_id", userId)
      const rows = userData.recentSearches.map((q: string) => ({
        user_id: userId,
        query: q,
        searched_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from("user_search_history").insert(rows)
      if (error) console.error("❌ Search history sync error:", error.message)
      else console.log("✅ Search history synced")
    }

    // Sync user preferences
    if (userData.settings) {
      console.log("⚙️ Syncing user preferences...")
      const { error } = await supabase.from("user_preferences").upsert({
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
      })
      if (error) console.error("❌ Preferences sync error:", error.message)
      else console.log("✅ Preferences synced")
    }

    console.log("✅ Sync completed successfully")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Sync error:", error)
    return { success: false, error: error?.message || "Failed to sync user data" }
  }
}

export const loadUserData = async (userId: string) => {
  try {
    console.log("📥 Loading user data from Supabase...")
    const profile = await getUserProfile(userId)
    const { data: preferences } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()
    const { data: favorites } = await supabase
      .from("user_favorites")
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
      .from("user_search_history")
      .select("*")
      .eq("user_id", userId)
      .order("searched_at", { ascending: false })
      .limit(10)

    const userData = {
      id: userId,
      name: profile?.name || "User",
      email: profile?.email || "",
      avatar: profile?.avatar || "/diverse-avatars.png",
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

    console.log("✅ User data loaded successfully")
    return { success: true, userData }
  } catch (error: any) {
    console.error("❌ loadUserData error:", error)
    return { success: false, error: "Failed to load user data" }
  }
}

export const setupRealtimeSync = (userId: string, onDataChange: (payload: any) => void) => {
  const channels = [
    supabase
      .channel(`favorites_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_favorites", filter: `user_id=eq.${userId}` },
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
        { event: "*", schema: "public", table: "user_search_history", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
  ]

  channels.forEach((c) => c.subscribe())

  return () => channels.forEach((c) => supabase.removeChannel(c))
}
