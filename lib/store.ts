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
  lrc?: string | null
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
  bio: string
  location: string
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
  savedPlaylists: Playlist[]
}

type RepeatMode = "off" | "one" | "all"
type ApiStatus = "unknown" | "healthy" | "unhealthy" | "limited"
type SyncStatus = "idle" | "syncing" | "synced" | "error"

interface AppState {
  currentSong: Song | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: RepeatMode

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
  apiStatus: ApiStatus
  workingApis: string[]
  lastApiCheck: number
  syncStatus: SyncStatus
  currentUserId: string | null

  userPreferences: {
    preferredGenres: string[]
    preferredArtists: string[]
    dislikedSongs: Set<string>
    lastInteractionTime: number
  }

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

  searchContent: (query: string) => Promise<void>
  fetchTrendingSongs: () => Promise<void>
  fetchSongDetails: (songId: string) => Promise<Song | null>

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

  generateAISuggestions: (baseSong: Song) => Promise<Song[]>
  getPersonalizedRecommendations: () => Song[]
  generateRelatedSongs: (baseSong: Song, count?: number) => Promise<Song[]>
  generateRecommendations: (baseSong: Song, count?: number) => Promise<Song[]>

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

  getOrCreateMoodPlaylist: (slug: string, keywords: string[]) => Playlist
  updateMoodPlaylists: () => void

  addSongsToPlaylist: (playlistId: string, songs: Song[]) => void
  updatePlaylistMeta: (
    playlistId: string,
    data: Partial<Pick<Playlist, "name" | "description" | "image" | "isPublic">>,
  ) => void
  reorderPlaylistItem: (playlistId: string, from: number, to: number) => void
  getPlaylistById: (playlistId: string) => Playlist | null

  savePlaylist: (playlist: Playlist) => void
  unsavePlaylist: (playlistId: string) => void
  isPlaylistSaved: (playlistId: string) => boolean

  trackInteraction: (
    songId: string,
    type: "like" | "skip" | "play" | "complete",
    skipTime?: number,
    durationPlayed?: number,
    totalDuration?: number,
  ) => Promise<void>
  loadUserPreferences: () => Promise<void>
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
  const audioUrl = getValidAudioUrl(modernSong.download_url || modernSong.preview_url || modernSong.audio)
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
    url: modernSong.external_urls?.saavn || "",
    hasLyrics: true,
    label: modernSong.label || "",
    quality: modernSong.quality || "320kbps",
    genre: modernSong.genres?.[0] || "unknown",
    mood: "neutral",
    energy: Math.random() * 100,
    danceability: Math.random() * 100,
    valence: Math.random() * 100,
    lrc: null,
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

/* Client-side duration probing (invoked on demand) */
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
  bio: "",
  location: "",
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
  savedPlaylists: [],
}

