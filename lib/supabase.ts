import { createClient } from "@supabase/supabase-js"

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

// Types for our database
export interface Profile {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  selected_artists?: string[]
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme: "dark" | "light"
  audio_quality: "low" | "medium" | "high"
  notifications_enabled: boolean
  auto_play: boolean
  ai_suggestions: boolean
  ai_shuffle: boolean
  crossfade: boolean
  download_enabled: boolean
  language: string
  created_at: string
  updated_at: string
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

// Enhanced auth helper functions with better error handling
export const signUp = async (email: string, password: string, username: string) => {
  try {
    console.log("🔐 Starting sign up process...")

    // Check if user already exists in profiles table
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .maybeSingle()

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      console.error("Profile check error:", profileCheckError)
      return { success: false, error: "Database error checking existing user" }
    }

    if (existingProfile) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
        userExists: true,
      }
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: username,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user account" }
    }

    console.log("✅ User created successfully:", authData.user.id)

    // Check if email confirmation is required
    if (!authData.session) {
      return {
        success: true,
        user: authData.user,
        needsEmailConfirmation: true,
      }
    }

    // If user is immediately confirmed, wait for trigger and verify profile
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("Profile verification error:", profileError)
      // Try to create profile manually if trigger failed
      const { error: manualProfileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: email,
        username: username,
        full_name: username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (manualProfileError) {
        console.error("Manual profile creation error:", manualProfileError)
        return { success: false, error: "Failed to create user profile" }
      }

      // Create preferences manually too
      const { error: manualPrefsError } = await supabase.from("user_preferences").insert({
        user_id: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (manualPrefsError) {
        console.error("Manual preferences creation error:", manualPrefsError)
      }
    }

    console.log("✅ Profile verified/created successfully")

    return {
      success: true,
      user: authData.user,
      needsEmailConfirmation: false,
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return { success: false, error: "An unexpected error occurred during sign up" }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    console.log("🔐 Starting sign in process...")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Sign in error:", error)
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Invalid email or password" }
      }
      if (error.message.includes("Email not confirmed")) {
        return { success: false, error: "Please check your email and confirm your account before signing in" }
      }
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "Sign in failed - no user data received" }
    }

    console.log("✅ Sign in successful:", data.user.id)

    // Verify profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      // Try to create profile if it doesn't exist
      const { error: createProfileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email || email,
        username: data.user.user_metadata?.username || email.split("@")[0],
        full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createProfileError) {
        console.error("Create profile error:", createProfileError)
        return { success: false, error: "Failed to create user profile" }
      }
    }

    return { success: true, user: data.user, session: data.session }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "An unexpected error occurred during sign in" }
  }
}

export const signOut = async () => {
  try {
    console.log("🔐 Signing out...")
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error)
      return { success: false, error: error.message }
    }
    console.log("✅ Sign out successful")
    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return { success: false, error: "An unexpected error occurred during sign out" }
  }
}

