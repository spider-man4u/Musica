import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  searchMusic,
  getTrendingMusic,
  checkApiHealth,
  getHighQualityImage,
  getHighQualityAudio,
  sanitizeString,
  type ModernSong,
} from "./modernMusicApi"

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
}

export interface SearchResults {
  songs?: {
    data: Song[]
    total: number
  }
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
  playlists: any[]
  settings: {
    notifications: boolean
    quality: "high" | "medium" | "low"
    downloadEnabled: boolean
    language: string
    autoplay: boolean
    crossfade: boolean
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

  // Data state
  userData: UserData
  searchHistory: string[]
  searchResults: SearchResults | null
  trendingSongs: Song[]
  searchQuery: string

  // UI state
  isLoading: boolean
  error: string | null
  apiStatus: "unknown" | "healthy" | "unhealthy"
  workingApis: string[]
  lastApiCheck: number

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
  searchContent: (query: string) => Promise<void>
  fetchTrendingSongs: () => Promise<void>
  addToFavorites: (song: Song) => void
  removeFromFavorites: (songId: string) => void
  addToRecentlyPlayed: (song: Song) => void
  updateUserProfile: (data: Partial<UserData>) => void
  updateUserSettings: (settings: Partial<UserData["settings"]>) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  checkApiStatus: () => Promise<void>
  retryConnection: () => Promise<void>
}

// Helper function to get a valid image URL
const getValidImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return "/placeholder.svg?height=300&width=300"
  }
  return imageUrl.trim()
}

// Helper function to get a valid audio URL
const getValidAudioUrl = (audioUrl: string | undefined | null): string => {
  if (!audioUrl || typeof audioUrl !== "string" || audioUrl.trim() === "") {
    return ""
  }
  return audioUrl.trim()
}

// Convert ModernSong to internal Song format
const convertModernSongToSong = (modernSong: ModernSong): Song => {
  return {
    id: modernSong.id || `song-${Date.now()}-${Math.random()}`,
    title: sanitizeString(modernSong.title) || "Unknown Song",
    artist: sanitizeString(modernSong.artist) || "Unknown Artist",
    album: sanitizeString(modernSong.album) || "Unknown Album",
    image: getValidImageUrl(getHighQualityImage(modernSong.image)),
    audio: getValidAudioUrl(getHighQualityAudio(modernSong.preview_url)),
    duration: modernSong.duration || 0,
    language: "unknown",
    year: modernSong.release_date?.split("-")[0] || "",
    playCount: "0",
    explicit: modernSong.explicit || false,
    url: modernSong.external_urls?.spotify || "",
    hasLyrics: false,
    label: "",
  }
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
  playlists: [],
  settings: {
    notifications: true,
    quality: "high",
    downloadEnabled: true,
    language: "hindi",
    autoplay: true,
    crossfade: false,
  },
}

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
      userData: defaultUserData,
      searchHistory: [],
      searchResults: null,
      trendingSongs: [],
      searchQuery: "",
      isLoading: false,
      error: null,
      apiStatus: "unknown",
      workingApis: [],
      lastApiCheck: 0,

      // Player actions
      setCurrentSong: (song) => {
        set({ currentSong: song })
        if (song) {
          get().addToRecentlyPlayed(song)
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
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
      setRepeatMode: (mode) => set({ repeatMode: mode }),

      playNext: () => {
        const { queue, queueIndex, isShuffled, repeatMode } = get()
        if (!Array.isArray(queue) || queue.length === 0) return

        let nextIndex = queueIndex

        if (repeatMode === "one") {
          return
        } else if (isShuffled) {
          nextIndex = Math.floor(Math.random() * queue.length)
        } else {
          nextIndex = queueIndex + 1
          if (nextIndex >= queue.length) {
            nextIndex = repeatMode === "all" ? 0 : queueIndex
          }
        }

        if (nextIndex < queue.length && queue[nextIndex]) {
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

      // Modern API integration
      searchContent: async (query) => {
        if (!query?.trim()) {
          set({ searchResults: null, error: null })
          return
        }

        set({ isLoading: true, error: null, searchQuery: query })

        try {
          console.log(`🔍 Modern search for: ${query}`)
          const response = await searchMusic(query)

          if (
            response.success &&
            response.data.results &&
            Array.isArray(response.data.results) &&
            response.data.results.length > 0
          ) {
            const songs = response.data.results.map(convertModernSongToSong)

            set({
              searchResults: {
                songs: {
                  data: songs,
                  total: songs.length,
                },
              },
              error: null,
              apiStatus: "healthy",
            })

            get().addToSearchHistory(query)
            console.log(`✅ Search successful: ${songs.length} songs found`)
          } else {
            set({
              searchResults: {
                songs: {
                  data: [],
                  total: 0,
                },
              },
              error: "No songs found. Try different keywords or check your connection.",
            })
          }
        } catch (error) {
          console.error("❌ Modern search error:", error)
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
          console.log("📈 Fetching modern trending songs...")
          const response = await getTrendingMusic()

          if (response.success && response.data.trending.length > 0) {
            const songs = response.data.trending.map(convertModernSongToSong)

            set({
              trendingSongs: songs,
              error: null,
              apiStatus: "healthy",
            })

            console.log(`✅ Successfully loaded ${songs.length} trending songs`)
          } else {
            set({
              trendingSongs: [],
              error: "No trending songs available. Please try again later.",
              apiStatus: "unhealthy",
            })
          }
        } catch (error) {
          console.error("❌ Modern trending error:", error)
          set({
            trendingSongs: [],
            error: "Failed to load trending songs. Please check your connection.",
            apiStatus: "unhealthy",
          })
        } finally {
          set({ isLoading: false })
        }
      },

      // User actions
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
      },

      updateUserProfile: (data) => {
        set((state) => ({
          userData: { ...state.userData, ...data },
        }))
      },

      updateUserSettings: (settings) => {
        set((state) => ({
          userData: {
            ...state.userData,
            settings: { ...state.userData.settings, ...settings },
          },
        }))
      },

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

        // Don't check too frequently
        if (now - lastApiCheck < 10000) return

        set({ lastApiCheck: now })

        try {
          const health = await checkApiHealth()
          set({
            apiStatus: health.status === "healthy" ? "healthy" : "unhealthy",
            workingApis: health.workingEndpoint ? [health.workingEndpoint] : [],
          })
          console.log(`🏥 Modern API Health: ${health.status} - ${health.message}`)
        } catch (error) {
          set({ apiStatus: "unhealthy", workingApis: [] })
          console.error("🏥 Modern API Health Check failed:", error)
        }
      },

      retryConnection: async () => {
        console.log("🔄 Retrying connection...")
        await get().checkApiStatus()

        const { searchQuery, trendingSongs } = get()

        // Retry last search
        if (searchQuery) {
          await get().searchContent(searchQuery)
        }

        // Retry trending if empty
        if (trendingSongs.length === 0) {
          await get().fetchTrendingSongs()
        }
      },
    }),
    {
      name: "modern-music-store",
      partialize: (state) => ({
        userData: state.userData || defaultUserData,
        searchHistory: Array.isArray(state.searchHistory) ? state.searchHistory : [],
        volume: typeof state.volume === "number" ? state.volume : 0.7,
        isShuffled: Boolean(state.isShuffled),
        repeatMode: state.repeatMode || "off",
      }),
    },
  ),
)
