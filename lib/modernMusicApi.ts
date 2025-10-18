const BASE_URLS = {
  saavn: "https://saavn.dev/api",
  jamendo: "https://api.jamendo.com/v3.0",
}

const TIMEOUTS = {
  search: 8000,
  trending: 12000,
  details: 5000,
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

function createFetch(timeoutMs = 8000) {
  return async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs}ms`)
      }
      throw error
    }
  }
}

const modernFetch = createFetch(TIMEOUTS.trending)
const searchFetch = createFetch(TIMEOUTS.search)
const detailsFetch = createFetch(TIMEOUTS.details)

class JioSaavnAPI {
  async search(query: string, page = 0, limit = 20) {
    try {
      const url = `${BASE_URLS.saavn}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      const response = await searchFetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return data.data?.results || []
    } catch (error) {
      console.error("[JioSaavn-Search]", error)
      return []
    }
  }

  async getTrendingFromCharts() {
    try {
      const url = `${BASE_URLS.saavn}/charts?page=0&limit=50`
      const response = await modernFetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return data.data?.results || []
    } catch (error) {
      console.error("[JioSaavn-Charts]", error)
      return []
    }
  }

  async getTrendingFromSearch() {
    const queries = ["trending", "top songs", "popular", "hits", "best"]
    for (const q of queries) {
      try {
        const results = await this.search(q, 0, 50)
        if (results.length > 0) return results
      } catch {
        continue
      }
    }
    return []
  }

  async getTrending() {
    let results = await this.getTrendingFromCharts()
    if (results.length === 0) {
      results = await this.getTrendingFromSearch()
    }
    return results
  }

  async getSongDetails(songId: string) {
    try {
      const url = `${BASE_URLS.saavn}/songs?ids=${encodeURIComponent(songId)}`
      const response = await detailsFetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return data.data?.[0] || null
    } catch (error) {
      console.error("[JioSaavn-Details]", error)
      return null
    }
  }

  async getPlaylistSuggestions(query = "Indie"): Promise<PlaylistSuggestion[]> {
    try {
      const url = `${BASE_URLS.saavn}/search/playlists?query=${encodeURIComponent(query)}&page=0&limit=10`
      const response = await searchFetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return (data.data?.results || []).map((p: any) => ({
        id: p.id || "",
        name: sanitizeString(p.name) || "Playlist",
        image: p.image || undefined,
        description: sanitizeString(p.description) || undefined,
        songCount: p.songCount || 0,
      }))
    } catch (error) {
      console.error("[JioSaavn-PlaylistSuggestions]", error)
      return []
    }
  }

  async getSongSuggestions(songId: string): Promise<any[]> {
    try {
      const url = `${BASE_URLS.saavn}/songs?ids=${encodeURIComponent(songId)}&suggestions=true`
      const response = await detailsFetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return (data.data || []).map(this.transformSong)
    } catch (error) {
      console.error("[JioSaavn-SongSuggestions]", error)
      return []
    }
  }

  private transformSong(song: any): any {
    return {
      id: song.id || `song-${Date.now()}`,
      title: sanitizeString(song.name),
      artist: sanitizeString(song.primaryArtists),
      album: sanitizeString(song.album),
      image: song.image || undefined,
      duration: song.duration || 0,
      release_date: song.releaseDate || undefined,
      explicit: song.explicit === true,
      genres: song.language ? [song.language] : undefined,
      label: song.label || undefined,
      quality: song.quality || "160kbps",
      preview_url: song.preview_url || undefined,
      download_url: song.downloadUrl || song.url || undefined,
      external_urls: {
        saavn: song.url || undefined,
      },
    }
  }
}

class ModernMusicService {
  private saavn = new JioSaavnAPI()

  async search(query: string) {
    const results = await this.saavn.search(query, 0, 50)
    return results.map((s: any) => this.saavn["transformSong"](s))
  }

  async getTrending() {
    const results = await this.saavn.getTrending()
    return results.map((s: any) => this.saavn["transformSong"](s))
  }

  async getSongDetails(songId: string) {
    const song = await this.saavn.getSongDetails(songId)
    if (!song) return null
    return this.saavn["transformSong"](song)
  }

  async getPlaylistSuggestions(query = "Indie") {
    return this.saavn.getPlaylistSuggestions(query)
  }

  async getSongSuggestions(songId: string) {
    const suggestions = await this.saavn.getSongSuggestions(songId)
    return suggestions
  }
}

const service = new ModernMusicService()

export async function searchMusic(query: string) {
  try {
    const results = await service.search(query)
    return { success: true, data: { results: results || [] } }
  } catch (error) {
    console.error("[searchMusic]", error)
    return { success: false, data: { results: [] } }
  }
}

export async function getTrendingMusic() {
  try {
    console.log("📊 Fetching trending songs...")
    const trending = await service.getTrending()
    console.log("✅ Trending loaded:", trending.length, "songs")
    return { success: true, data: { trending: trending || [] } }
  } catch (error) {
    console.error("[getTrendingMusic]", error)
    return { success: false, data: { trending: [] } }
  }
}

export async function getSongDetails(songId: string) {
  try {
    const song = await service.getSongDetails(songId)
    return { success: !!song, data: song }
  } catch (error) {
    console.error("[getSongDetails]", error)
    return { success: false, data: null }
  }
}

export async function getPlaylistSuggestions(query = "Indie") {
  try {
    const playlists = await service.getPlaylistSuggestions(query)
    return { success: true, data: playlists }
  } catch (error) {
    console.error("[getPlaylistSuggestions]", error)
    return { success: false, data: [] }
  }
}

export async function getSongSuggestions(songId: string) {
  try {
    const suggestions = await service.getSongSuggestions(songId)
    return { success: true, data: suggestions }
  } catch (error) {
    console.error("[getSongSuggestions]", error)
    return { success: false, data: [] }
  }
}

export { sanitizeString }
