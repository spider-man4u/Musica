// src/JioSaavnApp.tsx (or src/saavnApp.tsx)

import React, { useState, useEffect } from 'react';

// --- Interfaces ---
// These define the structure of the data you expect from the API.
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
    quality: string;
    link: string;
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

// --- API Endpoints and Core Logic Functions ---

// Enhanced API with better original song detection
// These are the unofficial JioSaavn API endpoints that the code will try to use.
const API_ENDPOINTS = [
  "https://jiosaavn-api-privatecvc.vercel.app",
  "https://saavn.me/api",
  "https://jiosaavn-api.vercel.app",
]

// Enhanced song quality scoring: Assigns a numerical score to a song
// based on various attributes like play count, year, image quality, and more.
function calculateSongQuality(song: SaavnSong): number {
  let score = 0

  // Base score for having essential data
  if (song.id && song.name && song.primaryArtists) score += 10

  // Prefer songs with higher play counts
  const playCount = Number.parseInt(song.playCount || "0")
  if (playCount > 10000000) score += 20
  else if (playCount > 1000000) score += 15
  else if (playCount > 100000) score += 10

  // Prefer newer songs
  const year = Number.parseInt(song.year || "0")
  if (year >= 2020) score += 15
  else if (year >= 2015) score += 10
  else if (year >= 2010) score += 5

  // Prefer songs with high-quality images
  if (song.image?.some((img) => img.quality === "500x500")) score += 10

  // Prefer songs with high-quality audio
  if (song.downloadUrl?.some((url) => url.quality === "320kbps")) score += 10

  // Penalty for remixes, covers, etc.
  const title = song.name.toLowerCase()
  const artist = song.primaryArtists?.toLowerCase() || ""

  if (title.includes("remix")) score -= 20
  if (title.includes("cover")) score -= 25
  if (title.includes("karaoke")) score -= 30
  if (title.includes("instrumental")) score -= 15
  if (artist.includes("unknown")) score -= 30
  if (title.includes("version")) score -= 10

  // Bonus for popular artists
  const popularArtists = ["arijit singh", "shreya ghoshal", "rahat fateh ali khan", "atif aslam", "armaan malik"]
  if (popularArtists.some((artist) => song.primaryArtists?.toLowerCase().includes(artist))) {
    score += 25
  }

  return score
}

// Filter and sort songs by quality: Removes non-original content and sorts by calculated quality.
function filterAndSortSongs(songs: SaavnSong[]): SaavnSong[] {
  return songs
    .filter((song) => {
      if (!song || !song.id || !song.name) return false

      const title = song.name.toLowerCase()
      const artist = song.primaryArtists?.toLowerCase() || ""

      // Strict filtering for original content (avoiding remixes, covers, karaoke, unknown artists)
      const isRemix = title.includes("remix") || title.includes("mix")
      const isCover = title.includes("cover") || title.includes("version")
      const isKaraoke = title.includes("karaoke") || title.includes("instrumental")
      const isUnknown = artist.includes("unknown") || artist === ""

      return !(isRemix || isCover || isKaraoke || isUnknown)
    })
    .map((song) => ({
      ...song,
      priority: calculateSongQuality(song), // Attach the calculated priority
      isOriginal: true, // Mark as original if it passes the filter
    }))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)) // Sort in descending order of priority
}

// Generic API request function with timeout and error handling.
async function apiRequest<T>(endpoint: string, baseUrl: string): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000) // Set a timeout for 8 seconds

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      signal: controller.signal, // Link the AbortController to the fetch request
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId) // Clear the timeout if the request completes successfully

    if (!response.ok) { // Check if the HTTP response status is OK (e.g., 200)
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json() // Parse the JSON response
    return data.data || data // Return the actual data, sometimes nested under a 'data' property
  } catch (error) {
    clearTimeout(timeoutId) // Clear timeout even if there's an error
    throw error // Re-throw the error for the caller to handle
  }
}

