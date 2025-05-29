"use client"

import { sampleSongs, getTrendingSampleSongs, searchSampleSongs } from "./sampleData"
import type { Song } from "./store"

// --- Interfaces ---
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
  isOriginal?: boolean
  priority?: number
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

// Convert Song to SaavnSong format for compatibility
function convertSongToSaavnSong(song: Song): SaavnSong {
  return {
    id: song.id,
    name: song.title,
    type: "song",
    album: {
      id: song.id + "_album",
      name: song.album,
      url: "",
    },
    year: song.year || "2023",
    releaseDate: song.year || "2023",
    duration: song.duration.toString(),
    label: "Sample Music",
    primaryArtists: song.artist,
    primaryArtistsId: song.id + "_artist",
    featuredArtists: "",
    featuredArtistsId: "",
    explicitContent: song.explicit ? 1 : 0,
    playCount: song.playCount || "1000000",
    language: song.language || "hindi",
    hasLyrics: "true",
    url: song.url || "",
    copyright: "Sample Music",
    image: [
      {
        quality: "500x500",
        link: song.image,
      },
    ],
    downloadUrl: [
      {
        quality: "320kbps",
        link: song.audio,
      },
    ],
  }
}

// Enhanced search function using sample data with API fallback
export async function searchAll(query: string): Promise<SearchResults> {
  if (!query?.trim()) {
    return { songs: { data: [], total: 0 } }
  }

  console.log(`Searching for: ${query}`)

  try {
    // First try to use sample data search
    const sampleResults = searchSampleSongs(query)

    if (sampleResults.length > 0) {
      const saavnSongs = sampleResults.map(convertSongToSaavnSong)
      console.log(`Found ${sampleResults.length} songs in sample data`)

      return {
        songs: {
          data: saavnSongs,
          total: saavnSongs.length,
        },
      }
    }

    // If no sample results, try API as fallback (but don't fail if it doesn't work)
    try {
      const response = await fetch(`https://acromusic.pages.dev/search?query=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(5000),
        mode: "cors",
      })

      if (response.ok) {
        const data = await response.json()
        // Handle API response if it works
        if (data?.songs) {
          return { songs: { data: data.songs, total: data.songs.length } }
        }
      }
    } catch (apiError) {
      console.log("API search failed, using sample data only")
    }

    // Return empty results if nothing found
    return { songs: { data: [], total: 0 } }
  } catch (error) {
    console.error("Search error:", error)
    return { songs: { data: [], total: 0 } }
  }
}

// Get trending songs using sample data with API fallback
export async function getTrendingSongs(): Promise<SaavnSong[]> {
  try {
    console.log("Fetching trending songs...")

    // Always use sample data as primary source
    const trendingSongs = getTrendingSampleSongs()
    const saavnSongs = trendingSongs.map(convertSongToSaavnSong)

    console.log(`Using ${saavnSongs.length} trending songs from sample data`)
    return saavnSongs
  } catch (error) {
    console.error("Error fetching trending songs:", error)
    // Even if there's an error, return some sample songs
    const fallbackSongs = sampleSongs.slice(0, 10)
    return fallbackSongs.map(convertSongToSaavnSong)
  }
}

// Utility functions for getting specific quality images and audio links
export function getHighQualityImage(images: Array<{ quality: string; link: string }> | undefined): string {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return "/placeholder.svg?height=300&width=300"
  }

  const highQuality =
    images.find((img) => img?.quality === "500x500") ||
    images.find((img) => img?.quality === "150x150") ||
    images[images.length - 1]

  return highQuality?.link || "/placeholder.svg?height=300&width=300"
}

export function getHighQualityAudio(downloadUrls: Array<{ quality: string; link: string }> | undefined): string {
  if (!downloadUrls || !Array.isArray(downloadUrls) || downloadUrls.length === 0) {
    return ""
  }

  const highQuality =
    downloadUrls.find((url) => url?.quality === "320kbps") ||
    downloadUrls.find((url) => url?.quality === "160kbps") ||
    downloadUrls.find((url) => url?.quality === "96kbps") ||
    downloadUrls[downloadUrls.length - 1]

  return highQuality?.link || ""
}

export function formatDuration(duration: string | undefined): string {
  if (!duration) return "0:00"
  const seconds = Number.parseInt(duration)
  if (isNaN(seconds)) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Get song details by ID from sample data
export async function getSongById(id: string): Promise<SaavnSong | null> {
  try {
    const song = sampleSongs.find((s) => s.id === id)
    return song ? convertSongToSaavnSong(song) : null
  } catch (error) {
    console.error("Error fetching song by ID:", error)
    return null
  }
}

// Mock functions for compatibility
export async function getAlbumById(id: string): Promise<any> {
  return null
}

export async function getArtistById(id: string): Promise<any> {
  return null
}

export async function getPlaylistById(id: string): Promise<any> {
  return null
}
