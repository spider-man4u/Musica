import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  searchMusic,
  getTrendingMusic,
  getSongDetails,
  checkApiHealth,
  sanitizeString,
  type ModernSong,
} from "./modernMusicApi"
import { syncUserData, loadUserData } from "./supabase"

export interface Song {
  id: string
  title: string
  artist: string
  album: string
  image: string
  audio: string
  duration: number
  language?: string
  year?: string
  playCount?: string
  explicit?: boolean
  url?: string
  hasLyrics?: boolean
  label?: string
  quality?: string
  download_url?: string
  genre?: string
  mood?: string
  energy?: number
  danceability?: number
  valence?: number
}

export interface SearchResults {
  songs?: {
    data: Song[]
    total: number
  }
}

export interface Playlist {
  id: string
  name: string
  description: string
  image: string
  songs: Song[]
  createdAt: string
  isPublic: boolean
}

export interface Artist {
  id: string
  name: string
  image: string
  bio: string
  followers: number
  verified: boolean
  genres: string[]
  topSongs: Song[]
  albums: any[]
  monthlyListeners: number
}

export interface UserData {
  id: string
  name: string
  email: string
  avatar: string
  theme: "light" | "dark"
  recentSearches: string[]
  recentlyPlayed: Song[]
  favorites: Song[]
  downloads: Song[]
  playlists: Playlist[]
  aiSuggestions: Song[]
  listeningHistory: {
    songId: string
    timestamp: number
    duration: number
  }[]
  settings: {
    notifications: boolean
    quality: "high" | "medium" | "low"
    downloadEnabled: boolean
    language: string
    autoplay: boolean
    crossfade: boolean
    aiShuffle: boolean
    aiSuggestions: boolean
  }
}

interface AppState {
  // Player state
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: "off" | "one" | "all"
  queue: Song[]
  queueIndex: number
  originalQueue: Song[]

  // Data state
  userData: UserData
  searchHistory: string[]
  searchResults: SearchResults | null
  trendingSongs: Song[]
  searchQuery: string
  curatedPlaylists: Playlist[]
  recommendations: Song[]
  artists: Artist[]

  // UI state
  isLoading: boolean
  error: string | null
  apiStatus: "unknown" | "healthy" | "unhealthy" | "limited"
  workingApis: string[]
  lastApiCheck: number
  syncStatus: "idle" | "syncing" | "synced" | "error"
  currentUserId: string | null

  // Actions
  setCurrentSong: (song: Song | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  setRepeatMode: (mode: "off" | "one" | "all") => void
  playNext: () => void
  playPrevious: () => void
  setQueue: (songs: Song[], startIndex?: number) => void
  addToQueue: (song: Song) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  playSong: (song: Song, playlist?: Song[]) => void
  searchContent: (query: string) => Promise<void>
  fetchTrendingSongs: () => Promise<void>
  fetchSongDetails: (songId: string) => Promise<Song | null>
  addToFavorites: (song: Song) => void
  removeFromFavorites: (songId: string) => void
  addToDownloads: (song: Song) => void
  removeFromDownloads: (songId: string) => void
  addToRecentlyPlayed: (song: Song) => void
  updateUserProfile: (data: Partial<UserData>) => void
  updateUserSettings: (settings: Partial<UserData["settings"]>) => void
  createPlaylist: (name: string, description?: string) => Playlist
  addToPlaylist: (playlistId: string, song: Song) => void
  removeFromPlaylist: (playlistId: string, songId: string) => void
  deletePlaylist: (playlistId: string) => void
  generateRecommendations: (baseSong: Song) => Promise<Song[]>
  generateAISuggestions: (baseSong: Song) => Promise<Song[]>
  addToListeningHistory: (songId: string, duration: number) => void
  getPersonalizedRecommendations: () => Song[]
  getArtistById: (artistId: string) => Artist | null
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  checkApiStatus: () => Promise<void>
  retryConnection: () => Promise<void>
  syncToCloud: () => Promise<void>
  loadFromCloud: () => Promise<void>
  setSyncStatus: (status: "idle" | "syncing" | "synced" | "error") => void
  setCurrentUserId: (userId: string | null) => void
}

// Enhanced helper functions
const getValidImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return "/placeholder.svg?height=300&width=300"
  }
  return imageUrl.trim()
}

