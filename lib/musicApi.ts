"use client"

// Enhanced Music API integration with multiple fallback strategies
const PRIMARY_API_ENDPOINTS = [
  "https://saavn.dev",
  "https://jiosaavn-api-2.vercel.app",
  "https://saavn-api-jade.vercel.app",
  "https://jiosaavn-api-privatecvc.vercel.app",
  "https://saavn.dev",
]

// Backup APIs with different structures
const BACKUP_ENDPOINTS = [
  "https://jiosaavn-api-privatecvc.vercel.app/api",
  "https://saavn.dev/api",
  "https://jiosaavn-api.vercel.app/api",
]

// --- Enhanced Interfaces ---
interface ApiSong {
  id: string
  name: string
  type?: string
  album?: {
    id?: string
    name?: string
    url?: string
  }
  year?: string
  releaseDate?: string
  duration?: string | number
  label?: string
  primaryArtists?: string
  primaryArtistsId?: string
  featuredArtists?: string
  explicitContent?: number | boolean
  playCount?: string
  language?: string
  hasLyrics?: string | boolean
  url?: string
  copyright?: string
  image?:
    | Array<{
        quality?: string
        link?: string
        url?: string
      }>
    | string
  downloadUrl?:
    | Array<{
        quality?: string
        link?: string
        url?: string
      }>
    | string
  // Alternative field names for different APIs
  title?: string
  artist?: string
  artists?: string
  albumName?: string
  imageUrl?: string
  audioUrl?: string
  preview_url?: string
  external_urls?: any
}

interface ApiResponse {
  success?: boolean
  status?: string
  data?: {
    results?: ApiSong[]
    songs?: ApiSong[]
    trending?: ApiSong[]
    total?: number
    start?: number
  }
  results?: ApiSong[]
  songs?: ApiSong[]
  trending?: ApiSong[]
  // Direct array response
  length?: number
}

// --- Enhanced Error Handling ---
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
    public details?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// --- Utility Functions ---
function normalizeImageUrl(image: any): string {
  if (!image) return "/placeholder.svg?height=300&width=300"

  if (typeof image === "string") return image

  if (Array.isArray(image)) {
    // Try to find the best quality image
    const highQuality = image.find(
      (img) => img?.quality === "500x500" || img?.quality === "150x150" || img?.link || img?.url,
    )
    if (highQuality) {
      return highQuality.link || highQuality.url || "/placeholder.svg?height=300&width=300"
    }
    // Fallback to first image
    const first = image[0]
    if (first) {
      return first.link || first.url || first || "/placeholder.svg?height=300&width=300"
    }
  }

  if (typeof image === "object" && image.link) return image.link
  if (typeof image === "object" && image.url) return image.url

  return "/placeholder.svg?height=300&width=300"
}

function normalizeAudioUrl(downloadUrl: any): string {
  if (!downloadUrl) return ""

  if (typeof downloadUrl === "string") return downloadUrl

  if (Array.isArray(downloadUrl)) {
    // Try to find the best quality audio
    const highQuality = downloadUrl.find(
      (audio) => audio?.quality === "320kbps" || audio?.quality === "160kbps" || audio?.link || audio?.url,
    )
    if (highQuality) {
      return highQuality.link || highQuality.url || ""
    }
    // Fallback to first audio
    const first = downloadUrl[0]
    if (first) {
      return first.link || first.url || first || ""
    }
  }

  if (typeof downloadUrl === "object" && downloadUrl.link) return downloadUrl.link
  if (typeof downloadUrl === "object" && downloadUrl.url) return downloadUrl.url

  return ""
}

function normalizeSong(song: any): ApiSong | null {
  if (!song || (!song.id && !song.name && !song.title)) return null

  return {
    id: song.id || song.videoId || `${Date.now()}-${Math.random()}`,
    name: song.name || song.title || "Unknown Song",
    type: song.type || "song",
    album: {
      id: song.album?.id || song.albumId,
      name: song.album?.name || song.albumName || "Unknown Album",
      url: song.album?.url || "",
    },
    year: song.year || song.releaseDate?.split("-")[0] || "",
    duration: song.duration || song.durationInMs || 0,
    label: song.label || "",
    primaryArtists: song.primaryArtists || song.artist || song.artists || "Unknown Artist",
    primaryArtistsId: song.primaryArtistsId || "",
    featuredArtists: song.featuredArtists || "",
    explicitContent: song.explicitContent || song.explicit || false,
    playCount: song.playCount || "0",
    language: song.language || "unknown",
    hasLyrics: song.hasLyrics || false,
    url: song.url || song.permaUrl || "",
    copyright: song.copyright || "",
    image: song.image || song.imageUrl || song.thumbnail,
    downloadUrl: song.downloadUrl || song.audioUrl || song.preview_url,
  }
}

