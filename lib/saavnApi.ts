const SAAVN_API_BASE = "https://saavn.dev/api"

export interface SaavnSong {
  id: string
  name: string
  type: string
  album: {
    id: string
    name: string
    url: string
  }
  year: string
  releaseDate: string
  duration: string
  label: string
  primaryArtists: string
  primaryArtistsId: string
  featuredArtists: string
  featuredArtistsId: string
  explicitContent: number
  playCount: string
  language: string
  hasLyrics: string
  url: string
  copyright: string
  image: Array<{
    quality: string
    link: string
  }>
  downloadUrl: Array<{
    quality: string
    link: string
  }>
}

export interface SaavnAlbum {
  id: string
  name: string
  year: string
  type: string
  playCount: string
  language: string
  explicitContent: string
  songCount: string
  primaryArtists: string
  primaryArtistsId: string
  image: Array<{
    quality: string
    link: string
  }>
  songs?: SaavnSong[]
}

export interface SaavnArtist {
  id: string
  name: string
  url: string
  type: string
  followerCount: string
  fanCount: string
  isVerified: string
  dominantLanguage: string
  dominantType: string
  image: Array<{
    quality: string
    link: string
  }>
  topSongs?: SaavnSong[]
  topAlbums?: SaavnAlbum[]
}

export interface SaavnPlaylist {
  id: string
  name: string
  followerCount: string
  songCount: string
  fanCount: string
  username: string
  firstname: string
  lastname: string
  shares: string
  image: Array<{
    quality: string
    link: string
  }>
  url: string
  songs?: SaavnSong[]
}

export interface SearchResults {
  songs?: {
    data: SaavnSong[]
    total: number
  }
  albums?: {
    data: SaavnAlbum[]
    total: number
  }
  artists?: {
    data: SaavnArtist[]
    total: number
  }
  playlists?: {
    data: SaavnPlaylist[]
    total: number
  }
}

class SaavnApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = "SaavnApiError"
  }
}

async function apiRequest<T>(endpoint: string): Promise<T> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${SAAVN_API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new SaavnApiError(`HTTP ${response.status}: ${response.statusText}`, response.status)
    }

    const data = await response.json()

    if (data.success === false) {
      throw new SaavnApiError(data.message || "API request failed")
    }

    return data.data || data
  } catch (error) {
    if (error instanceof SaavnApiError) {
      throw error
    }
    if (error.name === "AbortError") {
      throw new SaavnApiError("Request timeout - please try again")
    }
    throw new SaavnApiError("Network error - please check your connection")
  }
}

// Search functionality
export async function searchAll(query: string): Promise<SearchResults> {
  try {
    return await apiRequest<SearchResults>(`/search/all?query=${encodeURIComponent(query)}`)
  } catch (error) {
    console.error("Search all error:", error)
    throw error
  }
}

