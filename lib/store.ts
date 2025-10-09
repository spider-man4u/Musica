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

type RepeatMode = "off" | "one" | "all"
type ApiStatus = "unknown" | "healthy" | "unhealthy" | "limited"
type SyncStatus = "idle" | "syncing" | "synced" | "error"

interface AppState {
  // Playback
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: RepeatMode

  // Queue
  queue: Song[]
  queueIndex: number
  originalQueue: Song[]

  // Data
  userData: UserData
  searchHistory: string[]
  searchResults: SearchResults | null
  trendingSongs: Song[]
  searchQuery: string
  curatedPlaylists: Playlist[]
  recommendations: Song[]
  artists: Artist[]

  // Status
  isLoading: boolean
  error: string | null
  apiStatus: ApiStatus
  workingApis: string[]
  lastApiCheck: number
  syncStatus: SyncStatus
  currentUserId: string | null

  // Actions - playback and queue
  setCurrentSong: (song: Song | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  setRepeatMode: (mode: RepeatMode) => void
  setQueue: (songs: Song[], startIndex?: number) => void
  addToQueue: (song: Song) => void
  removeFromQueue: (index: number) => void
  moveQueueItem: (from: number, to: number) => void
  playFromQueue: (index: number) => void
  playNext: () => Promise<void>
  playPrevious: () => void
  clearQueue: () => void
  saveQueueAsPlaylist: (name?: string) => Playlist
  playSong: (song: Song, playlist?: Song[]) => void

  // Data fetching
  searchContent: (query: string) => Promise<void>
  fetchTrendingSongs: () => Promise<void>
  fetchSongDetails: (songId: string) => Promise<Song | null>

  // User data
  addToFavorites: (song: Song) => void
  removeFromFavorites: (songId: string) => void
  addToDownloads: (song: Song) => void
  removeFromDownloads: (songId: string) => void
  addToRecentlyPlayed: (song: Song) => void
  addToListeningHistory: (songId: string, duration: number) => void
  updateUserProfile: (data: Partial<UserData>) => void
  updateUserSettings: (settings: Partial<UserData["settings"]>) => void
  createPlaylist: (name: string, description?: string) => Playlist
  addToPlaylist: (playlistId: string, song: Song) => void
  removeFromPlaylist: (playlistId: string, songId: string) => void
  deletePlaylist: (playlistId: string) => void

  // Recommendations
  generateAISuggestions: (baseSong: Song) => Promise<Song[]>
  getPersonalizedRecommendations: () => Song[]
  generateRelatedSongs: (baseSong: Song, count?: number) => Promise<Song[]>
  generateRecommendations: (baseSong: Song, count?: number) => Promise<Song[]>

  // Misc
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  checkApiStatus: () => Promise<void>
  retryConnection: () => Promise<void>
  syncToCloud: () => Promise<void>
  loadFromCloud: () => Promise<void>
  setSyncStatus: (status: SyncStatus) => void
  setCurrentUserId: (userId: string | null) => void
  getArtistById: (artistId: string) => Artist | null
  updateSongDuration: (songId: string, duration: number) => void
}

/* Utilities */

const getValidImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return "/abstract-album-cover.png"
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
  const a1 = song1.artist?.toLowerCase() || ""
  const a2 = song2.artist?.toLowerCase() || ""
  if (a1 && a2) {
    if (a1 === a2) similarity += 40
    else if (a1.includes(a2) || a2.includes(a1)) similarity += 20
  }
  if (song1.genre && song2.genre && song1.genre === song2.genre) similarity += 20
  if (song1.mood && song2.mood && song1.mood === song2.mood) similarity += 15
  if (song1.language && song2.language && song1.language === song2.language) similarity += 10
  const year1 = Number.parseInt(song1.year || "0")
  const year2 = Number.parseInt(song2.year || "0")
  if (year1 && year2 && Math.abs(year1 - year2) <= 5) similarity += 10
  if (song1.energy && song2.energy) {
    similarity += Math.max(0, 5 - Math.abs(song1.energy - song2.energy) / 20)
  }
  return similarity
}

/* Client-side metadata probing for durations (runs only when called) */
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
        resolve(d > 0 ? Math.round(d) : 0)
      }
      const onError = () => {
        cleanup()
        resolve(0)
      }
      const cleanup = () => {
        audio.removeEventListener("loadedmetadata", onLoaded)
        audio.removeEventListener("error", onError)
      }
      audio.addEventListener("loadedmetadata", onLoaded as any, { passive: true } as any)
      audio.addEventListener("error", onError)
    } catch {
      resolve(0)
    }
  })
}

