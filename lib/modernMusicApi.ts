"use client"

const API_BASE_URL = "https://saavn.sumit.co/api"

const TIMEOUTS = {
  search: 10000,
  trending: 12000,
  details: 8000,
}

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
}

export interface ModernSong {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number
  image?: string
  download_url?: string
  preview_url?: string
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

export interface ModernArtist {
  id: string
  name: string
  image?: string
  bio?: string
  followers?: number
  verified?: boolean
  genres?: string[]
  topSongs?: ModernSong[]
  albums?: ModernAlbum[]
  popularity?: number
}

export interface ModernAlbum {
  id: string
  name: string
  artist: string
  image?: string
  releaseDate?: string
  songCount?: number
  songs?: ModernSong[]
}

export interface ModernPlaylist {
  id: string
  name: string
  description?: string
  image?: string
  songCount?: number
  followerCount?: number
  songs?: ModernSong[]
  isPublic?: boolean
  link?: string
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

function exponentialBackoff(attempt: number): number {
  const delay = Math.min(RETRY_CONFIG.baseDelay * Math.pow(2, attempt), RETRY_CONFIG.maxDelay)
  return delay + Math.random() * 1000
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    console.log(`📡 [FETCH] ${url}`)
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })
    clearTimeout(timeoutId)
    console.log(`📡 [STATUS] ${response.status} ${response.statusText}`)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`)
    }
    throw error
  }
}

async function fetchWithRetry<T>(url: string, timeoutMs = 10000): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`🔄 [ATTEMPT ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}] ${url}`)

      const response = await fetchWithTimeout(url, timeoutMs)

      if (!response.ok) {
        let errorBody = ""
        try {
          errorBody = await response.text()
          console.log(`📦 [ERROR BODY] ${errorBody.substring(0, 500)}`)
        } catch (e) {
          errorBody = "Unable to read error body"
        }
        throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        console.error(`❌ [CONTENT-TYPE] Expected JSON, got: ${contentType}`)
        throw new Error("Invalid response format: Expected JSON")
      }

      const data = await response.json()
      console.log(`✅ [SUCCESS] Response keys:`, Object.keys(data))
      return data as T
    } catch (error) {
      lastError = error as Error
      console.error(`❌ [ATTEMPT ${attempt + 1}] ${lastError.message}`)

      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = exponentialBackoff(attempt)
        console.log(`⏳ [RETRY] Waiting ${Math.round(delay)}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Failed after ${RETRY_CONFIG.maxRetries + 1} attempts: ${lastError?.message}`)
}

class SaavnAPI {
  private extractImageUrl(images: any): string {
    if (!images) return "/abstract-album-cover.png"

    if (Array.isArray(images)) {
      const highest = images[images.length - 1] || images[0]
      if (highest?.url && typeof highest.url === "string") {
        return highest.url
      }
    }

    if (typeof images === "string") {
      return images
    }

    return "/abstract-album-cover.png"
  }

  private extractAudioUrl(downloadUrls: any): string {
    if (!downloadUrls) return ""

    if (Array.isArray(downloadUrls)) {
      const highest320 = downloadUrls.find((item: any) => item.quality === "320kbps")
      if (highest320?.url && typeof highest320.url === "string") {
        return highest320.url
      }

      const highest = downloadUrls[downloadUrls.length - 1] || downloadUrls[0]
      if (highest?.url && typeof highest.url === "string") {
        return highest.url
      }
    }

    if (typeof downloadUrls === "string") {
      return downloadUrls
    }

    return ""
  }

  private transformSong(song: any): ModernSong | null {
    if (!song) {
      console.warn("⚠️ Received null/undefined song")
      return null
    }

    try {
      const songData = song.song || song

      console.log(`🎵 [TRANSFORMING] ${songData.name || "Unknown"}`)

      const imageUrl = this.extractImageUrl(songData.image || songData.artwork || songData.thumbnail || songData.images)
      const audioUrl = this.extractAudioUrl(
        songData.downloadUrl || songData.download || songData.audioUrl || songData.preview_url,
      )

      let artistName = "Unknown Artist"
      if (songData.primary_artists) {
        artistName = String(songData.primary_artists).split(",")[0] || "Unknown Artist"
      } else if (songData.primaryArtists) {
        artistName = String(songData.primaryArtists).split(",")[0] || "Unknown Artist"
      } else if (songData.artist) {
        if (typeof songData.artist === "string") {
          artistName = songData.artist
        } else if (typeof songData.artist === "object" && songData.artist?.name) {
          artistName = songData.artist.name
        } else if (Array.isArray(songData.artist)) {
          artistName = songData.artist.map((a: any) => a.name || a).join(", ")
        }
      } else if (songData.artists) {
        if (Array.isArray(songData.artists)) {
          artistName = songData.artists.map((a: any) => (typeof a === "string" ? a : a?.name || a)).join(", ")
        } else if (typeof songData.artists === "object" && songData.artists?.name) {
          artistName = songData.artists.name
        } else if (typeof songData.artists === "string") {
          artistName = songData.artists
        }
      }

      const result: ModernSong = {
        id: songData.id || songData.videoId || `song-${Date.now()}-${Math.random()}`,
        title: sanitizeString(songData.name || songData.title || songData.song) || "Unknown Song",
        artist: sanitizeString(artistName) || "Unknown Artist",
        album: sanitizeString(songData.album?.name || songData.album_name || songData.album) || "Unknown Album",
        duration: Number.parseInt(songData.duration || songData.durationInSec || 0) || 0,
        image: imageUrl,
        download_url: audioUrl,
        preview_url: audioUrl,
        audio: audioUrl,
        external_urls: {
          saavn: songData.url || songData.permaUrl || songData.link,
        },
        language: songData.language || "unknown",
        quality: songData.quality || "320kbps",
        genres: songData.language ? [songData.language] : ["unknown"],
        popularity: songData.play_count ? Math.min(100, Math.floor(songData.play_count / 1000)) : 50,
        explicit: songData.explicit === "1" || songData.explicit === 1 || songData.explicit === true,
        release_date: songData.release_date || songData.year,
        label: songData.label,
        copyright: songData.copyright,
      }

      console.log(`✅ [FINAL] ${result.title}`, {
        artist: result.artist,
        hasImage: !!result.image && result.image !== "/abstract-album-cover.png",
        hasAudio: !!result.audio,
      })

      return result
    } catch (e) {
      console.error("❌ Error transforming song:", e, song)
      return null
    }
  }

  private transformArtist(artist: any): ModernArtist | null {
    if (!artist) return null

    try {
      const artistData = artist.artist || artist

      const result: ModernArtist = {
        id: artistData.id || artistData.artistId || `artist-${Date.now()}-${Math.random()}`,
        name: sanitizeString(artistData.name || artistData.title || artistData.artist_name) || "Unknown Artist",
        image: this.extractImageUrl(artistData.image || artistData.picture || artistData.artwork),
        bio: sanitizeString(artistData.bio || artistData.description || artistData.explanation),
        followers: Number(artistData.follower_count || artistData.followers || 0),
        verified: artistData.verified === true || artistData.verified === "1",
        genres: Array.isArray(artistData.genres) ? artistData.genres : artistData.language ? [artistData.language] : [],
        topSongs: Array.isArray(artistData.top_songs)
          ? artistData.top_songs.map((s: any) => this.transformSong(s)).filter((s: any) => s)
          : [],
        albums: Array.isArray(artistData.albums)
          ? artistData.albums.map((a: any) => this.transformAlbum(a)).filter((a: any) => a)
          : [],
        popularity: Number(artistData.popularity || 50),
      }

      console.log(`✅ [ARTIST TRANSFORMED]`, result.name, result)
      return result
    } catch (e) {
      console.error("❌ Error transforming artist:", e, artist)
      return null
    }
  }

  private transformAlbum(album: any): ModernAlbum | null {
    if (!album) return null

    try {
      const albumData = album.album || album

      const result: ModernAlbum = {
        id: albumData.id || `album-${Date.now()}`,
        name: sanitizeString(albumData.name || albumData.title) || "Unknown Album",
        artist: sanitizeString(
          albumData.primary_artists ||
            albumData.primaryArtists ||
            albumData.artist ||
            albumData.artist_name ||
            "Unknown Artist",
        ),
        image: this.extractImageUrl(albumData.image || albumData.picture),
        releaseDate: albumData.release_date || albumData.year,
        songCount: Number(albumData.song_count || albumData.songs?.length || 0),
        songs: Array.isArray(albumData.songs)
          ? albumData.songs.map((s: any) => this.transformSong(s)).filter((s: any) => s)
          : [],
      }

      console.log(`✅ [ALBUM TRANSFORMED]`, result.name)
      return result
    } catch (e) {
      console.error("❌ Error transforming album:", e)
      return null
    }
  }

  private transformPlaylist(playlist: any): ModernPlaylist | null {
    if (!playlist) return null

    try {
      const playlistData = playlist.playlist || playlist.data?.playlist || playlist

      console.log(`📋 [TRANSFORM PLAYLIST]`, {
        id: playlistData.id,
        name: playlistData.name || playlistData.title || playlistData.playlist_name,
        hasSongs: !!playlistData.songs,
        playlistKeys: Object.keys(playlistData).slice(0, 20),
      })

      let songsArray = []
      if (Array.isArray(playlistData.songs)) {
        songsArray = playlistData.songs
        console.log(`✅ Found songs at playlistData.songs: ${songsArray.length}`)
      } else if (playlistData.data?.songs && Array.isArray(playlistData.data.songs)) {
        songsArray = playlistData.data.songs
        console.log(`✅ Found songs at playlistData.data.songs: ${songsArray.length}`)
      } else if (playlistData.list && Array.isArray(playlistData.list)) {
        songsArray = playlistData.list
        console.log(`✅ Found songs at playlistData.list: ${songsArray.length}`)
      } else if (playlistData.results && Array.isArray(playlistData.results)) {
        songsArray = playlistData.results
        console.log(`✅ Found songs at playlistData.results: ${songsArray.length}`)
      } else if (playlistData.tracks && Array.isArray(playlistData.tracks)) {
        songsArray = playlistData.tracks
        console.log(`✅ Found songs at playlistData.tracks: ${songsArray.length}`)
      } else {
        for (const key in playlistData) {
          if (Array.isArray(playlistData[key]) && playlistData[key].length > 0) {
            const firstItem = playlistData[key][0]
            if (firstItem && (firstItem.id || firstItem.name || firstItem.title)) {
              songsArray = playlistData[key]
              console.log(`✅ Found songs at playlistData.${key}: ${songsArray.length}`)
              break
            }
          }
        }
      }

      console.log(`🔍 [SONGS EXTRACTION] Found ${songsArray.length} songs total`)

      const transformedSongs = songsArray
        .map((s: any, idx: number) => {
          if (!s) return null
          const transformed = this.transformSong(s)
          if (transformed) {
            console.log(`  ✅ [${idx}] Transformed: ${transformed.title}`)
          }
          return transformed
        })
        .filter((s: ModernSong | null) => s && s.id && s.title)

      console.log(`📊 [FINAL COUNT] ${transformedSongs.length} valid songs`)

      const playlistName =
        sanitizeString(
          playlistData.name ||
            playlistData.title ||
            playlistData.playlist_name ||
            playlistData.playlist_title ||
            playlistData.listname,
        ) || "Untitled Playlist"

      const result: ModernPlaylist = {
        id: playlistData.id || playlistData.playlistId || `playlist-${Date.now()}-${Math.random()}`,
        name: playlistName,
        description: sanitizeString(playlistData.description || playlistData.desc || playlistData.explanation),
        image: this.extractImageUrl(playlistData.image || playlistData.picture || playlistData.artwork),
        songCount: Number(playlistData.song_count || playlistData.songCount || transformedSongs.length || 0),
        followerCount: Number(playlistData.follower_count || playlistData.followers || 0),
        isPublic: playlistData.is_public !== false && playlistData.isPublic !== false,
        link: playlistData.link || playlistData.url || playlistData.permaUrl,
        songs: transformedSongs,
      }

      console.log(`✅ [PLAYLIST TRANSFORMED]`, result.name, `${result.songs?.length || 0} songs`)
      return result
    } catch (e) {
      console.error("❌ Error transforming playlist:", e, playlist)
      return null
    }
  }

  async search(query: string, page = 0, limit = 20): Promise<ModernSong[]> {
    if (!query?.trim()) {
      throw new Error("Search query cannot be empty")
    }

    console.log(`\n🔍 [SEARCH] Query: "${query}" (page: ${page}, limit: ${limit})`)

    try {
      const url = `${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.search)

      let songs = data?.data?.results || data?.results || data?.songs || []

      if (!Array.isArray(songs)) {
        console.warn(`⚠️ Songs is not an array, type:`, typeof songs)
        songs = []
      }

      console.log(`✅ Found ${songs.length} songs`)

      const transformed = songs
        .map((s: any) => this.transformSong(s))
        .filter((s: ModernSong | null) => s && s.id && s.title)

      console.log(`✅ Transformed ${transformed.length} songs`)
      return transformed as ModernSong[]
    } catch (error) {
      console.error(`❌ Search error:`, error)
      throw error
    }
  }

  async searchArtists(query: string, page = 0, limit = 10): Promise<ModernArtist[]> {
    if (!query?.trim()) {
      throw new Error("Artist query cannot be empty")
    }

    console.log(`\n👨‍🎤 [ARTISTS] Query: "${query}"`)

    try {
      const url = `${API_BASE_URL}/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.search)
      console.log(`📦 [ARTISTS RESPONSE]`, data)

      let artists = data?.data?.results || data?.results || data?.data || data?.artists || data || []

      if (!Array.isArray(artists)) {
        console.warn(`⚠️ Artists is not an array, trying to extract from response`)
        for (const key in data) {
          if (Array.isArray(data[key])) {
            artists = data[key]
            console.log(`✅ Found array at key: ${key}`)
            break
          }
        }
      }

      console.log(`✅ Got ${artists.length} artists from response`)

      const transformed = artists
        .map((a: any) => {
          console.log(`🎨 Transforming artist:`, a.name || a.title || "Unknown")
          return this.transformArtist(a)
        })
        .filter((a: ModernArtist | null) => {
          const isValid = a && a.id && a.name
          if (!isValid) console.warn(`⚠️ Filtered out invalid artist`)
          return isValid
        })

      console.log(`✅ Final transformed artists: ${transformed.length}`)
      return transformed as ModernArtist[]
    } catch (error) {
      console.error(`❌ Artist search error:`, error)
      throw error
    }
  }

  async searchPlaylists(query: string, page = 0, limit = 20): Promise<ModernPlaylist[]> {
    if (!query?.trim()) {
      throw new Error("Playlist query cannot be empty")
    }

    console.log(`\n📋 [PLAYLISTS] Query: "${query}" (page: ${page}, limit: ${limit})`)

    try {
      const url = `${API_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.search)

      let playlists = data?.data?.results || data?.results || data?.playlists || []

      if (!Array.isArray(playlists)) {
        console.warn(`⚠️ Playlists is not an array, type:`, typeof playlists)
        playlists = []
      }

      console.log(`✅ Found ${playlists.length} playlists`)

      const transformed = playlists
        .map((p: any) => this.transformPlaylist(p))
        .filter((p: ModernPlaylist | null) => p && p.id && p.name)

      console.log(`✅ Transformed ${transformed.length} playlists`)
      return transformed as ModernPlaylist[]
    } catch (error) {
      console.error(`❌ Playlists search error:`, error)
      throw error
    }
  }

  async getTrending(): Promise<ModernSong[]> {
    console.log(`\n📊 [TRENDING] Fetching trending songs...`)

    const trendingSearches = [
      "trending",
      "top 50",
      "viral songs",
      "new releases",
      "best 2024",
      "popular today",
      "most streamed",
      "hot music",
      "latest hits",
      "in demand",
    ]

    let bestResults: ModernSong[] = []
    let successCount = 0

    for (const query of trendingSearches) {
      try {
        console.log(`\n📌 [TRENDING-SEARCH] Query: "${query}"`)
        const url = `${API_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=0&limit=50`

        const data = await fetchWithRetry<any>(url, TIMEOUTS.search)

        const songs = data?.data?.results || data?.results || data?.songs || []

        if (!Array.isArray(songs)) {
          console.warn(`⚠️ Songs not array for "${query}", type:`, typeof songs)
          continue
        }

        console.log(`✅ Got ${songs.length} songs for "${query}"`)

        const transformed = songs
          .map((s: any) => {
            try {
              return this.transformSong(s)
            } catch (e) {
              console.error(`❌ Transform error:`, e)
              return null
            }
          })
          .filter((s: ModernSong | null) => s && s.id && s.title)

        console.log(`✅ Transformed ${transformed.length} songs for "${query}"`)

        if (transformed.length > bestResults.length) {
          bestResults = transformed as ModernSong[]
          successCount++
          console.log(`🏆 New best: ${bestResults.length} songs`)
        }

        if (bestResults.length >= 25) {
          console.log(`✅ Enough results, returning ${bestResults.length} songs`)
          return bestResults
        }
      } catch (error) {
        console.warn(`⚠️ Query "${query}" failed:`, error)
        continue
      }
    }

    if (bestResults.length > 0) {
      console.log(`✅ Returning ${bestResults.length} trending songs from ${successCount} queries`)
      return bestResults
    }

    throw new Error(`Failed to fetch trending songs from ${trendingSearches.length} queries`)
  }

  async getArtistDetails(artistId: string): Promise<ModernArtist | null> {
    if (!artistId?.trim()) {
      throw new Error("Artist ID cannot be empty")
    }

    console.log(`\n👨‍🎤 [ARTIST DETAILS] Artist ID: ${artistId}`)

    try {
      const url = `${API_BASE_URL}/artists?id=${encodeURIComponent(artistId)}&page=1&songCount=10&albumCount=10&sortBy=popularity&sortOrder=desc`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)
      console.log(`📦 [ARTIST DATA]`, data)

      const artist = data?.artist || data?.data?.artist || data

      if (!artist) {
        throw new Error("No artist data in response")
      }

      const transformed = this.transformArtist(artist)
      if (transformed) {
        console.log(`✅ Got artist details: ${transformed.name}`)
        return transformed
      }

      throw new Error("Failed to transform artist")
    } catch (error) {
      console.error(`❌ Artist details error:`, error)
      throw error
    }
  }

  async getArtistSongs(artistId: string): Promise<ModernSong[]> {
    if (!artistId?.trim()) {
      throw new Error("Artist ID cannot be empty")
    }

    console.log(`\n🎵 [ARTIST SONGS] Artist ID: ${artistId}`)

    try {
      const url = `${API_BASE_URL}/artists/${encodeURIComponent(artistId)}/songs?page=0&sortBy=popularity&sortOrder=desc`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)

      let songs = data?.songs || data?.data?.songs || data?.results || []

      if (!Array.isArray(songs)) {
        console.warn(`⚠️ Songs is not an array`)
        songs = []
      }

      const transformed = songs.map((s: any) => this.transformSong(s)).filter((s: ModernSong | null) => s && s.id)

      console.log(`✅ Got ${transformed.length} artist songs`)
      return transformed as ModernSong[]
    } catch (error) {
      console.error(`❌ Artist songs error:`, error)
      throw error
    }
  }

  async getArtistAlbums(artistId: string): Promise<ModernAlbum[]> {
    if (!artistId?.trim()) {
      throw new Error("Artist ID cannot be empty")
    }

    console.log(`\n💿 [ARTIST ALBUMS] Artist ID: ${artistId}`)

    try {
      const url = `${API_BASE_URL}/artists/${encodeURIComponent(artistId)}/albums?page=0&sortBy=popularity&sortOrder=desc`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)

      let albums = data?.albums || data?.data?.albums || data?.results || []

      if (!Array.isArray(albums)) {
        console.warn(`⚠️ Albums is not an array`)
        albums = []
      }

      const transformed = albums.map((a: any) => this.transformAlbum(a)).filter((a: ModernAlbum | null) => a && a.id)

      console.log(`✅ Got ${transformed.length} artist albums`)
      return transformed as ModernAlbum[]
    } catch (error) {
      console.error(`❌ Artist albums error:`, error)
      throw error
    }
  }

  async getPlaylistDetails(playlistId: string): Promise<ModernPlaylist | null> {
    if (!playlistId?.trim()) {
      throw new Error("Playlist ID cannot be empty")
    }

    console.log(`\n📋 [PLAYLIST DETAILS] Playlist ID: ${playlistId}`)

    try {
      const endpoints = [
        `${API_BASE_URL}/playlists?id=${encodeURIComponent(playlistId)}&page=0&limit=1000`,
        `${API_BASE_URL}/playlists?id=${encodeURIComponent(playlistId)}&page=0&limit=500`,
        `${API_BASE_URL}/playlists?id=${encodeURIComponent(playlistId)}&page=0&limit=200`,
        `${API_BASE_URL}/playlists?id=${encodeURIComponent(playlistId)}`,
      ]

      let lastError: Error | null = null

      for (const url of endpoints) {
        try {
          console.log(`📌 Trying endpoint: ${url}`)
          const data = await fetchWithRetry<any>(url, TIMEOUTS.details)
          console.log(`📦 [PLAYLIST RESPONSE STRUCTURE]`, {
            hasPlaylist: !!data?.playlist,
            hasData: !!data?.data,
            responseKeys: Object.keys(data || {}).slice(0, 20),
            playlistKeys: data?.playlist ? Object.keys(data.playlist).slice(0, 20) : [],
            songsLength: data?.playlist?.songs?.length || data?.songs?.length || 0,
          })

          const playlist = data?.playlist || data?.data?.playlist || data

          if (!playlist) {
            console.warn(`⚠️ No playlist data found in this endpoint`)
            lastError = new Error("No playlist data in response")
            continue
          }

          const transformed = this.transformPlaylist(playlist)
          if (transformed) {
            console.log(`✅ Got playlist details: ${transformed.name} with ${transformed.songs?.length || 0} songs`)
            return transformed
          }

          lastError = new Error("Failed to transform playlist")
        } catch (error) {
          lastError = error as Error
          console.warn(`⚠️ Endpoint failed: ${(error as Error).message}`)
          continue
        }
      }

      throw lastError || new Error("All playlist endpoints failed")
    } catch (error) {
      console.error(`❌ Playlist details error:`, error)
      throw error
    }
  }

  async getAlbumDetails(albumId: string): Promise<ModernAlbum | null> {
    if (!albumId?.trim()) {
      throw new Error("Album ID cannot be empty")
    }

    console.log(`\n💿 [ALBUM DETAILS] Album ID: ${albumId}`)

    try {
      const url = `${API_BASE_URL}/albums?id=${encodeURIComponent(albumId)}&page=0&limit=300`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)

      const album = data?.album || data?.data?.album || data

      if (!album) {
        throw new Error("No album data in response")
      }

      const transformed = this.transformAlbum(album)
      if (transformed) {
        console.log(`✅ Got album details: ${transformed.name}`)
        return transformed
      }

      throw new Error("Failed to transform album")
    } catch (error) {
      console.error(`❌ Album details error:`, error)
      throw error
    }
  }

  async getSongDetails(songId: string): Promise<ModernSong | null> {
    if (!songId?.trim()) {
      throw new Error("Song ID cannot be empty")
    }

    console.log(`\n🎵 [DETAILS] Song ID: ${songId}`)

    try {
      const url = `${API_BASE_URL}/songs/${encodeURIComponent(songId)}`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)

      const song = data?.song || data

      if (!song) {
        throw new Error("No song data in response")
      }

      const transformed = this.transformSong(song)
      if (transformed) {
        console.log(`✅ Got details: ${transformed.title}`)
        return transformed
      }

      throw new Error("Failed to transform song")
    } catch (error) {
      console.error(`❌ Song details error:`, error)
      throw error
    }
  }

  async getPlaylistSuggestions(query = "Trending"): Promise<PlaylistSuggestion[]> {
    console.log(`\n📋 [PLAYLISTS] Query: "${query}"`)

    try {
      const url = `${API_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&page=0&limit=10`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.search)

      let playlists = data?.data?.results || data?.results || data?.data || data?.playlists || []

      if (!Array.isArray(playlists)) {
        console.warn(`⚠️ Playlists is not an array`)
        playlists = []
      }

      console.log(`✅ Got ${playlists.length} playlists`)

      return playlists.map((p: any) => ({
        id: p.id || `playlist-${Date.now()}`,
        name: sanitizeString(p.name || p.title) || "Playlist",
        image: p.image || p.thumbnail,
        description: sanitizeString(p.description),
        songCount: p.song_count || p.songCount || 0,
      }))
    } catch (error) {
      console.error(`❌ Playlist suggestions error:`, error)
      throw error
    }
  }

  async getSongSuggestions(songId: string): Promise<ModernSong[]> {
    if (!songId?.trim()) {
      throw new Error("Song ID cannot be empty")
    }

    console.log(`\n🔗 [SUGGESTIONS] Song ID: ${songId}`)

    try {
      const url = `${API_BASE_URL}/songs/${encodeURIComponent(songId)}/suggestions?limit=10`
      console.log(`📌 Endpoint: ${url}`)

      const data = await fetchWithRetry<any>(url, TIMEOUTS.details)

      let suggestions = data?.suggestions || data?.results || data?.songs || data?.data?.results || []

      if (!Array.isArray(suggestions)) {
        console.warn(`⚠️ Suggestions is not an array`)
        suggestions = []
      }

      console.log(`✅ Got ${suggestions.length} suggestions`)

      const transformed = suggestions.map((s: any) => this.transformSong(s)).filter((s: ModernSong | null) => s && s.id)

      return transformed as ModernSong[]
    } catch (error) {
      console.error(`❌ Song suggestions error:`, error)
      throw error
    }
  }

  async getPopularPlaylists(): Promise<ModernPlaylist[]> {
    console.log(`\n📊 [POPULAR PLAYLISTS] Fetching popular playlists...`)

    const popularSearches = [
      "popular playlists",
      "best playlists",
      "trending playlists",
      "new playlists",
      "curated playlists",
      "featured playlists",
      "top playlists",
      "must listen",
      "hit collections",
      "chart toppers",
    ]

    let bestResults: ModernPlaylist[] = []
    let successCount = 0

    for (const query of popularSearches) {
      try {
        console.log(`\n📌 [PLAYLISTS-SEARCH] Query: "${query}"`)
        const url = `${API_BASE_URL}/search/playlists?query=${encodeURIComponent(query)}&page=0&limit=50`

        const data = await fetchWithRetry<any>(url, TIMEOUTS.search)

        const playlists = data?.data?.results || data?.results || data?.playlists || []

        if (!Array.isArray(playlists)) {
          console.warn(`⚠️ Playlists not array for "${query}", type:`, typeof playlists)
          continue
        }

        console.log(`✅ Got ${playlists.length} playlists for "${query}"`)

        const transformed = playlists
          .map((p: any) => {
            try {
              return this.transformPlaylist(p)
            } catch (e) {
              console.error(`❌ Transform error:`, e)
              return null
            }
          })
          .filter((p: ModernPlaylist | null) => p && p.id && p.name)

        console.log(`✅ Transformed ${transformed.length} playlists for "${query}"`)

        if (transformed.length > bestResults.length) {
          bestResults = transformed as ModernPlaylist[]
          successCount++
          console.log(`🏆 New best: ${bestResults.length} playlists`)
        }

        if (bestResults.length >= 12) {
          console.log(`✅ Enough results, returning ${bestResults.length} playlists`)
          return bestResults
        }
      } catch (error) {
        console.warn(`⚠️ Query "${query}" failed:`, error)
        continue
      }
    }

    if (bestResults.length > 0) {
      console.log(`✅ Returning ${bestResults.length} popular playlists from ${successCount} queries`)
      return bestResults
    }

    throw new Error(`Failed to fetch popular playlists`)
  }

  async getLyrics(songId: string): Promise<string> {
    if (!songId?.trim()) return ""

    try {
      const url = `https://saavn.me/lyrics?id=${encodeURIComponent(songId)}`
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "force-cache",
      })

      if (!response.ok) return ""

      const data = await response.json()
      return data?.lyrics || ""
    } catch (error) {
      console.error("Lyrics fetch error:", error)
      return ""
    }
  }
}

