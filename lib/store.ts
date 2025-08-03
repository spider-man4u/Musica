import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { pwaManager } from "./pwa"

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  audioUrl: string
  imageUrl?: string
  genre?: string
  year?: number
  language?: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  songs: Song[]
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  preferences: {
    theme: "light" | "dark" | "system"
    audioQuality: "low" | "medium" | "high"
    autoPlay: boolean
    notifications: boolean
  }
}

interface MusicStore {
  // Player state
  currentSong: Song | null
  queue: Song[]
  currentIndex: number
  isPlaying: boolean
  volume: number
  isShuffled: boolean
  repeatMode: "none" | "one" | "all"

  // Data state
  trendingSongs: Song[]
  searchResults: Song[]
  playlists: Playlist[]
  favorites: Song[]
  recentlyPlayed: Song[]

  // UI state
  isLoading: boolean
  error: string | null
  apiStatus: {
    jamendo: boolean
    saavn: boolean
    lastChecked: Date | null
  }

  // User state
  userProfile: UserProfile | null
  isAuthenticated: boolean

  // PWA state
  isOffline: boolean
  cachedSongs: Song[]

  // Actions
  playSong: (song: Song) => void
  pauseSong: () => void
  nextSong: () => void
  previousSong: () => void
  setVolume: (volume: number) => void
  toggleShuffle: () => void
  setRepeatMode: (mode: "none" | "one" | "all") => void
  addToQueue: (song: Song) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void

  // Data actions
  fetchTrendingSongs: () => Promise<void>
  searchSongs: (query: string) => Promise<void>
  addToFavorites: (song: Song) => void
  removeFromFavorites: (songId: string) => void
  createPlaylist: (name: string, description?: string) => Playlist
  addToPlaylist: (playlistId: string, song: Song) => void
  removeFromPlaylist: (playlistId: string, songId: string) => void

  // API actions
  checkApiStatus: () => Promise<void>

  // User actions
  updateUserProfile: (profile: Partial<UserProfile>) => void
  login: (profile: UserProfile) => void
  logout: () => void

  // PWA actions
  setOfflineStatus: (isOffline: boolean) => void
  cacheSong: (song: Song) => void
  getCachedSongs: () => Song[]
  syncOfflineData: () => Promise<void>
}

