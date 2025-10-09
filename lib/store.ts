import { create } from "zustand"
import { persist } from "zustand/middleware"
import { searchMusic, getTrendingMusic, getSongDetails, sanitizeString, type ModernSong } from "./modernMusicApi"
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
  userData: UserData
  searchHistory: string[]
  searchResults: SearchResults | null
  trendingSongs: Song[]
  searchQuery: string
  curatedPlaylists: Playlist[]
  recommendations: Song[]
  artists: Artist[]
  isLoading: boolean
  error: string | null
  apiStatus: "unknown" | "healthy" | "unhealthy" | "limited"
  workingApis: string[]
  lastApiCheck: number
  syncStatus: "idle" | "syncing" | "synced" | "error"
  currentUserId: string | null

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
  moveQueueItem: (from: number, to: number) => void
  playFromQueue: (index: number) => void
  saveQueueAsPlaylist: (name?: string) => Playlist
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
  updateSongDuration: (songId: string, duration: number) => void
  generateRelatedSongs: (baseSong: Song, count?: number) => Promise<Song[]>
}

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
    mood: "neutral",
    energy: Math.random() * 100,
    danceability: Math.random() * 100,
    valence: Math.random() * 100,
  }
}

const calculateSimilarity = (song1: Song, song2: Song): number => {
  let similarity = 0

  if (song1.artist.toLowerCase() === song2.artist.toLowerCase()) {
    similarity += 40
  } else if (
    song1.artist.toLowerCase().includes(song2.artist.toLowerCase()) ||
    song2.artist.toLowerCase().includes(song1.artist.toLowerCase())
  ) {
    similarity += 20
  }

  if (song1.genre === song2.genre) similarity += 20
  if (song1.mood === song2.mood) similarity += 15
  if (song1.language === song2.language) similarity += 10

  const year1 = Number.parseInt(song1.year || "0")
  const year2 = Number.parseInt(song2.year || "0")
  if (Math.abs(year1 - year2) <= 5) similarity += 10

  if (song1.energy && song2.energy) {
    similarity += Math.max(0, 5 - Math.abs(song1.energy - song2.energy) / 20)
  }

  return similarity
}

async function probeAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio()
      audio.preload = "metadata"
      audio.crossOrigin = "anonymous"
      audio.src = url
      const onLoaded = () => {
        const d = Number.isFinite(audio.duration) ? audio.duration : 0
        cleanup()
        resolve(d > 0 ? d : 0)
      }
      const onError = () => {
        cleanup()
        resolve(0)
      }
      const cleanup = () => {
        audio.removeEventListener("loadedmetadata", onLoaded)
        audio.removeEventListener("error", onError)
        // Do not call audio.src = '' to avoid additional network
      }
      audio.addEventListener("loadedmetadata", onLoaded, { passive: true } as any)
      audio.addEventListener("error", onError)
    } catch {
      resolve(0)
    }
  })
}