const saavnApi = new SaavnAPI()

export async function searchMusic(
  query: string,
): Promise<{ success: boolean; data: { results: ModernSong[] }; message?: string }> {
  try {
    console.log(`\n${"=".repeat(60)}\n🔍 SEARCH MUSIC: "${query}"\n${"=".repeat(60)}`)
    const results = await saavnApi.search(query)
    console.log(`✅ Search successful: ${results.length} results\n`)
    return { success: true, data: { results } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed"
    console.error(`❌ Search failed: ${message}\n`)
    return { success: false, data: { results: [] }, message }
  }
}

export async function searchArtists(
  query: string,
): Promise<{ success: boolean; data: ModernArtist[]; message?: string }> {
  try {
    console.log(`\n👨‍🎤 SEARCH ARTISTS: "${query}"\n`)
    const results = await saavnApi.searchArtists(query)
    console.log(`✅ Artist search successful: ${results.length} results\n`)
    return { success: true, data: results }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Artist search failed"
    return { success: false, data: [], message }
  }
}

export async function searchPlaylists(
  query: string,
): Promise<{ success: boolean; data: ModernPlaylist[]; message?: string }> {
  try {
    console.log(`\n📋 SEARCH PLAYLISTS: "${query}"\n`)
    const results = await saavnApi.searchPlaylists(query)
    console.log(`✅ Playlist search successful: ${results.length} results\n`)
    return { success: true, data: results }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Playlist search failed"
    return { success: false, data: [], message }
  }
}

export async function getTrendingMusic(): Promise<{
  success: boolean
  data: { trending: ModernSong[] }
  message?: string
}> {
  try {
    console.log(`\n${"=".repeat(60)}\n📊 GET TRENDING MUSIC\n${"=".repeat(60)}`)
    const trending = await saavnApi.getTrending()

    if (trending.length > 0) {
      console.log(`✅ Trending successful: ${trending.length} songs\n`)
      return { success: true, data: { trending } }
    }

    return {
      success: false,
      data: { trending: [] },
      message: "No trending songs available",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trending failed"
    console.error(`❌ Trending failed: ${message}\n`)
    return { success: false, data: { trending: [] }, message }
  }
}

export async function getArtistDetails(
  artistId: string,
): Promise<{ success: boolean; data: ModernArtist | null; message?: string }> {
  try {
    const data = await saavnApi.getArtistDetails(artistId)
    return { success: !!data, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get artist details"
    return { success: false, data: null, message }
  }
}

export async function getArtistSongs(
  artistId: string,
): Promise<{ success: boolean; data: ModernSong[]; message?: string }> {
  try {
    const data = await saavnApi.getArtistSongs(artistId)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get artist songs"
    return { success: false, data: [], message }
  }
}

export async function getArtistAlbums(
  artistId: string,
): Promise<{ success: boolean; data: ModernAlbum[]; message?: string }> {
  try {
    const data = await saavnApi.getArtistAlbums(artistId)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get artist albums"
    return { success: false, data: [], message }
  }
}

export async function getPlaylistDetails(
  playlistId: string,
): Promise<{ success: boolean; data: ModernPlaylist | null; message?: string }> {
  try {
    const data = await saavnApi.getPlaylistDetails(playlistId)
    return { success: !!data, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get playlist details"
    return { success: false, data: null, message }
  }
}

export async function getAlbumDetails(
  albumId: string,
): Promise<{ success: boolean; data: ModernAlbum | null; message?: string }> {
  try {
    const data = await saavnApi.getAlbumDetails(albumId)
    return { success: !!data, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get album details"
    return { success: false, data: null, message }
  }
}

export async function getSongDetails(
  songId: string,
): Promise<{ success: boolean; data: ModernSong | null; message?: string }> {
  try {
    const data = await saavnApi.getSongDetails(songId)
    return { success: !!data, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get song details"
    return { success: false, data: null, message }
  }
}

export async function getPlaylistSuggestions(
  query = "Trending",
): Promise<{ success: boolean; data: PlaylistSuggestion[]; message?: string }> {
  try {
    const data = await saavnApi.getPlaylistSuggestions(query)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get playlists"
    return { success: false, data: [], message }
  }
}

export async function getSongSuggestions(
  songId: string,
): Promise<{ success: boolean; data: ModernSong[]; message?: string }> {
  try {
    const data = await saavnApi.getSongSuggestions(songId)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get suggestions"
    return { success: false, data: [], message }
  }
}

export async function getPopularPlaylists(): Promise<{
  success: boolean
  data: { playlists: ModernPlaylist[] }
  message?: string
}> {
  try {
    console.log(`\n${"=".repeat(60)}\n📊 GET POPULAR PLAYLISTS\n${"=".repeat(60)}`)
    const playlists = await saavnApi.getPopularPlaylists()

    if (playlists.length > 0) {
      console.log(`✅ Popular playlists successful: ${playlists.length} playlists\n`)
      return { success: true, data: { playlists } }
    }

    return {
      success: false,
      data: { playlists: [] },
      message: "No popular playlists available",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Popular playlists failed"
    console.error(`❌ Popular playlists failed: ${message}\n`)
    return { success: false, data: { playlists: [] }, message }
  }
}

export async function getLyrics(songId: string): Promise<{ success: boolean; data: string; message?: string }> {
  try {
    const lyrics = await saavnApi.getLyrics(songId)
    return { success: true, data: lyrics }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get lyrics"
    return { success: false, data: "", message }
  }
}

export { sanitizeString }
export type { ModernSong, PlaylistSuggestion, ModernArtist, ModernPlaylist, ModernAlbum }