// --- Enhanced API Request Function ---
async function makeApiRequest<T>(
  endpoint: string,
  options: {
    timeout?: number
    retries?: number
    baseUrls?: string[]
    method?: string
    headers?: Record<string, string>
  } = {},
): Promise<T> {
  const { timeout = 8000, retries = 1, baseUrls = PRIMARY_API_ENDPOINTS, method = "GET", headers = {} } = options

  let lastError: Error | null = null

  // Try each base URL
  for (const baseUrl of baseUrls) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const url = `${baseUrl}${endpoint}`
        console.log(`🔄 API Request (${baseUrl}, attempt ${attempt + 1}): ${endpoint}`)

        const response = await fetch(url, {
          method,
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Origin: window.location.origin,
            ...headers,
          },
          mode: "cors",
          cache: "no-cache",
        })

        clearTimeout(timeoutId)

        console.log(`📡 Response status: ${response.status} for ${url}`)

        if (!response.ok) {
          throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, endpoint)
        }

        const contentType = response.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
          // Try to parse anyway, some APIs return JSON without proper headers
          const text = await response.text()
          try {
            const data = JSON.parse(text)
            console.log(`✅ Success with ${baseUrl}:`, data)
            return data
          } catch {
            throw new ApiError("Invalid response format: Expected JSON", response.status, endpoint)
          }
        }

        const data = await response.json()
        console.log(`✅ Success with ${baseUrl}:`, data)
        return data
      } catch (error) {
        clearTimeout(timeoutId)
        lastError = error as Error

        if (error instanceof ApiError) {
          console.error(`❌ API Error (${baseUrl}, attempt ${attempt + 1}):`, error.message)
        } else if (error.name === "AbortError") {
          console.error(`⏰ Timeout (${baseUrl}, attempt ${attempt + 1})`)
          lastError = new ApiError(`Request timeout after ${timeout}ms`, 408, endpoint)
        } else {
          console.error(`🌐 Network error (${baseUrl}, attempt ${attempt + 1}):`, error)
          lastError = new ApiError(`Network error: ${error.message}`, 0, endpoint)
        }

        // Don't retry on client errors (4xx) except 429
        if (
          error instanceof ApiError &&
          error.status &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 429
        ) {
          break
        }

        // Wait before retrying
        if (attempt < retries) {
          const delay = Math.min(500 * Math.pow(2, attempt), 2000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }
  }

  throw lastError || new ApiError("All endpoints and retries failed", 0, endpoint)
}

// --- Main API Functions ---

// Search with multiple endpoint strategies
export async function searchMusic(query: string, searchType: "song" | "lyrics" = "song"): Promise<ApiResponse> {
  if (!query?.trim()) {
    throw new ApiError("Search query cannot be empty")
  }

  const encodedQuery = encodeURIComponent(query.trim())
  const type = searchType === "lyrics" ? "lyrics" : "song"

  // Try different endpoint patterns
  const searchEndpoints = [
    `/search/songs?query=${encodedQuery}&type=${type}`,
    `/api/search/songs?query=${encodedQuery}&type=${type}`,
    `/search?query=${encodedQuery}`, // Default to song search
    `/api/search?query=${encodedQuery}`,
    `/songs/search?query=${encodedQuery}`,
  ]

  let lastError: Error | null = null

  for (const endpoint of searchEndpoints) {
    try {
      console.log(`🔍 Trying search endpoint: ${endpoint}`)
      const response = await makeApiRequest<any>(endpoint, {
        baseUrls: [...PRIMARY_API_ENDPOINTS, ...BACKUP_ENDPOINTS],
        timeout: 6000,
        retries: 1,
      })

      // Handle different response formats
      let songs: ApiSong[] = []

      if (response.success && response.data?.results) {
        songs = response.data.results
      } else if (response.success && response.data?.songs) {
        songs = response.data.songs
      } else if (response.data?.results) {
        songs = response.data.results
      } else if (response.results) {
        songs = response.results
      } else if (response.songs) {
        songs = response.songs
      } else if (Array.isArray(response)) {
        songs = response
      } else if (response.data && Array.isArray(response.data)) {
        songs = response.data
      }

      if (songs && songs.length > 0) {
        const normalizedSongs = songs.map(normalizeSong).filter(Boolean)
        console.log(`✅ Search successful: ${normalizedSongs.length} songs found`)

        return {
          success: true,
          data: {
            results: normalizedSongs,
            total: normalizedSongs.length,
          },
        }
      }
    } catch (error) {
      lastError = error as Error
      console.warn(`❌ Search endpoint ${endpoint} failed:`, error.message)
      continue
    }
  }

  throw lastError || new ApiError("All search endpoints failed")
}

