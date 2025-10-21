"use client"

const API_BASE_URL = "https://saavn.sumit.co/api"

const TIMEOUTS = {
  search: 10000,
  trending: 12000,
  details: 8000,
}

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
}

export interface ModernSong {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number
  image?: string
  download_url?: string
  preview_url?: string
  audio?: string
  external_urls?: {
    spotify?: string
    youtube?: string
    saavn?: string
  }
  popularity?: number
  explicit?: boolean
  release_date?: string
  genres?: string[]
  quality?: string
  language?: string
  label?: string
  copyright?: string
}

export interface PlaylistSuggestion {
  id: string
  name: string
  image?: string
  description?: string
  songCount?: number
}

function sanitizeString(str: string | undefined | null): string {
  if (!str) return ""
  return String(str)
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim()
}

function exponentialBackoff(attempt: number): number {
  const delay = Math.min(RETRY_CONFIG.baseDelay * Math.pow(2, attempt), RETRY_CONFIG.maxDelay)
  return delay + Math.random() * 1000
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    console.log(`📡 [FETCH] ${url}`)
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    clearTimeout(timeoutId)
    console.log(`📡 [STATUS] ${response.status} ${response.statusText}`)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

async function fetchWithRetry<T>(url: string, timeoutMs = 10000): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 [ATTEMPT ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}] ${url}`)

      const response = await fetchWithTimeout(url, timeoutMs)

      if (!response.ok) {
        let errorBody = ""
        try {
          errorBody = await response.text()
          console.log(`📦 [ERROR BODY] ${errorBody.substring(0, 500)}`)
        } catch (e) {
          errorBody = "Unable to read error body"
        }
        throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        console.error(`❌ [CONTENT-TYPE] Expected JSON, got: ${contentType}`)
        throw new Error("Invalid response format: Expected JSON")
      }

      const data = await response.json()
      console.log(`✅ [SUCCESS] Response keys:`, Object.keys(data))
      return data as T
    } catch (error) {
      lastError = error as Error
      console.error(`❌ [ATTEMPT ${attempt + 1}] ${lastError.message}`)

      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = exponentialBackoff(attempt)
        console.log(`⏳ [RETRY] Waiting ${Math.round(delay)}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Failed after ${RETRY_CONFIG.maxRetries + 1} attempts: ${lastError?.message}`)
}

class SaavnAPI {
  private transformSong(song: any): ModernSong | null {
    if (!song) {
      console.warn("⚠️ Received null/undefined song")
      return null
    }

    try {
      const songData = song.song || song

      const result: ModernSong = {
        id: songData.id || `song-${Date.now()}-${Math.random()}`,
        title: sanitizeString(songData.name || songData.title || songData.song) || "Unknown Song",
        artist:
          sanitizeString(
            songData.primary_artists ||
              songData.primaryArtists ||
              songData.artist ||
              songData.artists?.map?.((a: any) => a.name)?.join(", "),
          ) || "Unknown Artist",
        album: sanitizeString(songData.album?.name || songData.album_name || songData.album) || "Unknown Album",
        duration: Number.parseInt(songData.duration || songData.durationInSec || 0) || 0,
        image: songData.image || songData.album_art || songData.albumArt || songData.thumbnail,
        download_url: songData.download_url || songData.downloadUrl || songData.url,
        preview_url: songData.preview_url || songData.previewUrl,
        audio: songData.download_url || songData.downloadUrl || songData.preview_url || songData.url,
        external_urls: {
          saavn: songData.url || songData.permaUrl || songData.link,
        },
        language: songData.language || "unknown",
        quality: songData.quality || "320kbps",
        genres: songData.language ? [songData.language] : ["unknown"],
        popularity: songData.play_count ? Math.min(100, Math.floor(songData.play_count / 1000)) : 50,
        explicit: songData.explicit === "1" || songData.explicit === 1 || songData.explicit === true,
        release_date: songData.release_date || songData.year,
        label: songData.label,
        copyright: songData.copyright,
      }
      return result
    } catch (e) {
      console.error("❌ Error transforming song:", e)
      return null
    }
  }

  async search(query: string, page = 0, limit = 20): Promise<ModernSong[]> {
    if (!query?.trim()) {
      throw new Error("Search query cannot be empty")
    }

    console.log(`\n🔍 [SEARCH] Query: "${query}" (page: ${page}, limit: ${limit})`)

    try {
      const url = `${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.search)
      console.log(`📦 [SEARCH-RESPONSE] Structure:`, { hasData: !!data?.data, keys: Object.keys(data) })

      // CORRECT EXTRACTION: data.data.results is the array
      let songs = data?.data?.results || data?.results || data?.songs || []

      if (!Array.isArray(songs)) {
        console.warn(`⚠️ Songs is not an array, type:`, typeof songs)
        songs = []
      }

      console.log(`✅ Found ${songs.length} songs`)

      const transformed = songs
        .map((s: any) => this.transformSong(s))
        .filter((s: ModernSong | null) => s && s.id && s.title)

      console.log(`✅ Transformed ${transformed.length} songs`)
      return transformed as ModernSong[]
    } catch (error) {
      console.error(`❌ Search error:`, error)
      throw error
    }
  }

  async getTrending(): Promise<ModernSong[]> {
    console.log(`\n📊 [TRENDING] Fetching trending songs...`)

    const trendingSearches = ["Bollywood", "hindi", "songs", "music", "top", "arijit", "neha", "love", "new", "best"]

    let bestResults: ModernSong[] = []
    let successCount = 0

    for (const query of trendingSearches) {
      try {
        console.log(`\n📌 [TRENDING-SEARCH] Query: "${query}"`)
        const url = `${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=0&limit=50`

        const data = await fetchWithRetry<any>(url, TIMEOUTS.search)
        console.log(
          `📦 [TRENDING-RESPONSE] Has data.data:`,
          !!data?.data,
          "Has data.data.results:",
          !!data?.data?.results,
        )

        // CORRECT EXTRACTION: data.data.results is the array
        const songs = data?.data?.results || data?.results || data?.songs || []

        if (!Array.isArray(songs)) {
          console.warn(`⚠️ Songs not array for "${query}", type:`, typeof songs)
          continue
        }

        console.log(`✅ Got ${songs.length} songs for "${query}"`)

        const transformed = songs
          .map((s: any) => {
            try {
              return this.transformSong(s)
            } catch (e) {
              console.error(`❌ Transform error:`, e)
              return null
            }
          })
          .filter((s: ModernSong | null) => s && s.id && s.title)

        console.log(`✅ Transformed ${transformed.length} songs for "${query}"`)

        if (transformed.length > bestResults.length) {
          bestResults = transformed as ModernSong[]
          successCount++
          console.log(`🏆 New best: ${bestResults.length} songs`)
        }

        if (bestResults.length >= 20) {
          console.log(`✅ Enough results, returning ${bestResults.length} songs`)
          return bestResults
        }
      } catch (error) {
        console.warn(`⚠️ Query "${query}" failed:`, error)
        continue
      }
    }

    if (bestResults.length > 0) {
      console.log(`✅ Returning ${bestResults.length} trending songs from ${successCount} queries`)
      return bestResults
    }

    throw new Error(`Failed to fetch trending songs from ${trendingSearches.length} queries`)
  }

  async getSongDetails(songId: string): Promise<ModernSong | null> {
    if (!songId?.trim()) {
      throw new Error("Song ID cannot be empty")
    }

    console.log(`\n🎵 [DETAILS] Song ID: ${songId}`)

    try {
      const url = `${API_BASE_URL}/songs/${encodeURIComponent(songId)}`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)

      const song = data?.song || data

      if (!song) {
        throw new Error("No song data in response")
      }

      const transformed = this.transformSong(song)
      if (transformed) {
        console.log(`✅ Got details: ${transformed.title}`)
        return transformed
      }

      throw new Error("Failed to transform song")
    } catch (error) {
      console.error(`❌ Song details error:`, error)
      throw error
    }
  }

  async getSongDetailsMultiple(songIds: string[]): Promise<ModernSong[]> {
    if (!songIds || songIds.length === 0) {
      throw new Error("Song IDs array cannot be empty")
    }

    console.log(`\n🎵 [DETAILS MULTIPLE] Song IDs: ${songIds.join(", ")}`)

    try {
      const idsParam = songIds.map((id) => encodeURIComponent(id)).join("%2C")
      const url = `${API_BASE_URL}/songs?ids=${idsParam}`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)

      let songs = data?.songs || data?.data?.results || data || []

      if (!Array.isArray(songs)) {
        console.warn(`⚠️ Songs is not an array`)
        songs = []
      }

      const transformed = songs.map((s: any) => this.transformSong(s)).filter((s: ModernSong | null) => s && s.id)

      console.log(`✅ Got ${transformed.length} songs`)
      return transformed as ModernSong[]
    } catch (error) {
      console.error(`❌ Multiple details error:`, error)
      throw error
    }
  }

  async getPlaylistSuggestions(query = "Trending"): Promise<PlaylistSuggestion[]> {
    console.log(`\n📋 [PLAYLISTS] Query: "${query}"`)

    try {
      const url = `${API_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&page=0&limit=10`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.search)

      let playlists = data?.data?.results || data?.results || data?.data || data?.playlists || []

      if (!Array.isArray(playlists)) {
        console.warn(`⚠️ Playlists is not an array`)
        playlists = []
      }

      console.log(`✅ Got ${playlists.length} playlists`)

      return playlists.map((p: any) => ({
        id: p.id || `playlist-${Date.now()}`,
        name: sanitizeString(p.name || p.title) || "Playlist",
        image: p.image || p.thumbnail,
        description: sanitizeString(p.description),
        songCount: p.song_count || p.songCount || 0,
      }))
    } catch (error) {
      console.error(`❌ Playlist suggestions error:`, error)
      throw error
    }
  }

  async getSongSuggestions(songId: string): Promise<ModernSong[]> {
    if (!songId?.trim()) {
      throw new Error("Song ID cannot be empty")
    }

    console.log(`\n🔗 [SUGGESTIONS] Song ID: ${songId}`)

    try {
      const url = `${API_BASE_URL}/songs/${encodeURIComponent(songId)}/suggestions?limit=10`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)

      let suggestions = data?.suggestions || data?.results || data?.songs || data?.data?.results || []

      if (!Array.isArray(suggestions)) {
        console.warn(`⚠️ Suggestions is not an array`)
        suggestions = []
      }

      console.log(`✅ Got ${suggestions.length} suggestions`)

      const transformed = suggestions.map((s: any) => this.transformSong(s)).filter((s: ModernSong | null) => s && s.id)

      return transformed as ModernSong[]
    } catch (error) {
      console.error(`❌ Song suggestions error:`, error)
      throw error
    }
  }

  async searchArtists(query: string, page = 0, limit = 10): Promise<any[]> {
    if (!query?.trim()) {
      throw new Error("Artist query cannot be empty")
    }

    console.log(`\n👨‍🎤 [ARTISTS] Query: "${query}"`)

    try {
      const url = `${API_BASE_URL}/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.search)

      let artists = data?.data?.results || data?.results || data?.data || data?.artists || []

      if (!Array.isArray(artists)) {
        console.warn(`⚠️ Artists is not an array`)
        artists = []
      }

      console.log(`✅ Got ${artists.length} artists`)
      return artists
    } catch (error) {
      console.error(`❌ Artist search error:`, error)
      throw error
    }
  }
}

const saavnApi = new SaavnAPI()

export async function searchMusic(
  query: string,
): Promise<{ success: boolean; data: { results: ModernSong[] }; message?: string }> {
  try {
    console.log(`\n${"=".repeat(60)}\n🔍 SEARCH MUSIC: "${query}"\n${"=".repeat(60)}`)
    const results = await saavnApi.search(query)
    console.log(`✅ Search successful: ${results.length} results\n`)
    return { success: true, data: { results } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed"
    console.error(`❌ Search failed: ${message}\n`)
    return { success: false, data: { results: [] }, message }
  }
}

export async function getTrendingMusic(): Promise<{
  success: boolean
  data: { trending: ModernSong[] }
  message?: string
}> {
  try {
    console.log(`\n${"=".repeat(60)}\n📊 GET TRENDING MUSIC\n${"=".repeat(60)}`)
    const trending = await saavnApi.getTrending()

    if (trending.length > 0) {
      console.log(`✅ Trending successful: ${trending.length} songs\n`)
      return { success: true, data: { trending } }
    }

    return {
      success: false,
      data: { trending: [] },
      message: "No trending songs available",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trending failed"
    console.error(`❌ Trending failed: ${message}\n`)
    return { success: false, data: { trending: [] }, message }
  }
}

export async function getSongDetails(
  songId: string,
): Promise<{ success: boolean; data: ModernSong | null; message?: string }> {
  try {
    const data = await saavnApi.getSongDetails(songId)
    return { success: !!data, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get song details"
    return { success: false, data: null, message }
  }
}

export async function getSongDetailsMultiple(
  songIds: string[],
): Promise<{ success: boolean; data: ModernSong[]; message?: string }> {
  try {
    const data = await saavnApi.getSongDetailsMultiple(songIds)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get song details"
    return { success: false, data: [], message }
  }
}

export async function getPlaylistSuggestions(
  query = "Trending",
): Promise<{ success: boolean; data: PlaylistSuggestion[]; message?: string }> {
  try {
    const data = await saavnApi.getPlaylistSuggestions(query)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get playlists"
    return { success: false, data: [], message }
  }
}

export async function getSongSuggestions(
  songId: string,
): Promise<{ success: boolean; data: ModernSong[]; message?: string }> {
  try {
    const data = await saavnApi.getSongSuggestions(songId)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get suggestions"
    return { success: false, data: [], message }
  }
}

export async function searchArtists(
  query: string,
  page = 0,
  limit = 10,
): Promise<{ success: boolean; data: any[]; message?: string }> {
  try {
    const data = await saavnApi.searchArtists(query, page, limit)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search artists"
    return { success: false, data: [], message }
  }
}

export { sanitizeString }
export type { ModernSong, PlaylistSuggestion }