async function enrichSongDurations(songs: Song[], onProgress?: (updated: Song[]) => void) {
  const updated: Song[] = [...songs]
  const concurrency = 3
  let index = 0

  async function worker() {
    while (index < updated.length) {
      const i = index++
      const s = updated[i]
      if (s && (!s.duration || s.duration <= 0) && (s.download_url || s.audio)) {
        const url = s.download_url || s.audio
        const d = await probeAudioDuration(url)
        if (d && Number.isFinite(d) && d > 0) {
          updated[i] = { ...s, duration: Math.round(d) }
          onProgress?.(updated)
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }).map(() => worker()))
  return updated
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

const curatedPlaylists: Playlist[] = [
  {
    id: "curated-1",
    name: "Bollywood Hits 2024",
    description: "The biggest Bollywood songs of the year",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format",
    songs: [],
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
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

      setCurrentSong: (song) => {
        set({ currentSong: song })
        if (song) {
          get().addToRecentlyPlayed(song)
          get().addToListeningHistory(song.id, 0)
        }
      },

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),

      setDuration: (duration) => {
        if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
          set({ duration })
        }
      },

      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

      toggleMute: () => {
        const { volume, isMuted } = get()
        set({
          isMuted: !isMuted,
          volume: isMuted ? (volume === 0 ? 0.7 : volume) : 0,
        })
      },

      toggleShuffle: () => {
        const { isShuffled, queue } = get()
        const newShuffled = !isShuffled

        if (newShuffled) {
          const shuffledQueue = [...queue].sort(() => Math.random() - 0.5)
          set({ isShuffled: newShuffled, queue: shuffledQueue, queueIndex: 0 })
        } else {
          const { originalQueue } = get()
          set({ isShuffled: newShuffled, queue: originalQueue })
        }
      },

      setRepeatMode: (mode) => set({ repeatMode: mode }),

      setQueue: (songs, startIndex = 0) => {
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

      updateSongDuration: (songId, duration) => {
        if (!songId || !duration || !Number.isFinite(duration) || duration <= 0) return
        set((state) => {
          const patchDuration = (s?: Song) => (s?.id === songId ? { ...s, duration } : s)
          const patchArray = (arr?: Song[]) => (Array.isArray(arr) ? arr.map((s) => (s.id === songId ? { ...s, duration } : s)) : arr)

          const patchedCurrent = patchDuration(state.currentSong || undefined)
          const patchedQueue = patchArray(state.queue) || []
          const patchedOriginal = patchArray(state.originalQueue) || []
          const patchedTrending = patchArray(state.trendingSongs) || []
          const patchedRecs = patchArray(state.recommendations) || []
          const patchedFavorites = patchArray(state.userData?.favorites) || []
          const patchedRecent = patchArray(state.userData?.recentlyPlayed) || []
          let patchedSearchResults = state.searchResults
          if (patchedSearchResults?.songs?.data) {
            patchedSearchResults = {
              ...patchedSearchResults,
              songs: { ...patchedSearchResults.songs, data: patchArray(patchedSearchResults.songs.data) || [] },
            }
          }

          return {
            currentSong: patchedCurrent || state.currentSong,
            queue: patchedQueue,
            originalQueue: patchedOriginal,
            trendingSongs: patchedTrending,
            recommendations: patchedRecs,
            searchResults: patchedSearchResults,
            userData: {
              ...state.userData,
              favorites: patchedFavorites,
              recentlyPlayed: patchedRecent,
            },
          }
        })
      },

      moveQueueItem: (from, to) => {
        set((state) => {
          if (from === to || from < 0 || to < 0 || from >= state.queue.length || to >= state.queue.length) return state
          const newQueue = [...state.queue]
          const [item] = newQueue.splice(from, 1)
          newQueue.splice(to, 0, item)

          const newOriginal = [...state.originalQueue]
          const [orig] = newOriginal.splice(from, 1)
          newOriginal.splice(to, 0, orig)

          let newIndex = state.queueIndex
          if (from === state.queueIndex) newIndex = to
          else if (from < state.queueIndex && to >= state.queueIndex) newIndex -= 1
          else if (from > state.queueIndex && to <= state.queueIndex) newIndex += 1

          return { queue: newQueue, originalQueue: newOriginal, queueIndex: newIndex }
        })
      },

      playFromQueue: (index) => {
        const { queue } = get()
        if (queue[index]) {
          set({ queueIndex: index })
          get().setCurrentSong(queue[index])
          get().setIsPlaying(true)
        }
      },

      saveQueueAsPlaylist: (name = "Saved Queue") => {
        const { queue } = get()
        const playlist: Playlist = {
          id: `queue-${Date.now()}`,
          name,
          description: "Saved from your current queue",
          image: queue[0]?.image || "/placeholder.svg?height=300&width=300",
          songs: [...queue],
          createdAt: new Date().toISOString(),
          isPublic: false,
        }
        set((state) => ({
          userData: { ...state.userData, playlists: [...state.userData.playlists, playlist] },
        }))
        return playlist
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

      playSong: (song, playlist) => {
        if (playlist && playlist.length > 0) {
          const songIndex = playlist.findIndex((s) => s.id === song.id)
          get().setQueue(playlist, songIndex >= 0 ? songIndex : 0)
        } else {
          get().setQueue([song], 0)
          if (get().userData.settings.aiSuggestions) {
            get().generateAISuggestions(song)
          }
        }
        get().setIsPlaying(true)
      },

      searchContent: async (query) => {
        if (!query?.trim()) {
          set({ searchResults: null, error: null })
          return
        }
        set({ isLoading: true, error: null, searchQuery: query })
        try {
          const response = await searchMusic(query)
          if (response.success && response.data.results?.length > 0) {
            const songs = response.data.results.map(convertModernSongToSong)
            set({
              searchResults: { songs: { data: songs, total: songs.length } },
              recommendations: songs.slice(0, 5),
              error: null,
              apiStatus: "healthy",
            })
            get().addToSearchHistory(query)
            // Enrich durations in background and patch results
            enrichSongDurations(songs).then((updated) => {
              set((state) => ({
                searchResults: state.searchResults
                  ? {
                      ...state.searchResults,
                      songs: { data: updated, total: updated.length },
                    }
                  : state.searchResults,
              }))
            })
          } else {
            set({ searchResults: { songs: { data: [], total: 0 } }, error: "No songs found. Try different keywords." })
          }
        } catch (error) {
          console.error("Search error:", error)
          set({
            searchResults: { songs: { data: [], total: 0 } },
            error: "Search failed. Please check your connection.",
            apiStatus: "unhealthy",
          })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchTrendingSongs: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await getTrendingMusic()
          if (response.success && response.data.trending.length > 0) {
            const songs = response.data.trending.map(convertModernSongToSong)
            set({ trendingSongs: songs, error: null, apiStatus: "healthy" })

            // Background duration enrichment
            enrichSongDurations(songs).then((updated) => {
              set({ trendingSongs: updated })
            })
          } else {
            set({ trendingSongs: [], error: "No trending songs available.", apiStatus: "limited" })
          }
        } catch (error) {
          console.error("Trending error:", error)
          set({ trendingSongs: [], error: "Failed to load trending songs.", apiStatus: "unhealthy" })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchSongDetails: async (songId: string) => {
        try {
          const response = await getSongDetails(songId)
          if (response.success && response.data) {
            return convertModernSongToSong(response.data)
          }
        } catch (error) {
          console.error("Fetch song details error:", error)
        }
        return null
      },

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
        setTimeout(() => get().syncToCloud(), 5000)
      },

      addToListeningHistory: (songId, duration) => {
        set((state) => {
          const currentHistory = Array.isArray(state.userData?.listeningHistory) ? state.userData.listeningHistory : []
          return {
            userData: {
              ...state.userData,
              listeningHistory: [{ songId, timestamp: Date.now(), duration }, ...currentHistory.slice(0, 999)],
            },
          }
        })
      },

      generateAISuggestions: async (baseSong) => {
        if (!get().userData.settings.aiSuggestions) return []

        try {
          const { trendingSongs, userData } = get()
          const allSongs = [...trendingSongs, ...userData.favorites]

          const suggestions = allSongs
            .filter((song) => song.id !== baseSong.id)
            .map((song) => ({
              song,
              similarity: calculateSimilarity(baseSong, song),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10)
            .map((item) => item.song)

          set({ recommendations: suggestions })

          if (suggestions.length > 0) {
            const { queue } = get()
            const newQueue = [...queue, ...suggestions]
            set({
              queue: newQueue,
              originalQueue: newQueue,
              queueIndex: queue.length,
            })

            set((state) => ({
              userData: {
                ...state.userData,
                aiSuggestions: suggestions,
              },
            }))

            if (userData.settings.autoplay) {
              get().setCurrentSong(suggestions[0])
              get().setIsPlaying(true)
            }
          }

          return suggestions
        } catch (error) {
          console.error("Failed to generate recommendations:", error)
          return []
        }
      },

      getPersonalizedRecommendations: () => {
        const { userData, trendingSongs } = get()

        if (!userData.listeningHistory.length) {
          return trendingSongs.slice(0, 10)
        }

        const genrePreferences: { [key: string]: number } = {}
        const artistPreferences: { [key: string]: number } = {}

        userData.listeningHistory.forEach((entry) => {
          const song = [...userData.favorites, ...userData.recentlyPlayed, ...trendingSongs].find(
            (s) => s.id === entry.songId,
          )

          if (song) {
            genrePreferences[song.genre || "unknown"] = (genrePreferences[song.genre || "unknown"] || 0) + 1
            artistPreferences[song.artist] = (artistPreferences[song.artist] || 0) + 1
          }
        })

        const recommendations = trendingSongs
          .filter((song) => !userData.favorites.some((fav) => fav.id === song.id))
          .map((song) => {
            let score = 0
            score += (genrePreferences[song.genre || "unknown"] || 0) * 3
            score += (artistPreferences[song.artist] || 0) * 5
            return { song, score }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 15)
          .map((item) => item.song)

        return recommendations
      },

      updateUserProfile: (data) => {
        set((state) => ({
          userData: { ...state.userData, ...data },
        }))
        get().syncToCloud()
      },

      updateUserSettings: (settings) => {
        set((state) => ({
          userData: {
            ...state.userData,
            settings: { ...state.userData.settings, ...settings },
          },
        }))
        get().syncToCloud()
      },

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
          console.error("Sync error:", error)
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
          console.error("Load error:", error)
          set({ syncStatus: "error" })
        }
      },

      setSyncStatus: (status) => set({ syncStatus: status }),
      setCurrentUserId: (userId) => set({ currentUserId: userId }),
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
          const response = await fetch("/api/health", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-cache",
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            console.warn("API health check returned non-JSON response")
            set({
              apiStatus: "unhealthy",
              workingApis: [],
            })
            return
          }

          const data = await response.json()

          set({
            apiStatus: data.status === "healthy" ? "healthy" : data.status === "limited" ? "limited" : "unhealthy",
            workingApis: Array.isArray(data.workingApis) ? data.workingApis : [],
          })
        } catch (error) {
          console.error("API health check failed:", error)
          set({
            apiStatus: "unhealthy",
            workingApis: [],
          })
        }
      },

      retryConnection: async () => {
        await get().checkApiStatus()

        const { searchQuery, trendingSongs } = get()

        if (searchQuery) {
          await get().searchContent(searchQuery)
        }

        if (trendingSongs.length === 0) {
          await get().fetchTrendingSongs()
        }
      },

      getArtistById: (artistId) => {
        const { artists } = get()
        return artists.find((artist) => artist.id === artistId) || null
      },

      playNext: async () => {
        const { queue, queueIndex, repeatMode, currentSong, userData } = get()

        if (!Array.isArray(queue) || queue.length === 0) {
          if (currentSong && userData.settings.autoplay) {
            await get().generateRelatedSongs(currentSong)
          }
          return
        }

        if (repeatMode === "one") {
          // Restart current track
          const cs = queue[queueIndex]
          if (cs) {
            get().setCurrentSong(cs)
            get().setIsPlaying(true)
          }
          return
        }

        let nextIndex = queueIndex + 1

        if (nextIndex >= queue.length) {
          if (repeatMode === "all") {
            nextIndex = 0
          } else {
            // Append related songs and continue
            if (currentSong && userData.settings.autoplay) {
              const related = await get().generateRelatedSongs(currentSong)
              if (related.length > 0) {
                nextIndex = queue.length // First newly appended song
                set({ queueIndex: nextIndex })
                get().setCurrentSong(get().queue[nextIndex])
                get().setIsPlaying(true)
              } else {
                set({ isPlaying: false })
              }
            } else {
              set({ isPlaying: false })
            }
            return
          }
        }

        if (nextIndex < get().queue.length) {
          set({ queue
