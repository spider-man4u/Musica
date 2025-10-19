"use client"

export interface ModernSong {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number
  image?: string
  download_url?: string
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

// Local sample data - primary fallback with WORKING audio URLs
const SAMPLE_SONGS: ModernSong[] = [
  {
    id: "1",
    title: "Kesariya",
    artist: "Arijit Singh",
    album: "Brahmastra",
    duration: 268,
    image: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220825141240-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 95,
  },
  {
    id: "2",
    title: "Chaleya",
    artist: "Arijit Singh, Shilpa Rao",
    album: "Jawan",
    duration: 230,
    image: "https://c.saavncdn.com/807/Jawan-Hindi-2023-20230921140620-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 92,
  },
  {
    id: "3",
    title: "Heeriye",
    artist: "Arijit Singh, Jasleen Royal",
    album: "Heeriye",
    duration: 210,
    image: "https://c.saavncdn.com/734/Heeriye-Hindi-2023-20230731051001-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["indie", "romantic"],
    popularity: 88,
  },
  {
    id: "4",
    title: "Raatan Lambiyan",
    artist: "Jubin Nautiyal, Asees Kaur",
    album: "Shershaah",
    duration: 282,
    image: "https://c.saavncdn.com/807/Shershaah-Hindi-2021-20210815143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "patriotic"],
    popularity: 90,
  },
  {
    id: "5",
    title: "Tum Hi Ho",
    artist: "Arijit Singh",
    album: "Aashiqui 2",
    duration: 242,
    image: "https://c.saavncdn.com/288/Aashiqui-2-Hindi-2013-20130429144005-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 96,
  },
  {
    id: "6",
    title: "Tera Ban Jaunga",
    artist: "Akhil Sachdeva, Tulsi Kumar",
    album: "Kabir Singh",
    duration: 224,
    image: "https://c.saavncdn.com/807/Kabir-Singh-Hindi-2019-20190621140620-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 94,
  },
  {
    id: "7",
    title: "Dil Mera Todh Ke",
    artist: "Neha Kakkar, Yasser Desai",
    album: "Hate Story 4",
    duration: 198,
    image: "https://c.saavncdn.com/807/Hate-Story-4-Hindi-2018-20180321143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "sad"],
    popularity: 82,
  },
  {
    id: "8",
    title: "Mere Liye Tum Kaafi Ho",
    artist: "Mukesh Chandra",
    album: "Meri Pyaari Bindu",
    duration: 201,
    image: "https://c.saavncdn.com/807/Meri-Pyaari-Bindu-Hindi-2017-20170609143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["indie", "romantic"],
    popularity: 85,
  },
  {
    id: "9",
    title: "Baarish Ban Jaana",
    artist: "Jubin Nautiyal, Prakriti Kakar",
    album: "Half Girlfriend",
    duration: 216,
    image: "https://c.saavncdn.com/807/Half-Girlfriend-Hindi-2017-20170619143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 87,
  },
  {
    id: "10",
    title: "Aisa Kabhi Hua Nahi",
    artist: "Jubin Nautiyal",
    album: "Gulaab Gang",
    duration: 237,
    image: "https://c.saavncdn.com/807/Gulaab-Gang-Hindi-2016-20160212143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 84,
  },
  {
    id: "11",
    title: "Dilbaro",
    artist: "Harshdeep Kaur",
    album: "Raazi",
    duration: 212,
    image: "https://c.saavncdn.com/807/Raazi-Hindi-2018-20180629143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "patriotic"],
    popularity: 89,
  },
  {
    id: "12",
    title: "Gallan Goodiyaan",
    artist: "Arijit Singh, Varun Grover",
    album: "Dil Dhadakne Do",
    duration: 245,
    image: "https://c.saavncdn.com/807/Dil-Dhadakne-Do-Hindi-2015-20150605143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 91,
  },
  {
    id: "13",
    title: "Samjhawan",
    artist: "Arijit Singh, Shreya Ghoshal",
    album: "Humpty Sharma Ki Dulhania",
    duration: 256,
    image: "https://c.saavncdn.com/807/Humpty-Sharma-Ki-Dulhania-Hindi-2014-20140907143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 93,
  },
  {
    id: "14",
    title: "Chiggy Wiggy",
    artist: "Honey Singh",
    album: "Teri Meri Kahani",
    duration: 232,
    image: "https://c.saavncdn.com/807/Teri-Meri-Kahani-Hindi-2012-20120524143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "upbeat"],
    popularity: 80,
  },
  {
    id: "15",
    title: "Pehli Nazar Mein",
    artist: "Atif Aslam, Shreya Ghoshal",
    album: "Race",
    duration: 218,
    image: "https://c.saavncdn.com/807/Race-Hindi-2008-20080619143820-500x500.jpg",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    language: "hindi",
    quality: "320kbps",
    genres: ["bollywood", "romantic"],
    popularity: 86,
  },
]

// Music API implementations
class LastFmAPI {
  private apiKey = "fake_key" // Last.fm would need a real key
  private baseUrl = "https://ws.audioscrobbler.com/2.0"