const getValidAudioUrl = (audioUrl: string | undefined | null): string => {
  if (!audioUrl || typeof audioUrl !== "string" || audioUrl.trim() === "") {
    return ""
  }
  return audioUrl.trim()
}

// Enhanced conversion with AI features
const convertModernSongToSong = (modernSong: ModernSong): Song => {
  const audioUrl = getValidAudioUrl(modernSong.download_url || modernSong.preview_url)

  return {
    id: modernSong.id || `song-${Date.now()}-${Math.random()}`,
    title: sanitizeString(modernSong.title) || "Unknown Song",
    artist: sanitizeString(modernSong.artist) || "Unknown Artist",
    album: sanitizeString(modernSong.album) || "Unknown Album",
    image: getValidImageUrl(modernSong.image),
    audio: audioUrl,
    download_url: audioUrl,
    duration: modernSong.duration || 0,
    language: modernSong.language || "unknown",
    year: modernSong.release_date?.split("-")[0] || "",
    playCount: "0",
    explicit: modernSong.explicit || false,
    url: modernSong.external_urls?.saavn || modernSong.external_urls?.spotify || "",
    hasLyrics: true,
    label: modernSong.label || "",
    quality: modernSong.quality || "160kbps",
    genre: modernSong.genres?.[0] || "unknown",
    mood: inferMoodFromTitle(modernSong.title || ""),
    energy: Math.random() * 100,
    danceability: Math.random() * 100,
    valence: Math.random() * 100,
  }
}

// AI helper functions
const inferMoodFromTitle = (title: string): string => {
  const moodKeywords = {
    happy: ["happy", "joy", "celebration", "party", "dance", "upbeat"],
    sad: ["sad", "cry", "tears", "broken", "lonely", "miss"],
    romantic: ["love", "heart", "romance", "kiss", "together", "forever"],
    energetic: ["energy", "power", "strong", "fight", "rock", "metal"],
    calm: ["calm", "peace", "relax", "soft", "gentle", "quiet"],
  }

  const titleLower = title.toLowerCase()

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some((keyword) => titleLower.includes(keyword))) {
      return mood
    }
  }

  return "neutral"
}

const calculateSimilarity = (song1: Song, song2: Song): number => {
  let similarity = 0

  // Artist similarity (highest weight)
  if (song1.artist.toLowerCase() === song2.artist.toLowerCase()) {
    similarity += 40
  } else if (
    song1.artist.toLowerCase().includes(song2.artist.toLowerCase()) ||
    song2.artist.toLowerCase().includes(song1.artist.toLowerCase())
  ) {
    similarity += 20
  }

  // Genre similarity
  if (song1.genre === song2.genre) {
    similarity += 20
  }

  // Mood similarity
  if (song1.mood === song2.mood) {
    similarity += 15
  }

  // Language similarity
  if (song1.language === song2.language) {
    similarity += 10
  }

  // Year similarity (within 5 years)
  const year1 = Number.parseInt(song1.year || "0")
  const year2 = Number.parseInt(song2.year || "0")
  if (Math.abs(year1 - year2) <= 5) {
    similarity += 10
  }

  // Audio features similarity
  if (song1.energy && song2.energy) {
    similarity += Math.max(0, 5 - Math.abs(song1.energy - song2.energy) / 20)
  }

  return similarity
}

// AI Shuffle algorithm
const aiShuffle = (songs: Song[], currentSong?: Song): Song[] => {
  if (!currentSong) return [...songs].sort(() => Math.random() - 0.5)

  // Calculate similarity scores for all songs
  const songsWithScores = songs.map((song) => ({
    song,
    similarity: calculateSimilarity(currentSong, song),
  }))

  // Sort by similarity and add some randomness
  songsWithScores.sort((a, b) => {
    const randomFactor = (Math.random() - 0.5) * 20 // Add randomness
    return b.similarity + randomFactor - (a.similarity + randomFactor)
  })

  return songsWithScores.map((item) => item.song)
}