// Enhanced search with original song prioritization: Tries multiple API endpoints and filters/sorts results.
export async function searchAll(query: string): Promise<SearchResults> {
  if (!query?.trim()) {
    return { songs: { data: [], total: 0 } } // Return empty results if query is empty
  }

  let allSongs: SaavnSong[] = []

  // Iterate through available API endpoints
  for (const baseUrl of API_ENDPOINTS) {
    // Define different search paths for the current base URL
    const searchEndpoints = [
      `/search/songs?query=${encodeURIComponent(query)}&page=1&limit=50`,
      `/search?query=${encodeURIComponent(query)}&type=song&limit=50`,
    ]

    // Try each search endpoint for the current base URL
    for (const endpoint of searchEndpoints) {
      try {
        const result = await apiRequest<any>(endpoint, baseUrl) // Make the API request

        let songs: SaavnSong[] = []
        // Handle different response structures from the APIs
        if (result?.data?.results) {
          songs = result.data.results
        } else if (result?.results) {
          songs = result.results
        } else if (Array.isArray(result)) {
          songs = result
        }

        if (songs.length > 0) {
          allSongs = [...allSongs, ...songs] // Add fetched songs to the overall list
          break // If we got results from this endpoint, move to the next base URL
        }
      } catch (error) {
        continue // If an API call fails, try the next endpoint/base URL
      }
    }
  }

  // Remove duplicate songs (based on ID) and then filter and sort them by quality
  const uniqueSongs = allSongs.filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))
  const filteredSongs = filterAndSortSongs(uniqueSongs)

  // If good original songs are found, return the top 30
  if (filteredSongs.length > 0) {
    return {
      songs: {
        data: filteredSongs.slice(0, 30),
        total: filteredSongs.length,
      },
    }
  }

  // Fallback: If no real API results are found, return curated (mock) original songs
  // that match the search query.
  const mockResults = getCuratedOriginalSongs().filter((song) => {
    const searchTerm = query.toLowerCase()
    return (
      song.name.toLowerCase().includes(searchTerm) ||
      song.primaryArtists.toLowerCase().includes(searchTerm) ||
      song.album.name.toLowerCase().includes(searchTerm)
    )
  })

  return {
    songs: {
      data: mockResults,
      total: mockResults.length,
    },
  }
}

// Get trending with original song priority: Returns curated songs immediately, then fetches real trending in background.
export async function getTrendingSongs(): Promise<SaavnSong[]> {
  // Start with curated original songs for immediate display to the user
  const curatedSongs = getCuratedOriginalSongs()

  // Try to fetch real trending data in the background after a short delay
  // This allows the UI to render quickly with curated data while real data loads.
  setTimeout(async () => {
    try {
      // Example trending queries to get diverse trending songs
      const trendingQueries = [
        "arijit singh latest 2024",
        "bollywood hits original",
        "shreya ghoshal new songs",
        "trending hindi original",
      ]

      for (const query of trendingQueries) {
        try {
          const results = await searchAll(query) // Use the searchAll function
          if (results.songs?.data && results.songs.data.length > 0) {
            // Merge fetched results with curated songs, ensuring uniqueness
            const combinedSongs = [...results.songs.data, ...curatedSongs]
            const uniqueSongs = combinedSongs.filter(
              (song, index, self) => index === self.findIndex((s) => s.id === song.id),
            )
            // In a real app, you would use React state (e.g., `setTrendingSongs`)
            // in your component to update the UI with these loaded songs.
            filterAndSortSongs(uniqueSongs).slice(0, 20)
          }
        } catch (error) {
          continue // If one query fails, try the next one
        }
      }
    } catch (error) {
      // Catch any unexpected errors during background fetching, but don't break the app.
      console.error("Error during background trending fetch:", error);
    }
  }, 100); // A small delay (100ms)

  return curatedSongs // Return curated songs immediately
}

