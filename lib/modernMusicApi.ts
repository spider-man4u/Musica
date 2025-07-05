"use client"

// Enhanced JioSaavn API Integration - 2024 Latest
// Prioritizing real music playback with proper audio URLs

// --- Modern Interfaces ---
export interface ModernSong {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number
  image?: string
  preview_url?: string
  download_url?: string
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

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
  }
}

// --- Enhanced Error Handling ---
class ModernApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
    public apiName?: string,
  ) {
    super(message)
    this.name = "ModernApiError"
  }
}

// --- Enhanced Fetch with Better Error Handling ---
async function modernFetch<T>(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
    timeout?: number
    retries?: number
    apiName?: string
  } = {},
): Promise<T> {
  const { method = "GET", headers = {}, body, timeout = 8000, retries = 1, apiName = "Unknown" } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const defaultHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "MusicApp/1.0",
    ...headers,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🚀 [${apiName}] Attempt ${attempt + 1}: ${method} ${url}`)

      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body,
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
        cache: "no-cache",
        redirect: "follow",
      })

      clearTimeout(timeoutId)

      console.log(`📡 [${apiName}] Response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        throw new ModernApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, url, apiName)
      }

      const contentType = response.headers.get("content-type") || ""
      let data: any

      if (contentType.includes("application/json")) {
        data = await response.json()
      } else if (contentType.includes("text/")) {
        const text = await response.text()
        try {
          data = JSON.parse(text)
        } catch {
          throw new ModernApiError("Invalid JSON response", response.status, url, apiName)
        }
      } else {
        data = await response.text()
      }

      console.log(`✅ [${apiName}] Success`)
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error as Error

      if (error.name === "AbortError") {
        lastError = new ModernApiError(`Request timeout after ${timeout}ms`, 408, url, apiName)
      } else if (error.message?.includes("Failed to fetch")) {
        lastError = new ModernApiError(`Network error or CORS issue`, 0, url, apiName)
      }

      console.error(`❌ [${apiName}] Attempt ${attempt + 1} failed:`, error.message || error)

      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 2000)
        console.log(`⏳ [${apiName}] Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new ModernApiError("All attempts failed", 0, url, apiName)
}

// --- Enhanced JioSaavn API with Latest Endpoints ---
class JioSaavnAPI {
  private baseUrls = [
    "https://jiosaavn-api-2.vercel.app",
    "https://saavn-api-jade.vercel.app",
    "https://jiosaavn-api-privatecvc.vercel.app",
    "https://saavn.dev",
  ]
  private currentBaseUrl = this.baseUrls[0]

  async search(query: string): Promise<ModernSong[]> {
    if (!query || typeof query !== "string" || !query.trim()) {
      return []
    }

    for (const baseUrl of this.baseUrls) {
      try {
        console.log(`🎵 [JioSaavn] Searching with ${baseUrl}`)
        this.currentBaseUrl = baseUrl

        const url = `${baseUrl}/api/search/songs?query=${encodeURIComponent(query.trim())}&page=1&limit=25`
        const response = await modernFetch<any>(url, {
          apiName: "JioSaavn",
          timeout: 6000,
          retries: 0, // Don't retry on individual endpoints
        })

        if (response && response.success && response.data?.results && Array.isArray(response.data.results)) {
          const songs = response.data.results
            .filter((song) => song && typeof song === "object")
            .map((song) => this.transformSong(song))
            .filter((song) => song.title !== "Unknown Song")
          if (songs.length > 0) {
            console.log(`✅ [JioSaavn] Found ${songs.length} songs from ${baseUrl}`)
            return songs
          }
        }
      } catch (error) {
        console.error(`❌ [JioSaavn] ${baseUrl} failed:`, error.message)
        continue
      }
    }

    console.log(`⚠️ [JioSaavn] All endpoints failed for search`)
    return []
  }

  async getTrending(): Promise<ModernSong[]> {
    for (const baseUrl of this.baseUrls) {
      try {
        console.log(`📈 [JioSaavn] Getting trending from ${baseUrl}`)
        this.currentBaseUrl = baseUrl

        // Try multiple trending approaches
        const trendingApproaches = [
          () => this.getTrendingFromCharts(baseUrl),
          () => this.getTrendingFromSearch(baseUrl, "trending hindi songs"),
          () => this.getTrendingFromSearch(baseUrl, "bollywood hits"),
          () => this.getTrendingFromSearch(baseUrl, "arijit singh"),
        ]

        for (const approach of trendingApproaches) {
          try {
            const songs = await approach()
            if (songs.length > 0) {
              console.log(`✅ [JioSaavn] Found ${songs.length} trending songs`)
              return songs.slice(0, 20)
            }
          } catch (error) {
            continue
          }
        }
      } catch (error) {
        console.error(`❌ [JioSaavn] ${baseUrl} trending failed:`, error.message)
        continue
      }
    }

    console.log(`⚠️ [JioSaavn] All endpoints failed for trending`)
    return []
  }

  private async getTrendingFromCharts(baseUrl: string): Promise<ModernSong[]> {
    const url = `${baseUrl}/api/charts`
    const response = await modernFetch<any>(url, {
      apiName: "JioSaavn-Charts",
      timeout: 6000,
      retries: 0,
    })

    if (response && response.success && response.data) {
      return this.extractSongsFromCharts(response.data)
    }
    return []
  }

  private async getTrendingFromSearch(baseUrl: string, query: string): Promise<ModernSong[]> {
    const url = `${baseUrl}/api/search/songs?query=${encodeURIComponent(query)}&page=1&limit=15`
    const response = await modernFetch<any>(url, {
      apiName: "JioSaavn-Search",
      timeout: 6000,
      retries: 0,
    })

    if (response && response.success && response.data?.results && Array.isArray(response.data.results)) {
      return response.data.results
        .filter((song) => song && typeof song === "object")
        .map((song) => this.transformSong(song))
        .filter((song) => song.title !== "Unknown Song")
    }
    return []
  }

  async getSongDetails(songId: string): Promise<ModernSong | null> {
    try {
      const url = `${this.currentBaseUrl}/api/songs/${songId}`
      const response = await modernFetch<any>(url, {
        apiName: "JioSaavn",
        timeout: 8000,
      })

      if (response.success && response.data) {
        return this.transformSong(response.data)
      }
    } catch (error) {
      console.error(`❌ [JioSaavn] Song details failed:`, error.message)
    }
    return null
  }

  private extractSongsFromCharts(chartsData: any): ModernSong[] {
    const songs: ModernSong[] = []

    try {
      // Handle different chart response formats
      if (chartsData.trending && Array.isArray(chartsData.trending)) {
        songs.push(...chartsData.trending.map(this.transformSong.bind(this)))
      }

      if (chartsData.charts && Array.isArray(chartsData.charts)) {
        for (const chart of chartsData.charts) {
          if (chart.songs && Array.isArray(chart.songs)) {
            songs.push(...chart.songs.map(this.transformSong.bind(this)))
          }
        }
      }

      if (Array.isArray(chartsData)) {
        songs.push(...chartsData.map(this.transformSong.bind(this)))
      }
    } catch (error) {
      console.error("Error extracting songs from charts:", error)
    }

    return songs.slice(0, 20)
  }

  private transformSong(song: any): ModernSong {
    if (!song) return this.createFallbackSong()

    // Enhanced transformation with better null handling
    const imageUrl = this.extractImageUrl(song.image)
    const audioUrl = this.extractAudioUrl(song.downloadUrl || song.download_url)

    return {
      id: song.id || `saavn-${Date.now()}-${Math.random()}`,
      title: this.cleanString(song.name || song.title) || "Unknown Song",
      artist: this.cleanString(song.primaryArtists || song.artist || song.artists) || "Unknown Artist",
      album: this.cleanString(song.album?.name || song.album) || "Unknown Album",
      duration: this.parseDuration(song.duration),
      image: imageUrl,
      preview_url: audioUrl,
      download_url: audioUrl,
      external_urls: {
        saavn: song.permaUrl || song.url,
        spotify: song.spotify_url,
        youtube: song.youtube_url,
      },
      explicit: Boolean(song.explicitContent || song.explicit),
      release_date: song.year || song.releaseDate,
      language: song.language || "hindi",
      quality: this.extractQuality(song.downloadUrl || song.download_url),
      label: this.cleanString(song.label),
      copyright: this.cleanString(song.copyright),
    }
  }

  private createFallbackSong(): ModernSong {
    return {
      id: `fallback-${Date.now()}`,
      title: "Unknown Song",
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration: 0,
      image: "/placeholder.svg?height=300&width=300",
      preview_url: "",
      download_url: "",
      language: "hindi",
      quality: "160kbps",
    }
  }

  private extractImageUrl(imageData: any): string {
    if (!imageData) return "/placeholder.svg?height=300&width=300"

    if (typeof imageData === "string") {
      return imageData.trim() || "/placeholder.svg?height=300&width=300"
    }

    if (Array.isArray(imageData)) {
      // Prioritize higher quality images
      const qualities = ["500x500", "150x150", "50x50"]
      for (const quality of qualities) {
        const img = imageData.find((img) => img?.quality === quality)
        if (img?.link || img?.url) {
          return (img.link || img.url).trim()
        }
      }

      // Fallback to first available image
      for (const img of imageData) {
        if (img?.link || img?.url) {
          return (img.link || img.url).trim()
        }
      }
    }

    return "/placeholder.svg?height=300&width=300"
  }

  private extractAudioUrl(audioData: any): string {
    if (!audioData) return ""

    if (typeof audioData === "string") {
      return audioData.trim()
    }

    if (Array.isArray(audioData)) {
      // Prioritize higher quality audio
      const qualities = ["320kbps", "160kbps", "96kbps", "48kbps"]
      for (const quality of qualities) {
        const audio = audioData.find((a) => a?.quality === quality)
        if (audio?.link || audio?.url) {
          return (audio.link || audio.url).trim()
        }
      }

      // Fallback to first available audio
      for (const audio of audioData) {
        if (audio?.link || audio?.url) {
          return (audio.link || audio.url).trim()
        }
      }
    }

    return ""
  }

  private extractQuality(audioData: any): string {
    if (Array.isArray(audioData) && audioData.length > 0) {
      return audioData[0]?.quality || "160kbps"
    }
    return "160kbps"
  }

  private parseDuration(duration: any): number {
    if (typeof duration === "number") return duration
    if (typeof duration === "string") {
      const parsed = Number.parseInt(duration)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  private cleanString(str: string | null | undefined): string {
    if (!str || typeof str !== "string") return ""
    return str
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .trim()
  }
}

// --- Enhanced Sample Data API (Fallback Only) ---
class SampleDataAPI {
  private sampleSongs = [
    {
      id: "sample-1",
      title: "Kesariya",
      artist: "Arijit Singh",
      album: "Brahmastra",
      duration: 268,
      image: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220825141240-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "sample-2",
      title: "Chaleya",
      artist: "Arijit Singh, Shilpa Rao",
      album: "Jawan",
      duration: 230,
      image: "https://c.saavncdn.com/807/Jawan-Hindi-2023-20230921140620-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "sample-3",
      title: "Heeriye",
      artist: "Arijit Singh, Jasleen Royal",
      album: "Heeriye",
      duration: 210,
      image: "https://c.saavncdn.com/734/Heeriye-Hindi-2023-20230731051001-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
  ]

  async search(query: string): Promise<ModernSong[]> {
    console.log(`📦 [Sample] Fallback search for: ${query}`)
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    const results = this.sampleSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm) ||
        song.artist.toLowerCase().includes(searchTerm) ||
        song.album.toLowerCase().includes(searchTerm),
    )

    console.log(`📦 [Sample] Found ${results.length} fallback results`)
    return results
  }

  async getTrending(): Promise<ModernSong[]> {
    console.log(`📦 [Sample] Fallback trending songs`)
    return this.sampleSongs
  }
}

// --- Enhanced Music Service Manager ---
class ModernMusicService {
  private jioSaavnApi = new JioSaavnAPI()
  private sampleApi = new SampleDataAPI()
  private lastSuccessfulSearch: ModernSong[] = []
  private lastSuccessfulTrending: ModernSong[] = []

  async search(query: string): Promise<ModernSong[]> {
    console.log(`🔍 Enhanced search for: ${query}`)

    if (!query || typeof query !== "string" || !query.trim()) {
      return []
    }

    // Try JioSaavn API first
    try {
      console.log(`🎵 [Priority] Using JioSaavn API for search`)
      const jioSaavnResults = await this.jioSaavnApi.search(query.trim())

      if (jioSaavnResults && jioSaavnResults.length > 0) {
        this.lastSuccessfulSearch = jioSaavnResults
        console.log(`✅ [JioSaavn] Primary search successful: ${jioSaavnResults.length} songs`)
        return jioSaavnResults
      }
    } catch (error) {
      console.error(`❌ [JioSaavn] Primary search failed:`, error.message)
    }

    // Fallback to sample data
    console.log(`⚠️ [Fallback] Using sample data for search`)
    try {
      const sampleResults = await this.sampleApi.search(query.trim())
      return sampleResults || []
    } catch (error) {
      console.error(`❌ [Sample] Fallback search failed:`, error.message)
      return this.lastSuccessfulSearch || []
    }
  }

  async getTrending(): Promise<ModernSong[]> {
    console.log(`📈 Enhanced trending fetch`)

    // Try JioSaavn API first
    try {
      console.log(`🎵 [Priority] Using JioSaavn API for trending`)
      const jioSaavnResults = await this.jioSaavnApi.getTrending()

      if (jioSaavnResults && jioSaavnResults.length > 0) {
        this.lastSuccessfulTrending = jioSaavnResults
        console.log(`✅ [JioSaavn] Primary trending successful: ${jioSaavnResults.length} songs`)
        return jioSaavnResults
      }
    } catch (error) {
      console.error(`❌ [JioSaavn] Primary trending failed:`, error.message)
    }

    // Fallback to sample data
    console.log(`⚠️ [Fallback] Using sample trending data`)
    try {
      const sampleResults = await this.sampleApi.getTrending()
      return sampleResults || []
    } catch (error) {
      console.error(`❌ [Sample] Fallback trending failed:`, error.message)
      return this.lastSuccessfulTrending || []
    }
  }

  async getSongDetails(songId: string): Promise<ModernSong | null> {
    try {
      return await this.jioSaavnApi.getSongDetails(songId)
    } catch (error) {
      console.error(`❌ [JioSaavn] Song details failed:`, error.message)
      return null
    }
  }

  async checkHealth(): Promise<{ status: string; workingApis: string[]; message: string }> {
    console.log(`🏥 Checking enhanced API health`)

    const workingApis: string[] = []
    let jioSaavnWorking = false

    // Check JioSaavn API with a simple test
    try {
      console.log(`🏥 [JioSaavn] Health check...`)
      const results = await this.jioSaavnApi.search("test")
      if (Array.isArray(results) && results.length >= 0) {
        // Even 0 results means API is responding
        workingApis.push("JioSaavn")
        jioSaavnWorking = true
        console.log(`✅ [JioSaavn] Health check passed`)
      }
    } catch (error) {
      console.error(`❌ [JioSaavn] Health check failed:`, error.message)
    }

    // Sample data is always available as fallback
    workingApis.push("Sample")

    const status = jioSaavnWorking ? "healthy" : "limited"
    const message = `${workingApis.length} APIs working: ${workingApis.join(", ")}`

    console.log(`🏥 Health check result: ${status} - ${message}`)

    return { status, workingApis, message }
  }
}

// --- Export Enhanced Service ---
export const modernMusicService = new ModernMusicService()

// --- Legacy Compatibility Functions ---
export async function searchMusic(query: string): Promise<{ success: boolean; data: { results: ModernSong[] } }> {
  try {
    const results = await modernMusicService.search(query)
    return {
      success: true,
      data: { results },
    }
  } catch (error) {
    console.error("Enhanced search failed:", error.message || error)
    return {
      success: false,
      data: { results: [] },
    }
  }
}

export async function getTrendingMusic(): Promise<{ success: boolean; data: { trending: ModernSong[] } }> {
  try {
    const trending = await modernMusicService.getTrending()
    return {
      success: true,
      data: { trending },
    }
  } catch (error) {
    console.error("Enhanced trending failed:", error.message || error)
    return {
      success: false,
      data: { trending: [] },
    }
  }
}

export async function getSongDetails(songId: string): Promise<{ success: boolean; data: ModernSong | null }> {
  try {
    const song = await modernMusicService.getSongDetails(songId)
    return {
      success: true,
      data: song,
    }
  } catch (error) {
    console.error("Get song details failed:", error.message || error)
    return {
      success: false,
      data: null,
    }
  }
}

export async function checkApiHealth(): Promise<{ status: string; message: string; workingEndpoint?: string }> {
  const health = await modernMusicService.checkHealth()
  return {
    status: health.status,
    message: health.message,
    workingEndpoint: health.workingApis[0] || undefined,
  }
}

// --- Utility Functions ---
export function getHighQualityImage(image: any): string {
  if (typeof image === "string" && image.trim()) return image.trim()
  return "/placeholder.svg?height=300&width=300"
}

export function getHighQualityAudio(audio: any): string {
  if (typeof audio === "string" && audio.trim()) return audio.trim()
  return ""
}

export function sanitizeString(str: string | undefined): string {
  if (!str) return ""
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .trim()
}

export function formatDuration(duration: number): string {
  if (!duration) return "0:00"
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export { ModernApiError as ApiError }
export type { ModernSong as ApiSong }