const curatedPlaylistsDefault: Playlist[] = [
  {
    id: "curated-1",
    name: "Trending Now",
    description: "The latest trending songs",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format",
    songs: [],
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
]

const moodCatalog: Record<string, { name: string; keywords: string[]; image: string; description: string }> = {
  happy: {
    name: "Happy",
    keywords: ["happy", "upbeat", "cheer", "smile", "joy"],
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format",
    description: "Feel‑good tunes to lift your mood",
  },
  chill: {
    name: "Chill",
    keywords: ["chill", "relaxed", "calm", "lofi", "ambient"],
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop&auto=format",
    description: "Laid‑back beats for unwinding",
  },
  energetic: {
    name: "Energetic",
    keywords: ["energetic", "workout", "pump", "dance", "party", "edm"],
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&auto=format",
    description: "High‑energy tracks to get you moving",
  },
  romantic: {
    name: "Romantic",
    keywords: ["romantic", "love", "ballad", "heart", "valentine"],
    image: "https://images.unsplash.com/photo-1518199266791-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format",
    description: "Love songs and heartfelt ballads",
  },
  focus: {
    name: "Focus",
    keywords: ["focus", "study", "concentration", "work", "instrumental"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format",
    description: "Keep your mind on the task",
  },
  party: {
    name: "Party",
    keywords: ["party", "dance", "celebration", "club", "festival"],
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format",
    description: "Hit the dance floor any time",
  },
}

/* Store */

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
      curatedPlaylists: curatedPlaylistsDefault,
      recommendations: [],
      artists: [],

      isLoading: false,
      error: null,
      apiStatus: "unknown",
      workingApis: [],
      lastApiCheck: 0,
      syncStatus: "idle",
      currentUserId: null,

      userPreferences: {
        preferredGenres: [],
        preferredArtists: [],
        dislikedSongs: new Set(),
        lastInteractionTime: 0,
      },

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
        const { isShuffled, queue, queueIndex, originalQueue } = get()
        const current = queue[queueIndex]
        if (!current) {
          set({ isShuffled: !isShuffled })
          return
        }

        if (!isShuffled) {
          const rest = queue.filter((_, i) => i !== queueIndex)
          const shuffled = [...rest].sort(() => Math.random() - 0.5)
          const newQueue = [current, ...shuffled]
          set({
            isShuffled: true,
            queue: newQueue,
            originalQueue: originalQueue.length ? originalQueue : [...queue],
            queueIndex: 0,
          })
        } else {
          const orig = originalQueue.length ? originalQueue : queue
          const idx = orig.findIndex((s) => s.id === current.id)
          set({
            isShuffled: false,
            queue: orig,
            queueIndex: idx >= 0 ? idx : 0,
          })
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
          if (index === state.queueIndex) newIndex = Math.min(newQueue.length - 1, newIndex)

          return {
            queue: newQueue,
            originalQueue: newOriginalQueue,
            queueIndex: Math.max(0, newIndex),
            currentSong: newQueue.length ? newQueue[Math.max(0, newIndex)] : null,
            isPlaying: newQueue.length ? state.isPlaying : false,
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

      playNext: async () => {
        const { queue, queueIndex, repeatMode, currentSong, userData } = get()
        if (!Array.isArray(queue) || queue.length === 0) {
          if (currentSong && userData.settings.autoplay) {
            const related = await get().generateRelatedSongs(currentSong)
            if (related.length > 0) {
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
            const base = queue[queueIndex]
            if (base && userData.settings.autoplay) {
              const related = await get().generateRelatedSongs(base)
              if (related.length > 0) {
                const newQueue = [...queue, ...related]
                set({ queue: newQueue, originalQueue: newQueue })
                nextIndex = queue.length
                set({ queueIndex: nextIndex })
                get().setCurrentSong(newQueue[nextIndex])
                get().setIsPlaying(true)
                return
              }
            }
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
          userData: { ...state.userData, playlists: [playlist, ...state.userData.playlists] },
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
            enrichSongDurations(songs, (id, d) => get().updateSongDuration(id, d)).catch(() => {})
          } else {
            set({
              searchResults: { songs: { data: [], total: 0 } },
              error: response.message || "No songs found",
              apiStatus: "limited",
            })
          }
        } catch (error) {
          console.error("Search error:", error)
          set({
            searchResults: { songs: { data: [], total: 0 } },
            error: "Search failed. Please try again.",
            apiStatus: "unhealthy",
          })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchTrendingSongs: async () => {
        set({ isLoading: true, error: null })
        try {
          console.log(`\n🎵 [STORE] Fetching trending songs...`)
          const response = await getTrendingMusic()

          if (response.success && response.data.trending.length > 0) {
            console.log(`✅ [STORE] Got ${response.data.trending.length} trending songs`)
            set({
              trendingSongs: response.data.trending,
              error: null,
              apiStatus: "healthy",
            })

            // Update mood playlists with trending data
            get().updateMoodPlaylists()
          } else {
            console.warn(`⚠️ [STORE] No trending songs available`)
            set({
              trendingSongs: [],
              error: response.message || "No trending songs available. Try searching instead.",
              apiStatus: "limited",
            })
          }
        } catch (error) {
          console.error("[STORE] Trending error:", error)
          set({
            trendingSongs: [],
            error: "Failed to load trending songs. Try searching for specific songs.",
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
              favorites: [song, ...currentFavorites],
            },
          }
        })
        if (song?.id) {
          get().trackInteraction(song.id, "like")
        }
        get().syncToCloud()
        get().updateMoodPlaylists()
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
        get().trackInteraction(songId, "skip")
        get().syncToCloud()
        get().updateMoodPlaylists()
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
              downloads: [song, ...currentDownloads],
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
        get().syncToCloud()
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
          userData: {
            ...state.userData,
            playlists: state.userData.playlists.filter((pl) => pl.id !== playlistId),
          },
        }))
        setTimeout(() => get().syncToCloud(), 100)
      },

      updatePlaylistMeta: (playlistId, data) => {
        set((state) => {
          const playlists = state.userData.playlists.map((pl) => (pl.id === playlistId ? { ...pl, ...data } : pl))
          return { userData: { ...state.userData, playlists } }
        })
        setTimeout(() => {
          get().syncToCloud()
        }, 50)
      },

      addSongsToPlaylist: (playlistId, songs) => {
        if (!Array.isArray(songs) || songs.length === 0) return
        set((state) => {
          const playlists = state.userData.playlists.map((pl) => {
            if (pl.id !== playlistId) return pl
            const existingIds = new Set(pl.songs.map((s) => s.id))
            const toAdd = songs.filter((s) => !existingIds.has(s.id))
            return { ...pl, songs: [...toAdd, ...pl.songs] }
          })
          return { userData: { ...state.userData, playlists } }
        })
        get().syncToCloud()
      },

      reorderPlaylistItem: (playlistId, from, to) => {
        set((state) => {
          const playlists = state.userData.playlists.map((pl) => {
            if (pl.id !== playlistId) return pl
            const arr = [...pl.songs]
            if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return pl
            const [item] = arr.splice(from, 1)
            arr.splice(to, 0, item)
            return { ...pl, songs: arr }
          })
          return { userData: { ...state.userData, playlists } }
        })
        get().syncToCloud()
      },

      getPlaylistById: (playlistId) => {
        const { userData } = get()
        return userData.playlists.find((p) => p.id === playlistId) || null
      },

      savePlaylist: (playlist) => {
        if (!playlist) return
        set((state) => {
          const isSaved = state.userData.savedPlaylists.some((p) => p.id === playlist.id)
          if (isSaved) return state
          return {
            userData: {
              ...state.userData,
              savedPlaylists: [playlist, ...state.userData.savedPlaylists],
            },
          }
        })
        get().syncToCloud()
      },

      unsavePlaylist: (playlistId) => {
        if (!playlistId) return
        set((state) => ({
          userData: {
            ...state.userData,
            savedPlaylists: state.userData.savedPlaylists.filter((p) => p.id !== playlistId),
          },
        }))
        get().syncToCloud()
      },

      isPlaylistSaved: (playlistId) => {
        const { userData } = get()
        return userData.savedPlaylists?.some((p) => p.id === playlistId) || false
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

      /* Lyrics duration updates, results patching */
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

      /* Mood playlists */
      getOrCreateMoodPlaylist: (slug, keywords) => {
        const state = get()
        const id = `mood-${slug}`
        const existing = state.userData.playlists.find((p) => p.id === id)
        const all = [...state.trendingSongs, ...state.userData.favorites, ...state.userData.recentlyPlayed]
        const matches = all.filter((s) => {
          const text = `${s.title} ${s.artist} ${s.album} ${s.genre ?? ""}`.toLowerCase()
          return keywords.some((k) => text.includes(k.toLowerCase()))
        })
        const uniqueMap = new Map<string, Song>()
        matches.forEach((m) => uniqueMap.set(m.id, m))
        const songs = Array.from(uniqueMap.values()).slice(0, 100)

        const mood = moodCatalog[slug]
        const base: Playlist = {
          id,
          name: mood?.name || slug,
          description: mood?.description || "Auto‑updated playlist",
          image: mood?.image || "/music-playlist.png",
          songs,
          createdAt: existing?.createdAt || new Date().toISOString(),
          isPublic: false,
        }

        if (existing) {
          set((st) => ({
            userData: {
              ...st.userData,
              playlists: st.userData.playlists.map((p) => (p.id === id ? { ...base } : p)),
            },
          }))
          set((st) => ({
            curatedPlaylists: [
              ...curatedPlaylistsDefault,
              ...Object.keys(moodCatalog).map((ms) => st.userData.playlists.find((p) => p.id === `mood-${ms}`) || base),
            ],
          }))
          return { ...base }
        } else {
          set((st) => ({
            userData: { ...st.userData, playlists: [{ ...base }, ...st.userData.playlists] },
          }))
          set((st) => ({
            curatedPlaylists: [
              ...curatedPlaylistsDefault,
              ...Object.keys(moodCatalog).map((ms) => st.userData.playlists.find((p) => p.id === `mood-${ms}`) || base),
            ],
          }))
          return { ...base }
        }
      },

      updateMoodPlaylists: () => {
        Object.entries(moodCatalog).forEach(([slug, cfg]) => {
          get().getOrCreateMoodPlaylist(slug, cfg.keywords)
        })
      },

      /* Health */
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
      addToSearchHistory: (query) => {
        if (!query?.trim()) return
        set((state) => {
          const current = Array.isArray(state.searchHistory) ? state.searchHistory : []
          const filtered = current.filter((q) => q !== query)
          return { searchHistory: [query, ...filtered.slice(0, 9)] }
        })
        setTimeout(() => {
          get().syncToCloud()
        }, 500)
      },
      clearSearchHistory: () => set({ searchHistory: [] }),

      checkApiStatus: async () => {
        const now = Date.now()
        const { lastApiCheck } = get()
        if (now - lastApiCheck < 10000) return
        set({ lastApiCheck: now })
        try {
          const response = await getTrendingMusic()
          if (response.success) {
            set({ apiStatus: "healthy", workingApis: ["saavn.sumit.co"] })
          } else {
            set({ apiStatus: "unhealthy", workingApis: [] })
          }
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

      getArtistById: (artistId) => {
        const { artists } = get()
        return artists.find((artist) => artist.id === artistId) || null
      },

      trackInteraction: async (songId, type, skipTime, durationPlayed, totalDuration) => {
        const { currentSong, currentUserId } = get()

        if (!currentSong || !currentUserId) return

        try {
          const { trackSongInteraction } = await import("./supabase-helpers")
          await trackSongInteraction(
            currentUserId,
            songId,
            { title: currentSong.title, artist: currentSong.artist },
            type,
            skipTime,
            durationPlayed,
            totalDuration,
          )

          set((state) => ({
            userPreferences: {
              ...state.userPreferences,
              lastInteractionTime: Date.now(),
            },
          }))
        } catch (error) {
          console.error("Failed to track interaction:", error)
        }
      },

      loadUserPreferences: async () => {
        const { currentUserId } = get()
        if (!currentUserId) return

        try {
          const { getAIRecommendations, getDislikedSongs } = await import("./supabase-helpers")
          const [prefs, disliked] = await Promise.all([
            getAIRecommendations(currentUserId),
            getDislikedSongs(currentUserId),
          ])

          set((state) => ({
            userPreferences: {
              preferredGenres: prefs.preferredGenres || [],
              preferredArtists: prefs.preferredArtists || [],
              dislikedSongs: new Set(disliked.map((s) => s.song_id)),
              lastInteractionTime: state.userPreferences.lastInteractionTime,
            },
          }))
        } catch (error) {
          console.error("Failed to load preferences:", error)
        }
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
        savedPlaylists: state.savedPlaylists || [],
        userPreferences: {
          ...state.userPreferences,
          dislikedSongs: Array.from(state.userPreferences?.dislikedSongs || []),
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.userPreferences) {
          const dislikedSongsData = state.userPreferences.dislikedSongs
          if (Array.isArray(dislikedSongsData)) {
            state.userPreferences.dislikedSongs = new Set(dislikedSongsData)
          } else if (!(dislikedSongsData instanceof Set)) {
            state.userPreferences.dislikedSongs = new Set()
          }
        }
      },
    },
  ),
)