// Get trending with multiple strategies
export async function getTrendingMusic(): Promise<ApiResponse> {
  const trendingEndpoints = [
    "/modules?language=hindi",
    "/api/modules?language=hindi",
    "/trending",
    "/api/trending",
    "/charts",
    "/api/charts",
    "/songs/trending",
    "/playlists/featured",
  ]

  let lastError: Error | null = null

  for (const endpoint of trendingEndpoints) {
    try {
      console.log(`📈 Trying trending endpoint: ${endpoint}`)
      const response = await makeApiRequest<any>(endpoint, {
        baseUrls: [...PRIMARY_API_ENDPOINTS, ...BACKUP_ENDPOINTS],
        timeout: 8000,
        retries: 1,
      })

      // Handle different response formats
      let songs: ApiSong[] = []

      if (response.success && response.data?.trending) {
        songs = response.data.trending
      } else if (response.success && response.data?.charts) {
        songs = response.data.charts
      } else if (response.success && response.data?.results) {
        songs = response.data.results
      } else if (response.data?.trending) {
        songs = response.data.trending
      } else if (response.trending) {
        songs = response.trending
      } else if (response.charts) {
        songs = response.charts
      } else if (response.results) {
        songs = response.results
      } else if (Array.isArray(response)) {
        songs = response
      } else if (response.data && Array.isArray(response.data)) {
        songs = response.data
      }

      if (songs && songs.length > 0) {
        const normalizedSongs = songs.map(normalizeSong).filter(Boolean).slice(0, 20)
        console.log(`✅ Trending successful: ${normalizedSongs.length} songs found`)

        return {
          success: true,
          data: {
            trending: normalizedSongs,
          },
        }
      }
    } catch (error) {
      lastError = error as Error
      console.warn(`❌ Trending endpoint ${endpoint} failed:`, error.message)
      continue
    }
  }

  throw lastError || new ApiError("All trending endpoints failed")
}

// Get song by ID with fallbacks
export async function getSongById(id: string): Promise<ApiSong> {
  if (!id?.trim()) {
    throw new ApiError("Song ID cannot be empty")
  }

  const songEndpoints = [
    `/songs?id=${encodeURIComponent(id)}`,
    `/api/songs?id=${encodeURIComponent(id)}`,
    `/song/${encodeURIComponent(id)}`,
    `/api/song/${encodeURIComponent(id)}`,
  ]

  let lastError: Error | null = null

  for (const endpoint of songEndpoints) {
    try {
      const response = await makeApiRequest<any>(endpoint, {
        baseUrls: PRIMARY_API_ENDPOINTS,
        timeout: 5000,
      })

      let song = null
      if (response.success && response.data) {
        song = response.data
      } else if (response.data) {
        song = response.data
      } else if (response.song) {
        song = response.song
      } else {
        song = response
      }

      if (song) {
        const normalizedSong = normalizeSong(song)
        if (normalizedSong) {
          return normalizedSong
        }
      }
    } catch (error) {
      lastError = error as Error
      continue
    }
  }

  throw lastError || new ApiError("Song not found")
}

// Health check with multiple endpoints
export async function checkApiHealth(): Promise<{ status: string; message: string; workingEndpoint?: string }> {
  const healthEndpoints = ["/health", "/api/health", "/status", "/"]

  for (const baseUrl of PRIMARY_API_ENDPOINTS) {
    for (const endpoint of healthEndpoints) {
      try {
        await makeApiRequest<any>(endpoint, {
          baseUrls: [baseUrl],
          timeout: 3000,
          retries: 0,
        })
        return {
          status: "healthy",
          message: "API is working correctly",
          workingEndpoint: baseUrl,
        }
      } catch (error) {
        continue
      }
    }
  }

  return { status: "unhealthy", message: "All API endpoints are unreachable" }
}

// --- Utility Functions ---
export function getHighQualityImage(image: any): string {
  return normalizeImageUrl(image)
}

export function getHighQualityAudio(downloadUrls: any): string {
  return normalizeAudioUrl(downloadUrls)
}

export function formatDuration(duration: string | number | undefined): string {
  if (!duration) return "0:00"

  const seconds = typeof duration === "string" ? Number.parseInt(duration) : duration
  if (isNaN(seconds)) return "0:00"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
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

// --- Export Statements ---
const ModernApiError = ApiError

export { ModernApiError }