export async function searchSongs(query: string, page = 1, limit = 20): Promise<{ data: SaavnSong[]; total: number }> {
  try {
    return await apiRequest<{ data: SaavnSong[]; total: number }>(
      `/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    )
  } catch (error) {
    console.error("Search songs error:", error)
    throw error
  }
}

// Get trending content with fallback
export async function getTrendingSongs(): Promise<SaavnSong[]> {
  try {
    // Try to get trending songs
    const response = await apiRequest<any>("/modules?language=hindi")

    // Handle different response structures
    if (response.charts && response.charts.length > 0) {
      return response.charts[0].songs || []
    }

    if (response.trending && response.trending.songs) {
      return response.trending.songs
    }

    if (response.albums && response.albums.length > 0) {
      return response.albums[0].songs || []
    }

    // Fallback: search for popular songs
    const fallbackSearch = await searchSongs("hindi songs", 1, 20)
    return fallbackSearch.data || []
  } catch (error) {
    console.error("Get trending songs error:", error)
    // Return mock data as fallback
    return getMockTrendingSongs()
  }
}

// Mock data for fallback
function getMockTrendingSongs(): SaavnSong[] {
  return [
    {
      id: "mock1",
      name: "Kesariya",
      type: "song",
      album: { id: "mock-album1", name: "Brahmastra", url: "" },
      year: "2022",
      releaseDate: "2022-07-17",
      duration: "268",
      label: "Sony Music",
      primaryArtists: "Arijit Singh",
      primaryArtistsId: "459320",
      featuredArtists: "",
      featuredArtistsId: "",
      explicitContent: 0,
      playCount: "100000000",
      language: "hindi",
      hasLyrics: "true",
      url: "",
      copyright: "©  2022 Sony Music Entertainment India Pvt. Ltd.",
      image: [
        { quality: "50x50", link: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220717092820-50x50.jpg" },
        { quality: "150x150", link: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220717092820-150x150.jpg" },
        { quality: "500x500", link: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220717092820-500x500.jpg" },
      ],
      downloadUrl: [
        { quality: "96kbps", link: "https://aac.saavncdn.com/191/0f0b2c9c9b9c9b9c9b9c9b9c/96.mp4" },
        { quality: "160kbps", link: "https://aac.saavncdn.com/191/0f0b2c9c9b9c9b9c9b9c9b9c/160.mp4" },
        { quality: "320kbps", link: "https://aac.saavncdn.com/191/0f0b2c9c9b9c9b9c9b9c9b9c/320.mp4" },
      ],
    },
    {
      id: "mock2",
      name: "Apna Bana Le",
      type: "song",
      album: { id: "mock-album2", name: "Bhediya", url: "" },
      year: "2022",
      releaseDate: "2022-10-17",
      duration: "245",
      label: "T-Series",
      primaryArtists: "Arijit Singh",
      primaryArtistsId: "459320",
      featuredArtists: "",
      featuredArtistsId: "",
      explicitContent: 0,
      playCount: "80000000",
      language: "hindi",
      hasLyrics: "true",
      url: "",
      copyright: "©  2022 Super Cassettes Industries Private Limited",
      image: [
        { quality: "50x50", link: "https://c.saavncdn.com/343/Bhediya-Hindi-2022-20221017151007-50x50.jpg" },
        { quality: "150x150", link: "https://c.saavncdn.com/343/Bhediya-Hindi-2022-20221017151007-150x150.jpg" },
        { quality: "500x500", link: "https://c.saavncdn.com/343/Bhediya-Hindi-2022-20221017151007-500x500.jpg" },
      ],
      downloadUrl: [
        { quality: "96kbps", link: "https://aac.saavncdn.com/343/0f0b2c9c9b9c9b9c9b9c9b9c/96.mp4" },
        { quality: "160kbps", link: "https://aac.saavncdn.com/343/0f0b2c9c9b9c9b9c9b9c9b9c/160.mp4" },
        { quality: "320kbps", link: "https://aac.saavncdn.com/343/0f0b2c9c9b9c9b9c9b9c9b9c/320.mp4" },
      ],
    },
  ]
}

// Utility functions
export function getHighQualityImage(images: Array<{ quality: string; link: string }>): string {
  if (!images || images.length === 0) return "/placeholder.svg?height=300&width=300"

  // Prefer higher quality images
  const highQuality =
    images.find((img) => img.quality === "500x500") ||
    images.find((img) => img.quality === "150x150") ||
    images[images.length - 1]

  return highQuality?.link || "/placeholder.svg?height=300&width=300"
}

export function getHighQualityAudio(downloadUrls: Array<{ quality: string; link: string }>): string {
  if (!downloadUrls || downloadUrls.length === 0) return ""

  // Prefer higher quality audio
  const highQuality =
    downloadUrls.find((url) => url.quality === "320kbps") ||
    downloadUrls.find((url) => url.quality === "160kbps") ||
    downloadUrls.find((url) => url.quality === "96kbps") ||
    downloadUrls[downloadUrls.length - 1]

  return highQuality?.link || ""
}

export function formatDuration(duration: string): string {
  const seconds = Number.parseInt(duration)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function formatPlayCount(count: string): string {
  const num = Number.parseInt(count)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return count
}
