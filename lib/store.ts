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

const convertSaavnSongToSong = (saavnSong: SaavnSong): Song | null => {
  try {
    if (!saavnSong || !saavnSong.id || !saavnSong.name) {
      return null
    }

    return {
      id: saavnSong.id,
      title: saavnSong.name,
      artist: saavnSong.primaryArtists || "Unknown Artist",
      album: saavnSong.album?.name || "Unknown Album",
      image: getHighQualityImage(saavnSong.image || []),
      audio: getHighQualityAudio(saavnSong.downloadUrl || []),
      duration: Number.parseInt(saavnSong.duration || "0"),
      language: saavnSong.language,
      year: saavnSong.year,
      playCount: saavnSong.playCount,
      explicit: saavnSong.explicitContent === 1,
      url: saavnSong.url,
    }
  } catch (error) {
    return null
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

      // Data actions with silent error handling
      searchContent: async (query) => {
        if (!query?.trim()) return

        set({ isLoading: true, error: null, searchQuery: query })

        try {
          const results = await searchAll(query)
          set({ searchResults: results || null })
          get().addToSearchHistory(query)
        } catch (error) {
          // Silent fallback - user gets mock results
          set({ searchResults: null })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchTrendingSongs: async () => {
        set({ isLoading: true, error: null })

        try {
          const songs = await getTrendingSongs()
          if (Array.isArray(songs) && songs.length > 0) {
            const convertedSongs = songs.map(convertSaavnSongToSong).filter((song): song is Song => song !== null)
            set({ trendingSongs: convertedSongs, error: null })
          }
        } catch (error) {
          // Silent fallback
          set({ trendingSongs: [], error: null })
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
            favorites: (state.userData?.favorites || []).filter((song) => song?.id !== songId),
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
    }),
    {
      name: "music-store",
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
