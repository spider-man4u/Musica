import { searchPlaylists, getPopularPlaylists as getPopularPlaylistsFromApi } from "./modernMusicApi"

// Wrapper to fetch playlists based on a query (used for genre-based recommendations)
export async function getPopularPlaylists(query: string): Promise<any[]> {
  try {
    const results = await searchPlaylists(query)
    return results.slice(0, 10) // Return top 10 playlists for the query
  } catch (error) {
    console.error("[v0] Error fetching playlists for query:", query, error)
    return []
  }
}

// Export the original function as well for backward compatibility
export async function getHomepagePopularPlaylists() {
  try {
    return await getPopularPlaylistsFromApi()
  } catch (error) {
    console.error("[v0] Error fetching popular playlists:", error)
    return { playlists: [], trendingPlaylists: [] }
  }
}