export const getCurrentUser = async () => {
  try {
    // First try to get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Get session error:", sessionError)
      return null
    }

    if (!session) {
      // No session found, user is not authenticated
      return null
    }

    // If we have a session, get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error("Get user error:", userError)
      return null
    }

    return user
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Get user profile error:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Get user profile error:", error)
    return null
  }
}

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Update user profile error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Update user profile error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Enhanced data sync functions with better error handling
export const syncUserData = async (userId: string, userData: any) => {
  try {
    console.log("🔄 Syncing user data to Supabase...")

    // Sync favorites
    if (userData.favorites && userData.favorites.length > 0) {
      console.log("📝 Syncing favorites...")
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

      const { error: favoritesError } = await supabase.from("favorites").upsert(favorites, {
        onConflict: "user_id,song_id",
        ignoreDuplicates: false,
      })

      if (favoritesError) {
        console.error("Favorites sync error:", favoritesError)
      } else {
        console.log("✅ Favorites synced successfully")
      }
    }

    // Sync recently played
    if (userData.recentlyPlayed && userData.recentlyPlayed.length > 0) {
      console.log("📝 Syncing recently played...")

      // Clear existing recently played first
      await supabase.from("recently_played").delete().eq("user_id", userId)

      const recentlyPlayed = userData.recentlyPlayed.map((song: any, index: number) => ({
        user_id: userId,
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist,
        song_album: song.album,
        song_image: song.image,
        song_audio: song.audio,
        song_duration: song.duration,
        played_at: new Date(Date.now() - index * 60000).toISOString(),
      }))

      const { error: recentlyPlayedError } = await supabase.from("recently_played").insert(recentlyPlayed)

      if (recentlyPlayedError) {
        console.error("Recently played sync error:", recentlyPlayedError)
      } else {
        console.log("✅ Recently played synced successfully")
      }
    }

    // Sync downloads
    if (userData.downloads && userData.downloads.length > 0) {
      console.log("📝 Syncing downloads...")
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

      const { error: downloadsError } = await supabase.from("downloads").upsert(downloads, {
        onConflict: "user_id,song_id",
        ignoreDuplicates: false,
      })

      if (downloadsError) {
        console.error("Downloads sync error:", downloadsError)
      } else {
        console.log("✅ Downloads synced successfully")
      }
    }

    // Sync playlists
    if (userData.playlists && userData.playlists.length > 0) {
      console.log("📝 Syncing playlists...")
      for (const playlist of userData.playlists) {
        // Insert/update playlist
        const { error: playlistError } = await supabase.from("playlists").upsert(
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

        if (playlistError) {
          console.error("Playlist sync error:", playlistError)
          continue
        }

        // Sync playlist songs
        if (playlist.songs && playlist.songs.length > 0) {
          // Clear existing songs first
          await supabase.from("playlist_songs").delete().eq("playlist_id", playlist.id)

          const playlistSongs = playlist.songs.map((song: any, index: number) => ({
            playlist_id: playlist.id,
            song_id: song.id,
            song_title: song.title,
            song_artist: song.artist,
            song_album: song.album,
            song_image: song.image,
            song_audio: song.audio,
            song_duration: song.duration,
            position: index,
            created_at: new Date().toISOString(),
          }))

          const { error: playlistSongsError } = await supabase.from("playlist_songs").insert(playlistSongs)

          if (playlistSongsError) {
            console.error("Playlist songs sync error:", playlistSongsError)
          }
        }
      }
      console.log("✅ Playlists synced successfully")
    }

    // Sync search history
    if (userData.recentSearches && userData.recentSearches.length > 0) {
      console.log("📝 Syncing search history...")

      // Clear existing search history first
      await supabase.from("search_history").delete().eq("user_id", userId)

      const searchHistory = userData.recentSearches.map((query: string, index: number) => ({
        user_id: userId,
        query,
        searched_at: new Date(Date.now() - index * 60000).toISOString(),
      }))

      const { error: searchHistoryError } = await supabase.from("search_history").insert(searchHistory)

      if (searchHistoryError) {
        console.error("Search history sync error:", searchHistoryError)
      } else {
        console.log("✅ Search history synced successfully")
      }
    }

    // Sync user preferences
    if (userData.settings) {
      console.log("📝 Syncing user preferences...")
      const { error: preferencesError } = await supabase.from("user_preferences").upsert(
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

      if (preferencesError) {
        console.error("Preferences sync error:", preferencesError)
      } else {
        console.log("✅ Preferences synced successfully")
      }
    }

    console.log("✅ All user data synced successfully")
    return { success: true }
  } catch (error) {
    console.error("❌ Sync user data error:", error)
    return { success: false, error: "Failed to sync user data" }
  }
}

export const loadUserData = async (userId: string) => {
  try {
    console.log("📥 Loading user data from Supabase...")

    // Load profile
    const profile = await getUserProfile(userId)

    // Load preferences
    const { data: preferences } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

    // Load favorites
    const { data: favorites } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    // Load recently played
    const { data: recentlyPlayed } = await supabase
      .from("recently_played")
      .select("*")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(20)

    // Load downloads
    const { data: downloads } = await supabase
      .from("downloads")
      .select("*")
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false })

    // Load playlists with songs
    const { data: playlists } = await supabase
      .from("playlists")
      .select(`
        *,
        playlist_songs (
          *
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    // Load search history
    const { data: searchHistory } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", userId)
      .order("searched_at", { ascending: false })
      .limit(10)

    // Convert to app format
    const userData = {
      id: userId,
      name: profile?.username || "User",
      email: profile?.email || "",
      avatar: profile?.avatar_url || "/placeholder.svg",
      theme: preferences?.theme || "dark",
      selectedArtists: profile?.selected_artists || [],
      recentSearches: searchHistory?.map((h) => h.query) || [],
      recentlyPlayed:
        recentlyPlayed?.map((song) => ({
          id: song.song_id,
          title: song.song_title,
          artist: song.song_artist,
          album: song.song_album || "",
          image: song.song_image || "/placeholder.svg",
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
          image: song.song_image || "/placeholder.svg",
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
          image: song.song_image || "/placeholder.svg",
          audio: song.song_audio || "",
          duration: song.song_duration || 0,
          download_url: song.download_url,
        })) || [],
      playlists:
        playlists?.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || "",
          image: playlist.cover_image || "/placeholder.svg",
          songs:
            playlist.playlist_songs
              ?.sort((a: any, b: any) => a.position - b.position)
              .map((song: any) => ({
                id: song.song_id,
                title: song.song_title,
                artist: song.song_artist,
                album: song.song_album || "",
                image: song.song_image || "/placeholder.svg",
                audio: song.song_audio || "",
                duration: song.song_duration || 0,
              })) || [],
          createdAt: playlist.created_at,
          isPublic: playlist.is_public,
        })) || [],
      settings: {
        notifications: preferences?.notifications_enabled ?? true,
        quality: preferences?.audio_quality || "high",
        downloadEnabled: preferences?.download_enabled ?? true,
        language: preferences?.language || "hindi",
        autoplay: preferences?.auto_play ?? true,
        crossfade: preferences?.crossfade ?? false,
        aiShuffle: preferences?.ai_shuffle ?? true,
        aiSuggestions: preferences?.ai_suggestions ?? true,
      },
    }

    console.log("✅ User data loaded successfully")
    return { success: true, userData }
  } catch (error) {
    console.error("❌ Load user data error:", error)
    return { success: false, error: "Failed to load user data" }
  }
}

// Real-time sync setup
export const setupRealtimeSync = (userId: string, onDataChange: (payload: any) => void) => {
  const channels = [
    supabase
      .channel("favorites_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
    supabase
      .channel("playlists_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "playlists", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
    supabase
      .channel("preferences_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_preferences", filter: `user_id=eq.${userId}` },
        onDataChange,
      ),
  ]

  channels.forEach((channel) => channel.subscribe())

  return () => {
    channels.forEach((channel) => supabase.removeChannel(channel))
  }
}