// Curated original songs with authentic thumbnails: Hardcoded list for fallback/initial display.
function getCuratedOriginalSongs(): SaavnSong[] {
  return [
    {
      id: "kesariya_original_2022",
      name: "Kesariya",
      type: "song",
      album: { id: "brahmastra", name: "Brahmastra", url: "" },
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
      copyright: "© 2022 Sony Music Entertainment India Pvt. Ltd.",
      image: [
        { quality: "50x50", link: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220717092820-50x50.jpg" },
        { quality: "150x150", link: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220717092820-150x150.jpg" },
        { quality: "500x500", link: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220717092820-500x500.jpg" },
      ],
      downloadUrl: [{ quality: "320kbps", link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }],
      isOriginal: true,
      priority: 95,
    },
    {
      id: "tum_hi_ho_original_2013",
      name: "Tum Hi Ho",
      type: "song",
      album: { id: "aashiqui2", name: "Aashiqui 2", url: "" },
      year: "2013",
      releaseDate: "2013-04-26",
      duration: "262",
      label: "T-Series",
      primaryArtists: "Arijit Singh",
      primaryArtistsId: "459320",
      featuredArtists: "",
      featuredArtistsId: "",
      explicitContent: 0,
      playCount: "200000000",
      language: "hindi",
      hasLyrics: "true",
      url: "",
      copyright: "© 2013 Super Cassettes Industries Private Limited",
      image: [
        { quality: "50x50", link: "https://c.saavncdn.com/427/Aashiqui-2-Hindi-2013-50x50.jpg" },
        { quality: "150x150", link: "https://c.saavncdn.com/427/Aashiqui-2-Hindi-2013-150x150.jpg" },
        { quality: "500x500", link: "https://c.saavncdn.com/427/Aashiqui-2-Hindi-2013-500x500.jpg" },
      ],
      downloadUrl: [{ quality: "320kbps", link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }],
      isOriginal: true,
      priority: 98,
    },
    {
      id: "channa_mereya_original_2016",
      name: "Channa Mereya",
      type: "song",
      album: { id: "adhm", name: "Ae Dil Hai Mushkil", url: "" },
      year: "2016",
      releaseDate: "2016-10-28",
      duration: "290",
      label: "Sony Music",
      primaryArtists: "Arijit Singh",
      primaryArtistsId: "459320",
      featuredArtists: "",
      featuredArtistsId: "",
      explicitContent: 0,
      playCount: "180000000",
      language: "hindi",
      hasLyrics: "true",
      url: "",
      copyright: "© 2016 Sony Music Entertainment India Pvt. Ltd.",
      image: [
        { quality: "50x50", link: "https://c.saavncdn.com/427/Ae-Dil-Hai-Mushkil-Hindi-2016-50x50.jpg" },
        { quality: "150x150", link: "https://c.saavncdn.com/427/Ae-Dil-Hai-Mushkil-Hindi-2016-150x150.jpg" },
        { quality: "500x500", link: "https://c.saavncdn.com/427/Ae-Dil-Hai-Mushkil-Hindi-2016-500x500.jpg" },
      ],
      downloadUrl: [{ quality: "320kbps", link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }],
      isOriginal: true,
      priority: 92,
    },
    {
      id: "raabta_original_2012",
      name: "Raabta",
      type: "song",
      album: { id: "agent_vinod", name: "Agent Vinod", url: "" },
      year: "2012",
      releaseDate: "2012-03-23",
      duration: "240",
      label: "T-Series",
      primaryArtists: "Arijit Singh",
      primaryArtistsId: "459320",
      featuredArtists: "",
      featuredArtistsId: "",
      explicitContent: 0,
      playCount: "150000000",
      language: "hindi",
      hasLyrics: "true",
      url: "",
      copyright: "© 2012 Super Cassettes Industries Private Limited",
      image: [
        { quality: "50x50", link: "https://c.saavncdn.com/427/Agent-Vinod-Hindi-2012-50x50.jpg" },
        { quality: "150x150", link: "https://c.saavncdn.com/427/Agent-Vinod-Hindi-2012-150x150.jpg" },
        { quality: "500x500", link: "https://c.saavncdn.com/427/Agent-Vinod-Hindi-2012-500x500.jpg" },
      ],
      downloadUrl: [{ quality: "320kbps", link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" }],
      isOriginal: true,
      priority: 88,
    },
    {
      id: "hawayein_original_2017",
      name: "Hawayein",
      type: "song",
      album: { id: "jhms", name: "Jab Harry Met Sejal", url: "" },
      year: "2017",
      releaseDate: "2017-08-04",
      duration: "278",
      label: "Sony Music",
      primaryArtists: "Arijit Singh",
      primaryArtistsId: "459320",
      featuredArtists: "",
      featuredArtistsId: "",
      explicitContent: 0,
      playCount: "160000000",
      language: "hindi",
      hasLyrics: "true",
      url: "",
      copyright: "© 2017 Sony Music Entertainment India Pvt. Ltd.",
      image: [
        { quality: "50x50", link: "https://c.saavncdn.com/427/Jab-Harry-Met-Sejal-Hindi-2017-50x50.jpg" },
        { quality: "150x150", link: "https://c.saavncdn.com/427/Jab-Harry-Met-Sejal-Hindi-2017-150x150.jpg" },
        { quality: "500x500", link: "https://c.saavncdn.com/427/Jab-Harry-Met-Sejal-Hindi-2017-500x500.jpg" },
      ],
      downloadUrl: [{ quality: "320kbps", link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" }],
      isOriginal: true,
      priority: 90,
    },
    {
      id: "apna_bana_le_original_2022",
      name: "Apna Bana Le",
      type: "song",
      album: { id: "bhediya", name: "Bhediya", url: "" },
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
      copyright: "© 2022 Super Cassettes Industries Private Limited",
      image: [
        { quality: "50x50", link: "https://c.saavncdn.com/343/Bhediya-Hindi-2022-20221017151007-50x50.jpg" },
        { quality: "150x150", link: "https://c.saavncdn.com/343/Bhediya-Hindi-2022-20221017151007-150x150.jpg" },
        { quality: "500x500", link: "https://c.saavncdn.com/343/Bhediya-Hindi-2022-20221017151007-500x500.jpg" },
      ],
      downloadUrl: [{ quality: "320kbps", link: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" }],
      isOriginal: true,
      priority: 85,
    },
  ]
}

// Utility functions for getting specific quality images and audio links, and formatting duration.
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


// --- React Component ---
// This is your main React component that integrates the API logic and UI.
const JioSaavnApp: React.FC = () => {
  // State variables to manage the component's data and UI.
  const [searchTerm, setSearchTerm] = useState<string>(''); // Stores the current search query.
  const [songs, setSongs] = useState<SaavnSong[]>([]); // Stores the list of songs to display (search results).
  const [trendingSongs, setTrendingSongs] = useState<SaavnSong[]>([]); // Stores the list of trending songs.
  const [loading, setLoading] = useState<boolean>(false); // Indicates if an API call is in progress.
  const [error, setError] = useState<string | null>(null); // Stores any error messages.
  const [selectedSong, setSelectedSong] = useState<SaavnSong | null>(null); // Stores the song clicked by the user for details.

  // useEffect hook to fetch trending songs when the component first mounts.
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Call the getTrendingSongs function (defined in this same file).
        const fetchedTrending = await getTrendingSongs();
        setTrendingSongs(fetchedTrending); // Update the state with trending songs.
      } catch (err) {
        console.error('Error fetching trending songs:', err);
        // Errors from getTrendingSongs are often silently handled because of the fallback.
      }
    };
    fetchTrending(); // Execute the function to fetch trending songs.
  }, []); // Empty dependency array means this effect runs only once after initial render.

  // Handles the search form submission.
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload).
    if (!searchTerm.trim()) { // If the search term is empty or just whitespace.
      setSongs([]); // Clear existing songs.
      return; // Do nothing further.
    }

    setLoading(true); // Set loading to true to show a loading indicator.
    setError(null); // Clear any previous error messages.
    setSongs([]); // Clear previous search results.
    setSelectedSong(null); // Clear any previously selected song details.

    try {
      // Call the searchAll function (defined in this same file) with the search term.
      const results = await searchAll(searchTerm);
    
