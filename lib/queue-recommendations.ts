import type { Song } from "./store"
import { getAIRecommendations } from "./supabase-helpers"

// Smart queue recommendations based on user behavior
export async function getSmartQueueRecommendations(
  currentSong: Song | null,
  userFavorites: Song[],
  trendingSongs: Song[],
  userId: string | null,
): Promise<Song[]> {
  if (!currentSong) return trendingSongs.slice(0, 20)

  try {
    // Get AI preferences if user is logged in
    let preferences: any = {}
    if (userId) {
      preferences = await getAIRecommendations(userId)
    }

    // Combine and score candidate songs
    const candidates = [...userFavorites, ...trendingSongs].filter((song) => song.id !== currentSong.id)

    const scored = candidates.map((song) => {
      let score = 0

      // Genre preference (if we know user's preferred genres)
      if (preferences.preferredGenres?.includes(song.genre)) {
        score += 40
      }

      // Artist preference (if we know user's preferred artists)
      if (
        preferences.preferredArtists?.some((artist: string) =>
          song.artist?.toLowerCase().includes(artist.toLowerCase()),
        )
      ) {
        score += 50
      }

      // In favorites = high score
      if (userFavorites.some((fav) => fav.id === song.id)) {
        score += 30
      }

      // Trending bonus
      if (trendingSongs.some((trend) => trend.id === song.id)) {
        score += 15
      }

      // Energy level matching (prefer similar energy to current song)
      if (currentSong.energy && song.energy) {
        const energyDiff = Math.abs(currentSong.energy - song.energy)
        score += Math.max(0, 10 - energyDiff / 10)
      }

      // Danceability matching
      if (currentSong.danceability && song.danceability) {
        const danceDiff = Math.abs(currentSong.danceability - song.danceability)
        score += Math.max(0, 10 - danceDiff / 10)
      }

      return { song, score }
    })

    // Sort by score and return top recommendations
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((item) => item.song)
  } catch (error) {
    console.error("Failed to get smart recommendations:", error)
    // Fallback to trending songs
    return trendingSongs.slice(0, 20)
  }
}

// Predict if user will skip a song based on their behavior
export function predictSkipProbability(
  song: Song,
  userFavorites: Song[],
  userPreferences: {
    preferredGenres: string[]
    preferredArtists: string[]
    dislikedSongs: Set<string>
  },
): number {
  let skipProbability = 50 // Start at 50%

  // If it's a favorite, very unlikely to skip
  if (userFavorites.some((fav) => fav.id === song.id)) {
    skipProbability -= 40
  }

  // If it's in disliked songs, very likely to skip
  if (userPreferences.dislikedSongs.has(song.id)) {
    skipProbability += 40
  }

  // Genre preference
  if (userPreferences.preferredGenres.includes(song.genre || "")) {
    skipProbability -= 20
  }

  // Artist preference
  if (userPreferences.preferredArtists.some((artist) => song.artist?.toLowerCase().includes(artist.toLowerCase()))) {
    skipProbability -= 25
  }

  return Math.max(0, Math.min(100, skipProbability))
}
