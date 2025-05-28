export interface SaavnSong {
  id: string
  title: string
  type: string
  album: string
  year?: string
  duration?: number
  language?: string
  url: string
  image: Array<{
    quality: string
    url: string
  }>
  primaryArtists?: string
  singers?: string
  description?: string
}

export interface SearchResults {
  songs?: {
    data: SaavnSong[]
    total: number
  }
  albums?: {
    data: any[]
    total: number
  }
  artists?: {
    data: any[]
    total: number
  }
  playlists?: {
    data: any[]
    total: number
  }
}

// --- Util Functions ---

export function getHighQualityImage(images?: Array<{ quality: string; url: string }>): string {
  if (!images || !images.length) return "/placeholder.svg?height=300&width=300"

  const preferred =
    images.find((img) => img.quality === "500x500") ||
    images.find((img) => img.quality === "150x150") ||
    images[images.length - 1]

  return preferred?.url || "/placeholder.svg?height=300&width=300"
}

export function formatDuration(duration?: number): string {
  if (!duration || isNaN(duration)) return "0:00"
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

// --- Main API Logic ---

const BASE_API = "https://saavn.dev/api"

async function apiRequest<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${BASE_API}${endpoint}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.data || data
  } catch (err) {
    console.error("Saavn API Error:", err)
    throw err
  }
}

export async function searchAll(query: string): Promise<SearchResults> {
  if (!query?.trim()) return { songs: { data: [], total: 0 } }

  const endpoint = `/search?query=${encodeURIComponent(query)}`
  const result = await apiRequest<any>(endpoint)

  return {
    songs: {
      data: result.songs?.results || [],
      total: result.songs?.results?.length || 0,
    },
    albums: {
      data: result.albums?.results || [],
      total: result.albums?.results?.length || 0,
    },
    artists: {
      data: result.artists?.results || [],
      total: result.artists?.results?.length || 0,
    },
    playlists: {
      data: result.playlists?.results || [],
      total: result.playlists?.results?.length || 0,
    },
  }
}
