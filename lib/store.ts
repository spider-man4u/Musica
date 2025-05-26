import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  searchAll,
  getTrendingSongs,
  getHighQualityImage,
  getHighQualityAudio,
  type SaavnSong,
  type SearchResults,
} from "./saavnApi"

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

  // Player actions
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

  // Data actions
  searchContent: (query: string) => Promise<void>
  fetchTrendingSongs: () => Promise<void>

  // User actions
  addToFavorites: (song: Song) => void
  removeFromFavorites: (songId: string) => void
  addToRecentlyPlayed: (song: Song) => void
  updateUserProfile: (data: Partial<UserData>) => void
  updateUserSettings: (settings: Partial<UserData["settings"]>) => void

  // UI actions
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
}

// Conversion functions
const convertSaavnSongToSong = (saavnSong: SaavnSong): Song => ({
  id: saavnSong.id,
  title: saavnSong.name,
  artist: saavnSong.primaryArtists,
  album: saavnSong.album.name,
  image: getHighQualityImage(saavnSong.image),
  audio: getHighQualityAudio(saavnSong.downloadUrl),
  duration: Number.parseInt(saavnSong.duration),
  language: saavnSong.language,
  year: saavnSong.year,
  playCount: saavnSong.playCount,
  explicit: saavnSong.explicitContent === 1,
  url: saavnSong.url,
})

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial player state
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

      // Initial data state
      userData: {
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
      },
      searchHistory: [],
      searchResults: null,
      trendingSongs: [],
      searchQuery: "",

      // Initial UI state
      isLoading: false,
      error: null,

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
        if (queue.length === 0) return

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

        if (nextIndex < queue.length) {
          set({ queueIndex: nextIndex })
          get().setCurrentSong(queue[nextIndex])
        }
      },

      playPrevious: () => {
        const { queue, queueIndex } = get()
        if (queue.length === 0) return

        const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1
        set({ queueIndex: prevIndex })
        get().setCurrentSong(queue[prevIndex])
      },

      // Data actions
      searchContent: async (query) => {
        if (!query.trim()) return

        set({ isLoading: true, error: null, searchQuery: query })

        try {
          const results = await searchAll(query)
          set({ searchResults: results })
          get().addToSearchHistory(query)
        } catch (error) {
          console.error("Search error:", error)
          set({
            error: error instanceof Error ? error.message : "Search failed. Please try again.",
            searchResults: null,
          })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchTrendingSongs: async () => {
        set({ isLoading: true, error: null })

        try {
          const songs = await getTrendingSongs()
          const convertedSongs = songs.map(convertSaavnSongToSong)
          set({ trendingSongs: convertedSongs })
        } catch (error) {
          console.error("Fetch trending error:", error)
          set({
            error:
              error instanceof Error ? error.message : "Failed to load trending songs. Please check your connection.",
            trendingSongs: [],
          })
        } finally {
          set({ isLoading: false })
        }
      },

      // User actions
      addToFavorites: (song) => {
        set((state) => ({
          userData: {
            ...state.userData,
            favorites: [...state.userData.favorites, song],
          },
        }))
      },

      removeFromFavorites: (songId) => {
        set((state) => ({
          userData: {
            ...state.userData,
            favorites: state.userData.favorites.filter((song) => song.id !== songId),
          },
        }))
      },

      addToRecentlyPlayed: (song) => {
        set((state) => ({
          userData: {
            ...state.userData,
            recentlyPlayed: [song, ...state.userData.recentlyPlayed.filter((s) => s.id !== song.id).slice(0, 19)],
          },
        }))
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
        set((state) => ({
          searchHistory: [query, ...state.searchHistory.filter((q) => q !== query).slice(0, 9)],
        }))
      },

      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: "music-store",
      partialize: (state) => ({
        userData: state.userData,
        searchHistory: state.searchHistory,
        volume: state.volume,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
      }),
    },
  ),
)