const defaultUserData: UserData = {
  id: "1",
  name: "User",
  email: "user@example.com",
  avatar: "/placeholder.svg",
  theme: "dark",
  recentSearches: [],
  recentlyPlayed: [],
  favorites: [],
  downloads: [],
  playlists: [],
  aiSuggestions: [],
  listeningHistory: [],
  settings: {
    notifications: true,
    quality: "high",
    downloadEnabled: true,
    language: "hindi",
    autoplay: true,
    crossfade: false,
    aiShuffle: true,
    aiSuggestions: true,
  },
}

// Sample songs for curated playlists
const sampleSongs: Song[] = [
  {
    id: "sample-1",
    title: "Kesariya",
    artist: "Arijit Singh",
    album: "Brahmastra",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 240,
    language: "hindi",
    year: "2022",
    genre: "bollywood",
    mood: "romantic",
    energy: 60,
    danceability: 70,
    valence: 80,
  },
  {
    id: "sample-2",
    title: "Apna Bana Le",
    artist: "Arijit Singh",
    album: "Bhediya",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 220,
    language: "hindi",
    year: "2022",
    genre: "bollywood",
    mood: "romantic",
    energy: 65,
    danceability: 75,
    valence: 85,
  },
  {
    id: "sample-3",
    title: "Raataan Lambiyan",
    artist: "Tanishk Bagchi",
    album: "Shershaah",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 200,
    language: "hindi",
    year: "2021",
    genre: "bollywood",
    mood: "romantic",
    energy: 55,
    danceability: 60,
    valence: 75,
  },
  {
    id: "sample-4",
    title: "Dil Bechara",
    artist: "A.R. Rahman",
    album: "Dil Bechara",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: 260,
    language: "hindi",
    year: "2020",
    genre: "bollywood",
    mood: "sad",
    energy: 40,
    danceability: 30,
    valence: 30,
  },
  {
    id: "sample-5",
    title: "Calm Down",
    artist: "Rema",
    album: "Rave & Roses",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    duration: 180,
    language: "english",
    year: "2022",
    genre: "afrobeats",
    mood: "calm",
    energy: 70,
    danceability: 85,
    valence: 80,
  },
  {
    id: "sample-6",
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    duration: 167,
    language: "english",
    year: "2022",
    genre: "pop",
    mood: "happy",
    energy: 75,
    danceability: 80,
    valence: 85,
  },
  {
    id: "sample-7",
    title: "Believer",
    artist: "Imagine Dragons",
    album: "Evolve",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    duration: 204,
    language: "english",
    year: "2017",
    genre: "rock",
    mood: "energetic",
    energy: 90,
    danceability: 70,
    valence: 60,
  },
  {
    id: "sample-8",
    title: "Tum Hi Ho",
    artist: "Arijit Singh",
    album: "Aashiqui 2",
    image: "https://images.unsplash.com/photo-1470225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: 280,
    language: "hindi",
    year: "2013",
    genre: "bollywood",
    mood: "romantic",
    energy: 50,
    danceability: 40,
    valence: 70,
  },
  {
    id: "sample-9",
    title: "Tera Ban Jaunga",
    artist: "Akhil Sachdeva",
    album: "Kabir Singh",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    duration: 240,
    language: "hindi",
    year: "2019",
    genre: "bollywood",
    mood: "romantic",
    energy: 45,
    danceability: 35,
    valence: 75,
  },
  {
    id: "sample-10",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    duration: 200,
    language: "english",
    year: "2019",
    genre: "synthpop",
    mood: "energetic",
    energy: 85,
    danceability: 90,
    valence: 80,
  },
]