  async search(query: string): Promise<ModernSong[]> {
    try {
      console.log(`🎵 [Last.fm] Searching: ${query}`)
      // Last.fm requires API key - skipping in demo
      return []
    } catch (error) {
      console.error("[Last.fm-Search]", error)
      return []
    }
  }

  async getTrending(): Promise<ModernSong[]> {
    try {
      console.log(`📈 [Last.fm] Fetching trending`)
      return []
    } catch (error) {
      console.error("[Last.fm-Trending]", error)
      return []
    }
  }
}

class JioSaavnAPI {
  private baseUrl = "https://saavn.sumit.co/api"

  async search(query: string, page = 0, limit = 20): Promise<any[]> {
    try {
      console.log(`🔍 [JioSaavn] Searching: ${query}`)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const url = `${this.baseUrl}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      const response = await fetch(url, { signal: controller.signal })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`⚠️ [JioSaavn] HTTP ${response.status}`)
        return []
      }

      const data = await response.json()
      console.log(`✅ [JioSaavn] Found results`)
      return data.data?.results || []
    } catch (error) {
      console.error("[JioSaavn-Search]", error instanceof Error ? error.message : error)
      return []
    }
  }

  async getTrending(): Promise<any[]> {
    try {
      console.log(`📈 [JioSaavn] Fetching trending`)
      const queries = ["trending hindi songs", "top songs", "popular", "bollywood hits"]

      for (const q of queries) {
        const results = await this.search(q, 0, 50)
        if (results.length > 0) {
          console.log(`✅ [JioSaavn] Got ${results.length} trending from '${q}'`)
          return results
        }
      }

      console.warn(`⚠️ [JioSaavn] No trending results found`)
      return []
    } catch (error) {
      console.error("[JioSaavn-Trending]", error)
      return []
    }
  }

  transformSong(song: any): ModernSong | null {
    if (!song || !song.id) return null

    try {
      // Priority: downloadUrl > preview_url > url
      const audioUrl = song.downloadUrl || song.download_url || song.preview_url || song.url

      if (!audioUrl) {
        console.warn("⚠️ No audio URL for song:", song.name)
      }

      return {
        id: song.id,
        title: sanitizeString(song.name || song.title) || "Unknown Song",
        artist: sanitizeString(song.primaryArtists || song.artist) || "Unknown Artist",
        album: sanitizeString(song.album?.name || song.album) || "Unknown Album",
        duration: typeof song.duration === "number" ? song.duration : Number.parseInt(song.duration) || 0,
        image: song.image || song.albumArt || "/musica-logo.png",
        download_url: audioUrl || "",
        audio: audioUrl || "",
        external_urls: {
          saavn: song.url || song.permaUrl,
        },
        language: song.language || "hindi",
        quality: song.quality || "320kbps",
        genres: song.language ? [song.language] : ["bollywood"],
        popularity: Math.floor(Math.random() * 100),
      }
    } catch (error) {
      console.error("Transform error:", error)
      return null
    }
  }
}

class MusicService {
  private jioSaavn = new JioSaavnAPI()
  private lastFm = new LastFmAPI()

  async search(query: string): Promise<ModernSong[]> {
    if (!query?.trim()) return []

    console.log(`🔍 Searching for: "${query}"`)

    // Try JioSaavn first
    try {
      const results = await this.jioSaavn.search(query.trim(), 0, 50)
      const transformed = results.map((s) => this.jioSaavn.transformSong(s)).filter((s): s is ModernSong => s !== null)

      if (transformed.length > 0) {
        console.log(`✅ Found ${transformed.length} songs from API`)
        return transformed
      }
    } catch (error) {
      console.error("API search failed:", error)
    }

    // Fallback to local search
    console.log(`📦 Using local sample data`)
    const searchTerm = query.toLowerCase()
    const local = SAMPLE_SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(searchTerm) ||
        s.artist.toLowerCase().includes(searchTerm) ||
        s.album?.toLowerCase().includes(searchTerm) ||
        s.genres?.some((g) => g.toLowerCase().includes(searchTerm)),
    )

    return local.length > 0 ? local : SAMPLE_SONGS.slice(0, 10)
  }

  async getTrending(): Promise<ModernSong[]> {
    console.log(`📈 Fetching trending`)

    // Try JioSaavn first
    try {
      const results = await this.jioSaavn.getTrending()
      const transformed = results.map((s) => this.jioSaavn.transformSong(s)).filter((s): s is ModernSong => s !== null)

      if (transformed.length > 0) {
        console.log(`✅ Got ${transformed.length} trending from API`)
        return transformed
      }
    } catch (error) {
      console.error("API trending failed:", error)
    }

    // Fallback to local with shuffle
    console.log(`📦 Using local trending data`)
    const shuffled = [...SAMPLE_SONGS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 20)
  }

  async getSongDetails(songId: string): Promise<ModernSong | null> {
    const local = SAMPLE_SONGS.find((s) => s.id === songId)
    return local || null
  }

  async getPlaylistSuggestions(): Promise<PlaylistSuggestion[]> {
    return [
      {
        id: "pl-1",
        name: "Trending Now",
        description: "Most popular songs",
        image: "/musica-logo.png",
        songCount: 50,
      },
      {
        id: "pl-2",
        name: "Romantic Vibes",
        description: "Love songs",
        image: "/musica-logo.png",
        songCount: 75,
      },
      {
        id: "pl-3",
        name: "Indie Gems",
        description: "Independent artists",
        image: "/musica-logo.png",
        songCount: 60,
      },
      {
        id: "pl-4",
        name: "Bollywood Classics",
        description: "Timeless hits",
        image: "/musica-logo.png",
        songCount: 120,
      },
    ]
  }

  async getSongSuggestions(songId: string): Promise<ModernSong[]> {
    try {
      const suggestions = [...SAMPLE_SONGS].sort(() => Math.random() - 0.5).slice(0, 10)
      return { success: true, data: suggestions }
    } catch (error) {
      console.error("Song suggestions error:", error)
      return { success: false, data: [] }
    }
  }
}

const service = new MusicService()

export async function searchMusic(query: string) {
  try {
    const results = await service.search(query)
    return { success: true, data: { results } }
  } catch (error) {
    console.error("Search error:", error)
    return { success: false, data: { results: [] } }
  }
}

export async function getTrendingMusic() {
  try {
    const trending = await service.getTrending()
    return { success: true, data: { trending } }
  } catch (error) {
    console.error("Trending error:", error)
    return { success: false, data: { trending: SAMPLE_SONGS } }
  }
}

export async function getSongDetails(songId: string) {
  try {
    const song = await service.getSongDetails(songId)
    return { success: !!song, data: song }
  } catch (error) {
    console.error("Song details error:", error)
    return { success: false, data: null }
  }
}

export async function getPlaylistSuggestions(query = "Indie") {
  try {
    const playlists = await service.getPlaylistSuggestions()
    return { success: true, data: playlists }
  } catch (error) {
    console.error("Playlist suggestions error:", error)
    return { success: false, data: [] }
  }
}

export async function getSongSuggestions(songId: string) {
  try {
    const suggestions = await service.getSongSuggestions(songId)
    return suggestions
  } catch (error) {
    console.error("Song suggestions error:", error)
    return { success: false, data: [] }
  }
}

export { sanitizeString }
export type { ModernSong, PlaylistSuggestion }