async function enrichSongDurations(songs: Song[], onEach?: (songId: string, duration: number) => void) {
  const updated = [...songs]
  const concurrency = 3
  let index = 0
  async function worker() {
    while (index < updated.length) {
      const i = index++
      const s = updated[i]
      if (!s) continue
      if ((!s.duration || s.duration <= 0) && (s.download_url || s.audio)) {
        const url = s.download_url || s.audio
        const d = await probeAudioDuration(url)
        if (d > 0) {
          updated[i] = { ...s, duration: d }
          onEach?.(s.id, d)
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }).map(() => worker()))
  return updated
}

/* Defaults */

const defaultUserData: UserData = {
  id: "1",
  name: "User",
  email: "user@example.com",
  avatar: "/abstract-geometric-shapes.png",
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

const curatedPlaylistsDefault: Playlist[] = [
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

/* Store */

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Playback
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.7,
      isMuted: false,
      isShuffled: false,
      repeatMode: "off",

      // Queue
      queue: [],
      queueIndex: 0,
      originalQueue: [],

      // Data
      userData: defaultUserData,
      searchHistory: [],
      searchResults: null,
      trendingSongs: [],
      searchQuery: "",
      curatedPlaylists: curatedPlaylistsDefault,
      recommendations: [],
      artists: [],

      // Status
      isLoading: false,
      error: null,
      apiStatus: "unknown",
      workingApis: [],
      lastApiCheck: 0,
      syncStatus: "idle",
      currentUserId: null,

      /* Playback and queue */
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
          queueIndex: Math.max(0, Math.min(startIndex, Math.max(0, songs.length - 1))),
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
          if (index < 0 || index >= state.queue.length) return state
          const newQueue = state.queue.filter((_, i) => i !== index)
          const newOriginalQueue = state.originalQueue.filter((_, i) => i !== index)
          let newIndex = state.queueIndex
          if (index < state.queueIndex) newIndex = Math.max(0, state.queueIndex - 1)
          if (index === state.queueIndex) {
            // If we removed current track, move to same index (now next item) or previous if at end
            newIndex = Math.min(newQueue.length - 1, state.queueIndex)
          }
          const next: Partial<AppState> = {
            queue: newQueue,
            originalQueue: newOriginalQueue,
            queueIndex: Math.max(0, newIndex),
          }
          if (newQueue.length === 0) {
            next.currentSong = null
            next.isPlaying = false
          } else {
            next.currentSong = newQueue[Math.max(0, newIndex)]
          }
          return next as any
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
      playNext: async () => {
        const { queue, queueIndex, repeatMode, currentSong, userData } = get()
        if (!Array.isArray(queue) || queue.length === 0) {
          if (currentSong && userData.settings.autoplay) {
            const related = await get().generateRelatedSongs(currentSong)
            if (related.length > 0) {
              // Start with first related
              set({ queue: related, originalQueue: related, queueIndex: 0 })
              get().setCurrentSong(related[0])
              get().setIsPlaying(true)
            }
          }
          return
        }

        if (repeatMode === "one") {
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
            // Append related and continue
            const base = queue[queueIndex]
            if (base && userData.settings.autoplay) {
              const related = await get().generateRelatedSongs(base)
              if (related.length > 0) {
                const newQueue = [...queue, ...related]
                set({ queue: newQueue, originalQueue: newQueue })
                nextIndex = queue.length // first newly appended
                set({ queueIndex: nextIndex })
                get().setCurrentSong(newQueue[nextIndex])
                get().setIsPlaying(true)
                return
              }
            }
            // Stop if nothing to append
            set({ isPlaying: false })
            return
          }
        }

        set({ queueIndex: nextIndex })
        get().setCurrentSong(get().queue[nextIndex])
        get().setIsPlaying(true)
      },
      playPrevious: () => {
        const { queueIndex, queue, repeatMode } = get()
        if (!Array.isArray(queue) || queue.length === 0) return

        if (repeatMode === "one") {
          const cs = queue[queueIndex]
          if (cs) {
            get().setCurrentSong(cs)
            get().setIsPlaying(true)
          }
          return
        }

        let prevIndex = queueIndex - 1
        if (prevIndex < 0) {
          if (repeatMode === "all") {
            prevIndex = Math.max(0, queue.length - 1)
          } else {
            // Restart current
            prevIndex = 0
          }
        }
        set({ queueIndex: prevIndex })
        get().setCurrentSong(get().queue[prevIndex])
        get().setIsPlaying(true)
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
      saveQueueAsPlaylist: (name = "Saved Queue") => {
        const { queue } = get()
        const playlist: Playlist = {
          id: `queue-${Date.now()}`,
          name,
          description: "Saved from your current queue",
          image: queue[0]?.image || "/music-playlist.png",
          songs: [...queue],
          createdAt: new Date().toISOString(),
          isPublic: false,
        }
        set((state) => ({
          userData: { ...state.userData, playlists: [...state.userData.playlists, playlist] },
        }))
        return playlist
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

      /* Fetching */
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

            // Probe durations in background and patch
            enrichSongDurations(songs, (id, d) => get().updateSongDuration(id, d)).catch(() => {})
          } else {
            set({
              searchResults: { songs: { data: [], total: 0 } },
              error: "No songs found. Try different keywords.",
              apiStatus: "limited",
            })
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

            // Enrich durations in background
            enrichSongDurations(songs, (id, d) => get().updateSongDuration(id, d)).catch(() => {})
          } else {
            set({
              trendingSongs: [],
              error: "No trending songs available.",
              apiStatus: "limited",
            })
          }
        } catch (error) {
          console.error("Trending error:", error)
          set({
            trendingSongs: [],
            error: "Failed to load trending songs.",
            apiStatus: "unhealthy",
          })
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

      /* User data */
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
          const current = Array.isArray(state.userData?.recentlyPlayed) ? state.userData.recentlyPlayed : []
          const filtered = current.filter((s) => s?.id !== song.id)
          return {
            userData: {
              ...state.userData,
              recentlyPlayed: [song, ...filtered.slice(0, 19)],
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

      /* Playlists CRUD */
      createPlaylist: (name, description = "") => {
        const playlist: Playlist = {
          id: `pl-${Date.now()}`,
          name,
          description,
          image: "/music-playlist.png",
          songs: [],
          createdAt: new Date().toISOString(),
          isPublic: false,
        }
        set((state) => ({
          userData: { ...state.userData, playlists: [playlist, ...state.userData.playlists] },
        }))
        return playlist
      },
      addToPlaylist: (playlistId, song) => {
        set((state) => {
          const playlists = state.userData.playlists.map((pl) =>
            pl.id === playlistId && !pl.songs.some((s) => s.id === song.id)
              ? { ...pl, songs: [song, ...pl.songs] }
              : pl,
          )
          return { userData: { ...state.userData, playlists } }
        })
        get().syncToCloud()
      },
      removeFromPlaylist: (playlistId, songId) => {
        set((state) => {
          const playlists = state.userData.playlists.map((pl) =>
            pl.id === playlistId ? { ...pl, songs: pl.songs.filter((s) => s.id !== songId) } : pl,
          )
          return { userData: { ...state.userData, playlists } }
        })
        get().syncToCloud()
      },
      deletePlaylist: (playlistId) => {
        set((state) => ({
          userData: { ...state.userData, playlists: state.userData.playlists.filter((pl) => pl.id !== playlistId) },
        }))
        get().syncToCloud()
      },

      /* Recommendations */
      generateAISuggestions: async (baseSong) => {
        if (!get().userData.settings.aiSuggestions) return []
        try {
          const { trendingSongs, userData } = get()
          const pool = [...trendingSongs, ...userData.favorites, ...userData.recentlyPlayed]
          const suggestions = pool
            .filter((song) => song.id !== baseSong.id)
            .map((song) => ({ song, similarity: calculateSimilarity(baseSong, song) }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10)
            .map((i) => i.song)

          set({ recommendations: suggestions })

          if (suggestions.length > 0) {
            const { queue } = get()
            const newQueue = [...queue, ...suggestions]
            set({
              queue: newQueue,
              originalQueue: newQueue,
              queueIndex: queue.length,
            })
          }
          return suggestions
        } catch (err) {
          console.error("AI suggestions failed:", err)
          return []
        }
      },
      getPersonalizedRecommendations: () => {
        const { userData, trendingSongs } = get()
        if (!userData.listeningHistory.length) return trendingSongs.slice(0, 10)

        const genrePreferences: Record<string, number> = {}
        const artistPreferences: Record<string, number> = {}

        userData.listeningHistory.forEach((entry) => {
          const song = [...userData.favorites, ...userData.recentlyPlayed, ...trendingSongs].find(
            (s) => s.id === entry.songId,
          )
          if (song) {
            const g = song.genre || "unknown"
            genrePreferences[g] = (genrePreferences[g] || 0) + 1
            artistPreferences[song.artist] = (artistPreferences[song.artist] || 0) + 1
          }
        })

        const recs = trendingSongs
          .filter((song) => !userData.favorites.some((fav) => fav.id === song.id))
          .map((song) => {
            let score = 0
            score += (genrePreferences[song.genre || "unknown"] || 0) * 3
            score += (artistPreferences[song.artist] || 0) * 5
            return { song, score }
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 15)
          .map((i) => i.song)

        return recs
      },
      generateRelatedSongs: async (baseSong, count = 10) => {
        const { trendingSongs, userData, queue } = get()
        // Pool from trending, favorites, recently played and avoid ones already in queue
        const inQueue = new Set(queue.map((s) => s.id))
        const pool = [...trendingSongs, ...userData.favorites, ...userData.recentlyPlayed].filter(
          (s) => s.id !== baseSong.id && !inQueue.has(s.id),
        )
        const ranked = pool
          .map((s) => ({ s, sim: calculateSimilarity(baseSong, s) }))
          .sort((a, b) => b.sim - a.sim)
          .slice(0, count)
          .map((x) => x.s)

        if (ranked.length > 0) {
          const newQueue = [...queue, ...ranked]
          set({ queue: newQueue, originalQueue: newQueue })
        }
        return ranked
      },
      generateRecommendations: async (baseSong, count = 10) => {
        const recs = await get().generateRelatedSongs(baseSong, count)
        set({ recommendations: recs })
        return recs
      },

      /* Misc */
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      addToSearchHistory: (query) => {
        if (!query?.trim()) return
        set((state) => {
          const current = Array.isArray(state.searchHistory) ? state.searchHistory : []
          const filtered = current.filter((q) => q !== query)
          return { searchHistory: [query, ...filtered.slice(0, 9)] }
        })
      },
      clearSearchHistory: () => set({ searchHistory: [] }),

      updateSongDuration: (songId, duration) => {
        if (!songId || !duration || !Number.isFinite(duration) || duration <= 0) return
        set((state) => {
          const patchSong = (s?: Song) => (s?.id === songId ? { ...s, duration } : s)
          const patchArray = (arr?: Song[]) =>
            Array.isArray(arr) ? arr.map((s) => (s.id === songId ? { ...s, duration } : s)) : arr

          const patchedCurrent = patchSong(state.currentSong || undefined) || state.currentSong
          const patchedQueue = patchArray(state.queue) || []
          const patchedOriginal = patchArray(state.originalQueue) || []
          const patchedTrending = patchArray(state.trendingSongs) || []
          const patchedRecs = patchArray(state.recommendations) || []
          const patchedFav = patchArray(state.userData.favorites) || []
          const patchedRecent = patchArray(state.userData.recentlyPlayed) || []

          let patchedResults = state.searchResults
          if (patchedResults?.songs?.data) {
            patchedResults = {
              ...patchedResults,
              songs: {
                data: patchArray(patchedResults.songs.data) || [],
                total: patchedResults.songs.total,
              },
            }
          }

          return {
            currentSong: patchedCurrent,
            queue: patchedQueue,
            originalQueue: patchedOriginal,
            trendingSongs: patchedTrending,
            recommendations: patchedRecs,
            searchResults: patchedResults,
            userData: {
              ...state.userData,
              favorites: patchedFav,
              recentlyPlayed: patchedRecent,
            },
          }
        })
      },

      /* Health and connectivity */
      checkApiStatus: async () => {
        const now = Date.now()
        const { lastApiCheck } = get()
        if (now - lastApiCheck < 10000) return
        set({ lastApiCheck: now })
        try {
          const response = await fetch("/api/health", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-cache",
          })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            set({ apiStatus: "unhealthy", workingApis: [] })
            return
          }
          const data = await response.json()
          set({
            apiStatus: data.status === "healthy" ? "healthy" : data.status === "limited" ? "limited" : "unhealthy",
            workingApis: Array.isArray(data.workingApis) ? data.workingApis : [],
          })
        } catch (err) {
          console.error("API health check failed:", err)
          set({ apiStatus: "unhealthy", workingApis: [] })
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

      /* Cloud sync */
      syncToCloud: async () => {
        const { currentUserId, userData, syncStatus } = get()
        if (!currentUserId || syncStatus === "syncing") return
        try {
          set({ syncStatus: "syncing" })
          const result = await syncUserData(currentUserId, userData)
          set({ syncStatus: result.success ? "synced" : "error" })
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
            set({ userData: result.userData, syncStatus: "synced" })
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

      /* Artists */
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
        curatedPlaylists: state.curatedPlaylists || curatedPlaylistsDefault,
        currentUserId: state.currentUserId,
        artists: state.artists || [],
        recommendations: state.recommendations || [],
      }),
    },
  ),
)