export const useStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSong: null,
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      volume: 1,
      isShuffled: false,
      repeatMode: "none",

      trendingSongs: [],
      searchResults: [],
      playlists: [],
      favorites: [],
      recentlyPlayed: [],

      isLoading: false,
      error: null,
      apiStatus: {
        jamendo: false,
        saavn: false,
        lastChecked: null,
      },

      userProfile: null,
      isAuthenticated: false,

      isOffline: false,
      cachedSongs: [],

      // Player actions
      playSong: (song) => {
        const state = get()
        const newQueue = state.queue.length === 0 ? [song] : state.queue
        const index = newQueue.findIndex((s) => s.id === song.id)

        set({
          currentSong: song,
          queue: newQueue,
          currentIndex: index >= 0 ? index : 0,
          isPlaying: true,
          recentlyPlayed: [song, ...state.recentlyPlayed.filter((s) => s.id !== song.id)].slice(0, 50),
        })

        // Cache song for offline use
        get().cacheSong(song)
      },

      pauseSong: () => set({ isPlaying: false }),

      nextSong: () => {
        const { queue, currentIndex, repeatMode, isShuffled } = get()
        if (queue.length === 0) return

        let nextIndex = currentIndex + 1

        if (repeatMode === "one") {
          nextIndex = currentIndex
        } else if (nextIndex >= queue.length) {
          nextIndex = repeatMode === "all" ? 0 : currentIndex
        }

        if (isShuffled && repeatMode !== "one") {
          nextIndex = Math.floor(Math.random() * queue.length)
        }

        const nextSong = queue[nextIndex]
        if (nextSong) {
          set({
            currentSong: nextSong,
            currentIndex: nextIndex,
            isPlaying: true,
          })
        }
      },

      previousSong: () => {
        const { queue, currentIndex } = get()
        if (queue.length === 0) return

        const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1
        const prevSong = queue[prevIndex]

        if (prevSong) {
          set({
            currentSong: prevSong,
            currentIndex: prevIndex,
            isPlaying: true,
          })
        }
      },

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

      setRepeatMode: (mode) => set({ repeatMode: mode }),

      addToQueue: (song) => {
        const { queue } = get()
        set({ queue: [...queue, song] })
      },

      removeFromQueue: (index) => {
        const { queue, currentIndex } = get()
        const newQueue = queue.filter((_, i) => i !== index)
        const newCurrentIndex = index < currentIndex ? currentIndex - 1 : currentIndex

        set({
          queue: newQueue,
          currentIndex: Math.max(0, Math.min(newCurrentIndex, newQueue.length - 1)),
        })
      },

      clearQueue: () => set({ queue: [], currentIndex: 0 }),

      // Data actions
      fetchTrendingSongs: async () => {
        set({ isLoading: true, error: null })

        try {
          // Mock data for demo - replace with actual API calls
          const mockSongs: Song[] = [
            {
              id: "1",
              title: "Blinding Lights",
              artist: "The Weeknd",
              album: "After Hours",
              duration: 200,
              audioUrl: "/placeholder.mp3",
              imageUrl: "/placeholder.svg?height=300&width=300",
              genre: "Pop",
              year: 2020,
            },
            {
              id: "2",
              title: "Watermelon Sugar",
              artist: "Harry Styles",
              album: "Fine Line",
              duration: 174,
              audioUrl: "/placeholder.mp3",
              imageUrl: "/placeholder.svg?height=300&width=300",
              genre: "Pop",
              year: 2020,
            },
          ]

          set({ trendingSongs: mockSongs, isLoading: false })
        } catch (error) {
          set({ error: "Failed to fetch trending songs", isLoading: false })
        }
      },

      searchSongs: async (query) => {
        if (!query.trim()) {
          set({ searchResults: [] })
          return
        }

        set({ isLoading: true, error: null })

        try {
          // Mock search - replace with actual API
          const { trendingSongs } = get()
          const results = trendingSongs.filter(
            (song) =>
              song.title.toLowerCase().includes(query.toLowerCase()) ||
              song.artist.toLowerCase().includes(query.toLowerCase()),
          )

          set({ searchResults: results, isLoading: false })
        } catch (error) {
          set({ error: "Search failed", isLoading: false })
        }
      },

      addToFavorites: (song) => {
        const { favorites } = get()
        if (!favorites.find((s) => s.id === song.id)) {
          set({ favorites: [...favorites, song] })

          // Sync offline if needed
          if (get().isOffline) {
            pwaManager.requestBackgroundSync("sync-favorites")
          }
        }
      },

      removeFromFavorites: (songId) => {
        const { favorites } = get()
        set({ favorites: favorites.filter((s) => s.id !== songId) })
      },

      createPlaylist: (name, description) => {
        const newPlaylist: Playlist = {
          id: Date.now().toString(),
          name,
          description,
          songs: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const { playlists } = get()
        set({ playlists: [...playlists, newPlaylist] })

        return newPlaylist
      },

      addToPlaylist: (playlistId, song) => {
        const { playlists } = get()
        const updatedPlaylists = playlists.map((playlist) => {
          if (playlist.id === playlistId) {
            return {
              ...playlist,
              songs: [...playlist.songs, song],
              updatedAt: new Date(),
            }
          }
          return playlist
        })

        set({ playlists: updatedPlaylists })
      },

      removeFromPlaylist: (playlistId, songId) => {
        const { playlists } = get()
        const updatedPlaylists = playlists.map((playlist) => {
          if (playlist.id === playlistId) {
            return {
              ...playlist,
              songs: playlist.songs.filter((s) => s.id !== songId),
              updatedAt: new Date(),
            }
          }
          return playlist
        })

        set({ playlists: updatedPlaylists })
      },

      // API actions
      checkApiStatus: async () => {
        try {
          // Mock API status check
          set({
            apiStatus: {
              jamendo: true,
              saavn: true,
              lastChecked: new Date(),
            },
          })
        } catch (error) {
          set({
            apiStatus: {
              jamendo: false,
              saavn: false,
              lastChecked: new Date(),
            },
          })
        }
      },

      // User actions
      updateUserProfile: (profile) => {
        const { userProfile } = get()
        if (userProfile) {
          set({ userProfile: { ...userProfile, ...profile } })
        }
      },

      login: (profile) => {
        set({ userProfile: profile, isAuthenticated: true })
      },

      logout: () => {
        set({ userProfile: null, isAuthenticated: false })
      },

      // PWA actions
      setOfflineStatus: (isOffline) => {
        set({ isOffline })
      },

      cacheSong: (song) => {
        const { cachedSongs } = get()
        if (!cachedSongs.find((s) => s.id === song.id)) {
          set({ cachedSongs: [...cachedSongs, song] })
        }
      },

      getCachedSongs: () => {
        return get().cachedSongs
      },

      syncOfflineData: async () => {
        const { favorites, playlists } = get()

        try {
          // Sync favorites
          if (favorites.length > 0) {
            await pwaManager.requestBackgroundSync("sync-favorites")
          }

          // Sync playlists
          if (playlists.length > 0) {
            await pwaManager.requestBackgroundSync("sync-playlists")
          }

          console.log("✅ Offline data sync initiated")
        } catch (error) {
          console.error("❌ Failed to sync offline data:", error)
        }
      },
    }),
    {
      name: "musica-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only necessary data
        favorites: state.favorites,
        playlists: state.playlists,
        recentlyPlayed: state.recentlyPlayed,
        userProfile: state.userProfile,
        isAuthenticated: state.isAuthenticated,
        cachedSongs: state.cachedSongs,
        volume: state.volume,
        repeatMode: state.repeatMode,
        isShuffled: state.isShuffled,
      }),
    },
  ),
)

// Initialize PWA connection status
if (typeof window !== "undefined") {
  const store = useStore.getState()

  // Set initial offline status
  store.setOfflineStatus(!navigator.onLine)

  // Listen for connection changes
  window.addEventListener("online", () => {
    store.setOfflineStatus(false)
    store.syncOfflineData()
  })

  window.addEventListener("offline", () => {
    store.setOfflineStatus(true)
  })
}