// Curated playlists with actual songs
const curatedPlaylists: Playlist[] = [
  {
    id: "curated-1",
    name: "Bollywood Hits 2024",
    description: "The biggest Bollywood songs of the year",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    songs: [sampleSongs[0], sampleSongs[1], sampleSongs[2], sampleSongs[3]],
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
  {
    id: "curated-2",
    name: "Chill Vibes",
    description: "Relaxing songs for any mood",
    image: "https://images.unsplash.com/photo-1470225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    songs: [sampleSongs[4], sampleSongs[5], sampleSongs[9]],
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
  {
    id: "curated-3",
    name: "Workout Motivation",
    description: "High-energy tracks to power your workout",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
    songs: [sampleSongs[6], sampleSongs[4], sampleSongs[9]],
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
  {
    id: "curated-4",
    name: "Love Songs",
    description: "Romantic melodies for special moments",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    songs: [sampleSongs[7], sampleSongs[8], sampleSongs[0]],
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
  {
    id: "curated-5",
    name: "90s Nostalgia",
    description: "Classic hits from the golden era",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    songs: [sampleSongs[7], sampleSongs[6]],
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.7,
      isMuted: false,
      isShuffled: false,
      repeatMode: "off",
      queue: [],
      queueIndex: 0,
      originalQueue: [],
      userData: defaultUserData,
      searchHistory: [],
      searchResults: null,
      trendingSongs: [],
      searchQuery: "",
      curatedPlaylists,
      recommendations: [],
      artists: [],
      isLoading: false,
      error: null,
      apiStatus: "unknown",
      workingApis: [],
      lastApiCheck: 0,
      syncStatus: "idle",
      currentUserId: null,

      // Enhanced player actions
      setCurrentSong: (song) => {
        console.log("🎵 Setting current song:", song?.title, "by", song?.artist)
        console.log("🎵 Audio URL:", song?.audio || song?.download_url)

        set({ currentSong: song })
        if (song) {
          get().addToRecentlyPlayed(song)
          get().addToListeningHistory(song.id, 0)
        }
      },
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => {
        const { volume, isMuted } = get()
        set({
          isMuted: !isMuted,
          volume: isMuted ? (volume === 0 ? 0.7 : volume) : 0,
        })
      },
      toggleShuffle: () => {
        const { isShuffled, queue, currentSong, userData } = get()
        const newShuffled = !isShuffled

        if (newShuffled) {
          // Apply AI shuffle if enabled
          const shuffledQueue = userData.settings.aiShuffle
            ? aiShuffle(queue, currentSong)
            : [...queue].sort(() => Math.random() - 0.5)
          set({ isShuffled: newShuffled, queue: shuffledQueue, queueIndex: 0 })
        } else {
          // Restore original order
          const { originalQueue } = get()
          set({ isShuffled: newShuffled, queue: originalQueue })
        }
      },
      setRepeatMode: (mode) => set({ repeatMode: mode }),

      // Enhanced queue management
      setQueue: (songs, startIndex = 0) => {
        console.log("🎵 Setting queue:", songs.length, "songs, starting at index:", startIndex)
        set({
          queue: songs,
          originalQueue: [...songs],
          queueIndex: startIndex,
        })
        if (songs[startIndex]) {
          get().setCurrentSong(songs[startIndex])
        }
      },

      addToQueue: (song) => {
        set((state) => ({
          queue: [...state.queue, song],
          originalQueue: [...state.originalQueue, song],
        }))
      },

      removeFromQueue: (index) => {
        set((state) => {
          const newQueue = state.queue.filter((_, i) => i !== index)
          const newOriginalQueue = state.originalQueue.filter((_, i) => i !== index)
          const newIndex = index < state.queueIndex ? state.queueIndex - 1 : state.queueIndex
          return {
            queue: newQueue,
            originalQueue: newOriginalQueue,
            queueIndex: Math.max(0, newIndex),
          }
        })
      },

      clearQueue: () => {
        set({
          queue: [],
          originalQueue: [],
          queueIndex: 0,
          currentSong: null,
          isPlaying: false,
        })
      },

      // Enhanced playSong function with AI suggestions
      playSong: (song, playlist) => {
        console.log("🎵 Playing song:", song.title, "with playlist:", playlist?.length || 0, "songs")

        if (playlist && playlist.length > 0) {
          const songIndex = playlist.findIndex((s) => s.id === song.id)
          get().setQueue(playlist, songIndex >= 0 ? songIndex : 0)
        } else {
          // If no playlist, create a single-song queue and generate AI suggestions
          get().setQueue([song], 0)
          if (get().userData.settings.aiSuggestions) {
            get().generateAISuggestions(song)
          }
        }

        get().setIsPlaying(true)
      },

      playNext: () => {
        const { queue, queueIndex, isShuffled, repeatMode, currentSong } = get()
        console.log("🎵 Playing next, queue length:", queue.length, "current index:", queueIndex)

        if (!Array.isArray(queue) || queue.length === 0) {
          console.log("🎵 No queue available")
          return
        }

        let nextIndex = queueIndex

        if (repeatMode === "one") {
          return
        } else if (isShuffled) {
          nextIndex = Math.floor(Math.random() * queue.length)
        } else {
          nextIndex = queueIndex + 1
          if (nextIndex >= queue.length) {
            if (repeatMode === "all") {
              nextIndex = 0
            } else {
              // End of queue - generate AI suggestions
              if (currentSong && get().userData.settings.aiSuggestions) {
                get().generateAISuggestions(currentSong)
              }
              console.log("🎵 End of queue reached")
              return
            }
          }
        }

        if (nextIndex < queue.length && queue[nextIndex]) {
          console.log("🎵 Playing next song:", queue[nextIndex].title)
          set({ queueIndex: nextIndex })
          get().setCurrentSong(queue[nextIndex])
        }
      },

      playPrevious: () => {
        const { queue, queueIndex } = get()
        if (!Array.isArray(queue) || queue.length === 0) return

        const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1
        if (queue[prevIndex]) {
          set({ queueIndex: prevIndex })
          get().setCurrentSong(queue[prevIndex])
        }
      },

      // Enhanced API integration with performance optimizations
      searchContent: async (query) => {
        if (!query?.trim()) {
          set({ searchResults: null, error: null })
          return
        }

        set({ isLoading: true, error: null, searchQuery: query })

        try {
          console.log(`🔍 Enhanced search for: ${query}`)
          const response = await searchMusic(query)

          if (
            response.success &&
            response.data.results &&
            Array.isArray(response.data.results) &&
            response.data.results.length > 0
          ) {
            const songs = response.data.results.map(convertModernSongToSong)

            // Generate recommendations based on search results
            const recommendations = songs.slice(0, 5)

            set({
              searchResults: {
                songs: {
                  data: songs,
                  total: songs.length,
                },
              },
              recommendations,
              error: null,
              apiStatus: "healthy",
            })

            get().addToSearchHistory(query)
            console.log(`✅ Enhanced search successful: ${songs.length} songs found`)
          } else {
            set({
              searchResults: {
                songs: {
                  data: [],
                  total: 0,
                },
              },
              error: "No songs found. Try different keywords.",
            })
          }
        } catch (error) {
          console.error("❌ Enhanced search error:", error)
          set({
            searchResults: {
              songs: {
                data: [],
                total: 0,
              },
            },
            error: "Search failed. Please check your internet connection and try again.",
            apiStatus: "unhealthy",
          })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchTrendingSongs: async () => {
        set({ isLoading: true, error: null })

        try {
          console.log("📈 Fetching enhanced trending songs...")
          const response = await getTrendingMusic()

          if (response.success && response.data.trending.length > 0) {
            const songs = response.data.trending.map(convertModernSongToSong)

            set({
              trendingSongs: songs,
              error: null,
              apiStatus: "healthy",
            })

            console.log(`✅ Successfully loaded ${songs.length} enhanced trending songs`)
          } else {
            set({
              trendingSongs: [],
              error: "No trending songs available. Please try again later.",
              apiStatus: "limited",
            })
          }
        } catch (error) {
          console.error("❌ Enhanced trending error:", error)
          set({
            trendingSongs: [],
            error: "Failed to load trending songs. Please check your connection.",
            apiStatus: "unhealthy",
          })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchSongDetails: async (songId: string) => {
        try {
          console.log(`🎵 Fetching song details for: ${songId}`)
          const response = await getSongDetails(songId)

          if (response.success && response.data) {
            const song = convertModernSongToSong(response.data)
            console.log(`✅ Song details fetched successfully`)
            return song
          }
        } catch (error) {
          console.error("❌ Fetch song details error:", error)
        }
        return null
      },

      // Enhanced user actions with cloud sync
      addToFavorites: (song) => {
        if (!song) return
        set((state) => {
          const currentFavorites = Array.isArray(state.userData?.favorites) ? state.userData.favorites : []
          const isAlreadyFavorite = currentFavorites.some((fav) => fav?.id === song.id)
          if (isAlreadyFavorite) return state
          return {
            userData: {
              ...state.userData,
              favorites: [...currentFavorites, song],
            },
          }
        })
        // Auto-sync to cloud
        get().syncToCloud()
      },

      removeFromFavorites: (songId) => {
        if (!songId) return
        set((state) => ({
          userData: {
            ...state.userData,
            favorites: Array.isArray(state.userData?.favorites)
              ? state.userData.favorites.filter((song) => song?.id !== songId)
              : [],
          },
        }))
        // Auto-sync to cloud
        get().syncToCloud()
      },

      addToDownloads: (song) => {
        if (!song) return
        set((state) => {
          const currentDownloads = Array.isArray(state.userData?.downloads) ? state.userData.downloads : []
          const isAlreadyDownloaded = currentDownloads.some((download) => download?.id === song.id)
          if (isAlreadyDownloaded) return state
          return {
            userData: {
              ...state.userData,
              downloads: [...currentDownloads, song],
            },
          }
        })
        // Auto-sync to cloud
        get().syncToCloud()
      },

      removeFromDownloads: (songId) => {
        if (!songId) return
        set((state) => ({
          userData: {
            ...state.userData,
            downloads: Array.isArray(state.userData?.downloads)
              ? state.userData.downloads.filter((song) => song?.id !== songId)
              : [],
          },
        }))
        // Auto-sync to cloud
        get().syncToCloud()
      },

      addToRecentlyPlayed: (song) => {
        if (!song) return
        set((state) => {
          const currentRecentlyPlayed = Array.isArray(state.userData?.recentlyPlayed)
            ? state.userData.recentlyPlayed
            : []
          const filteredRecent = currentRecentlyPlayed.filter((s) => s?.id !== song.id)
          return {
            userData: {
              ...state.userData,
              recentlyPlayed: [song, ...filteredRecent.slice(0, 19)],
            },
          }
        })
        // Auto-sync to cloud (debounced)
        setTimeout(() => get().syncToCloud(), 5000)
      },

      // Enhanced AI features
      addToListeningHistory: (songId, duration) => {
        set((state) => {
          const currentHistory = Array.isArray(state.userData?.listeningHistory) ? state.userData.listeningHistory : []

          return {
            userData: {
              ...state.userData,
              listeningHistory: [
                { songId, timestamp: Date.now(), duration },
                ...currentHistory.slice(0, 999), // Keep last 1000 entries
              ],
            },
          }
        })
      },

      generateAISuggestions: async (baseSong) => {
        if (!get().userData.settings.aiSuggestions) return []

        try {
          console.log("🤖 Generating AI suggestions for:", baseSong.title)

          const { trendingSongs, userData } = get()
          const allSongs = [...trendingSongs, ...userData.favorites, ...userData.recentlyPlayed]

          // Calculate similarity scores
          const suggestions = allSongs
            .filter((song) => song.id !== baseSong.id)
            .map((song) => ({
              song,
              similarity: calculateSimilarity(baseSong, song),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10)
            .map((item) => item.song)

          // Add to queue if enabled
          if (suggestions.length > 0) {
            const { queue } = get()
            const newQueue = [...queue, ...suggestions]
            set({ queue: newQueue, originalQueue: newQueue })

            // Update user's AI suggestions
            set((state) => ({
              userData: {
                ...state.userData,
                aiSuggestions: suggestions,
              },
            }))
          }

          console.log(`🤖 Generated ${suggestions.length} AI suggestions`)
          return suggestions
        } catch (error) {
          console.error("❌ AI suggestions error:", error)
          return []
        }
      },

      getPersonalizedRecommendations: () => {
        const { userData, trendingSongs } = get()

        if (!userData.listeningHistory.length) {
          return trendingSongs.slice(0, 10)
        }

        // Analyze listening patterns
        const genrePreferences: { [key: string]: number } = {}
        const artistPreferences: { [key: string]: number } = {}
        const moodPreferences: { [key: string]: number } = {}

        userData.listeningHistory.forEach((entry) => {
          const song = [...userData.favorites, ...userData.recentlyPlayed, ...trendingSongs].find(
            (s) => s.id === entry.songId,
          )

          if (song) {
            genrePreferences[song.genre || "unknown"] = (genrePreferences[song.genre || "unknown"] || 0) + 1
            artistPreferences[song.artist] = (artistPreferences[song.artist] || 0) + 1
            moodPreferences[song.mood || "neutral"] = (moodPreferences[song.mood || "neutral"] || 0) + 1
          }
        })

        // Generate recommendations based on preferences
        const recommendations = trendingSongs
          .filter((song) => !userData.favorites.some((fav) => fav.id === song.id))
          .map((song) => {
            let score = 0
            score += (genrePreferences[song.genre || "unknown"] || 0) * 3
            score += (artistPreferences[song.artist] || 0) * 5
            score += (moodPreferences[song.mood || "neutral"] || 0) * 2
            return { song, score }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 15)
          .map((item) => item.song)

        return recommendations
      },

      // Playlist management with cloud sync
      createPlaylist: (name, description = "") => {
        const newPlaylist: Playlist = {
          id: `playlist-${Date.now()}`,
          name,
          description,
          image: "/placeholder.svg?height=300&width=300",
          songs: [],
          createdAt: new Date().toISOString(),
          isPublic: false,
        }

        set((state) => ({
          userData: {
            ...state.userData,
            playlists: [...state.userData.playlists, newPlaylist],
          },
        }))

        // Auto-sync to cloud
        get().syncToCloud()
        return newPlaylist
      },

      addToPlaylist: (playlistId, song) => {
        set((state) => ({
          userData: {
            ...state.userData,
            playlists: state.userData.playlists.map((playlist) =>
              playlist.id === playlistId
                ? {
                    ...playlist,
                    songs: playlist.songs.some((s) => s.id === song.id) ? playlist.songs : [...playlist.songs, song],
                  }
                : playlist,
            ),
          },
        }))
        // Auto-sync to cloud
        get().syncToCloud()
      },

      removeFromPlaylist: (playlistId, songId) => {
        set((state) => ({
          userData: {
            ...state.userData,
            playlists: state.userData.playlists.map((playlist) =>
              playlist.id === playlistId
                ? {
                    ...playlist,
                    songs: playlist.songs.filter((song) => song.id !== songId),
                  }
                : playlist,
            ),
          },
        }))
        // Auto-sync to cloud
        get().syncToCloud()
      },

      deletePlaylist: (playlistId) => {
        set((state) => ({
          userData: {
            ...state.userData,
            playlists: state.userData.playlists.filter((playlist) => playlist.id !== playlistId),
          },
        }))
        // Auto-sync to cloud
        get().syncToCloud()
      },

      // Enhanced recommendations
      generateRecommendations: async (baseSong) => {
        try {
          const { trendingSongs, userData } = get()
          const allSongs = [...trendingSongs, ...userData.favorites]

          const recommendations = allSongs
            .filter((song) => song.id !== baseSong.id)
            .map((song) => ({
              song,
              similarity: calculateSimilarity(baseSong, song),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10)
            .map((item) => item.song)

          set({ recommendations })
          return recommendations
        } catch (error) {
          console.error("Failed to generate recommendations:", error)
          return []
        }
      },

      updateUserProfile: (data) => {
        set((state) => ({
          userData: { ...state.userData, ...data },
        }))
        // Auto-sync to cloud
        get().syncToCloud()
      },

      updateUserSettings: (settings) => {
        set((state) => ({
          userData: {
            ...state.userData,
            settings: { ...state.userData.settings, ...settings },
          },
        }))
        // Auto-sync to cloud
        get().syncToCloud()
      },

      // Cloud sync functions
      syncToCloud: async () => {
        const { currentUserId, userData, syncStatus } = get()

        if (!currentUserId || syncStatus === "syncing") return

        try {
          set({ syncStatus: "syncing" })
          const result = await syncUserData(currentUserId, userData)

          if (result.success) {
            set({ syncStatus: "synced" })
          } else {
            set({ syncStatus: "error" })
          }
        } catch (error) {
          console.error("Sync to cloud error:", error)
          set({ syncStatus: "error" })
        }
      },

      loadFromCloud: async () => {
        const { currentUserId } = get()

        if (!currentUserId) return

        try {
          set({ syncStatus: "syncing" })
          const result = await loadUserData(currentUserId)

          if (result.success && result.userData) {
            set({
              userData: result.userData,
              syncStatus: "synced",
            })
          } else {
            set({ syncStatus: "error" })
          }
        } catch (error) {
          console.error("Load from cloud error:", error)
          set({ syncStatus: "error" })
        }
      },

      setSyncStatus: (status) => set({ syncStatus: status }),
      setCurrentUserId: (userId) => set({ currentUserId: userId }),

      // UI actions
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      addToSearchHistory: (query) => {
        if (!query?.trim()) return
        set((state) => {
          const currentHistory = Array.isArray(state.searchHistory) ? state.searchHistory : []
          const filteredHistory = currentHistory.filter((q) => q !== query)
          return {
            searchHistory: [query, ...filteredHistory.slice(0, 9)],
          }
        })
      },

      clearSearchHistory: () => set({ searchHistory: [] }),

      checkApiStatus: async () => {
        const now = Date.now()
        const { lastApiCheck } = get()

        if (now - lastApiCheck < 10000) return

        set({ lastApiCheck: now })

        try {
          const health = await checkApiHealth()
          set({
            apiStatus: health.status === "healthy" ? "healthy" : health.status === "limited" ? "limited" : "unhealthy",
            workingApis: health.workingEndpoint ? [health.workingEndpoint] : [],
          })
          console.log(`🏥 Enhanced API Health: ${health.status} - ${health.message}`)
        } catch (error) {
          set({ apiStatus: "unhealthy", workingApis: [] })
          console.error("🏥 Enhanced API Health Check failed:", error)
        }
      },

      retryConnection: async () => {
        console.log("🔄 Retrying enhanced connection...")
        await get().checkApiStatus()

        const { searchQuery, trendingSongs } = get()

        if (searchQuery) {
          await get().searchContent(searchQuery)
        }

        if (trendingSongs.length === 0) {
          await get().fetchTrendingSongs()
        }
      },

      // Artist management
      getArtistById: (artistId) => {
        const { artists } = get()
        return artists.find((artist) => artist.id === artistId) || null
      },
    }),
    {
      name: "enhanced-music-store",
      partialize: (state) => ({
        userData: state.userData || defaultUserData,
        searchHistory: Array.isArray(state.searchHistory) ? state.searchHistory : [],
        volume: typeof state.volume === "number" ? state.volume : 0.7,
        isShuffled: Boolean(state.isShuffled),
        repeatMode: state.repeatMode || "off",
        queue: Array.isArray(state.queue) ? state.queue : [],
        originalQueue: Array.isArray(state.originalQueue) ? state.originalQueue : [],
        queueIndex: typeof state.queueIndex === "number" ? state.queueIndex : 0,
        curatedPlaylists: state.curatedPlaylists || curatedPlaylists,
        currentUserId: state.currentUserId,
        artists: state.artists || [],
      }),
    },
  ),
)
