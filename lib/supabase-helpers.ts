import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey)

// Track song interaction (like, skip, play)
export async function trackSongInteraction(
  userId: string,
  songId: string,
  song: { title: string; artist: string },
  interactionType: "like" | "skip" | "play" | "complete",
  skipTime?: number,
  durationPlayed?: number,
  totalDuration?: number,
) {
  const supabase = createClient()

  const { error } = await supabase.from("user_song_interactions").insert({
    user_id: userId,
    song_id: songId,
    song_title: song.title,
    song_artist: song.artist,
    interaction_type: interactionType,
    skip_time: skipTime || null,
    duration_played: durationPlayed || null,
    total_duration: totalDuration || null,
  })

  if (error) console.error("Error tracking interaction:", error)

  // Update preference scores
  if (interactionType === "like" || interactionType === "skip") {
    await updatePreferenceScore(userId, songId, song, interactionType)
  }

  return !error
}

// Update song preference score based on interactions
export async function updatePreferenceScore(
  userId: string,
  songId: string,
  song: { title: string; artist: string; genre?: string },
  interactionType: "like" | "skip" | "play" | "complete",
) {
  const supabase = createClient()

  // Get current score
  const { data: existing } = await supabase
    .from("song_preference_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("song_id", songId)
    .single()

  const updateData: Record<string, any> = {
    user_id: userId,
    song_id: songId,
    song_title: song.title,
    song_artist: song.artist,
    genre: song.genre || "unknown",
    last_updated: new Date().toISOString(),
  }

  if (existing) {
    // Update existing record
    let newScore = existing.score || 0

    if (interactionType === "like") {
      newScore += 50 // Heavy boost for likes
      updateData.like_count = (existing.like_count || 0) + 1
    } else if (interactionType === "skip") {
      newScore -= 30 // Penalty for skips
      updateData.skip_count = (existing.skip_count || 0) + 1
    } else if (interactionType === "complete") {
      newScore += 20 // Bonus for complete plays
      updateData.play_count = (existing.play_count || 0) + 1
    }

    updateData.score = Math.max(-100, Math.min(100, newScore)) // Clamp between -100 and 100

    await supabase.from("song_preference_scores").update(updateData).eq("user_id", userId).eq("song_id", songId)
  } else {
    // Create new record
    let score = 0
    if (interactionType === "like") score = 50
    else if (interactionType === "skip") score = -30
    else if (interactionType === "complete") score = 20

    updateData.score = score
    updateData.like_count = interactionType === "like" ? 1 : 0
    updateData.skip_count = interactionType === "skip" ? 1 : 0
    updateData.play_count = interactionType === "complete" ? 1 : 0

    await supabase.from("song_preference_scores").insert(updateData)
  }
}

// Get AI recommendations based on user preferences
export async function getAIRecommendations(userId: string, limit = 20) {
  const supabase = createClient()

  // Get user's highly rated songs
  const { data: preferences } = await supabase
    .from("song_preference_scores")
    .select("*")
    .eq("user_id", userId)
    .gt("score", 10)
    .order("score", { ascending: false })
    .limit(10)

  if (!preferences || preferences.length === 0) {
    return []
  }

  // Extract genres and artists from highly rated songs
  const genres = new Set(preferences.map((p) => p.genre).filter(Boolean))
  const artists = new Set(preferences.map((p) => p.song_artist).filter(Boolean))

  return {
    preferredGenres: Array.from(genres),
    preferredArtists: Array.from(artists),
    topSongs: preferences.slice(0, 5),
  }
}

// Get low-rated/skipped songs to avoid
export async function getDislikedSongs(userId: string) {
  const supabase = createClient()

  const { data } = await supabase
    .from("song_preference_scores")
    .select("song_id, song_title, song_artist")
    .eq("user_id", userId)
    .lt("score", -10)
    .limit(50)

  return data || []
}
