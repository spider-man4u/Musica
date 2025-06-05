import { createClient } from "@supabase/supabase-js"

// Hardcoded Supabase configuration
const supabaseUrl = "https://zlxmcnazmnzkyhbuzafr.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseG1jbmF6bW56a3loYnV6YWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MjY1NzYsImV4cCI6MjA2NDUwMjU3Nn0.xGfM5CPYph8nnYgmRPDy66RTdNfaEoNdMImSZXL_HnU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  user_id: string
  song_id: string
  song_title: string
  song_artist: string
  song_image?: string
  song_audio?: string
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
  song_image?: string
  song_audio?: string
  position: number
  created_at: string
}
