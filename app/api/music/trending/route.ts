import { NextResponse } from "next/server"

type ModernSong = {
  id: string
  title: string
  artist: string
  album?: string
  image?: string
  duration?: number
  language?: string
  release_date?: string
  explicit?: boolean
  label?: string
  quality?: string
  external_urls?: {
    saavn?: string
    spotify?: string
    youtube?: string
  }
  genres?: string[]
  preview_url?: string
  download_url?: string
}

const BASE_URLS = [
  "https://jiosaavn-api-2.vercel.app",
  "https://saavn-api-jade.vercel.app",
  "https://jiosaavn-api-privatecvc.vercel.app",
  "https://saavn.dev",
]

const SEEDED_QUERIES = [
  "trending hindi songs",
  "bollywood hits",
  "arijit singh",
  "punjabi hits",
  "romantic bollywood",
  "party hindi",
  "lofi hindi",
  "90s bollywood",
  "indie hindi",
]

const SAMPLE_SONGS: ModernSong[] = [
  {
    id: "s-1",
    title: "Kesariya",
    artist: "Arijit Singh",
    album: "Brahmastra",
    image: "/album-art-sample.jpg",
    duration: 240,
    language: "hindi",
    release_date: "2022-08-01",
    explicit: false,
    label: "Sony",
    quality: "160kbps",
    external_urls: {},
    genres: ["bollywood", "romantic"],
    preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "s-2",
    title: "Agar Tum Saath Ho",
    artist: "Alka Yagnik",
    album: "Tamasha",
    image: "/album-art-sample.jpg",
    duration: 285,
    language: "hindi",
    release_date: "2015-11-01",
    quality: "160kbps",
    genres: ["bollywood", "romantic"],
    preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "s-3",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    image: "/album-art-sample.jpg",
    duration: 201,
    language: "english",
    release_date: "2019-11-29",
    genres: ["pop", "synthwave"],
    preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    download_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
]

function sanitizeString(text?: string | null): string {
  if (!text) return ""
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .trim()
}

function parseDuration(d: any): number {
  if (typeof d === "number") return d
  if (typeof d === "string") {
    const n = Number.parseInt(d)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function extractImageUrl(imageData: any): string {
  if (!imageData) return "/abstract-album-cover.png"
  if (typeof imageData === "string") return imageData.trim() || "/abstract-album-cover.png"
  if (Array.isArray(imageData)) {
    const qualities = ["500x500", "150x150", "50x50"]
    for (const q of qualities) {
      const img = imageData.find((i) => i?.quality === q)
      if (img?.link || img?.url) return (img.link || img.url).trim()
    }
    for (const img of imageData) {
      if (img?.link || img?.url) return (img.link || img.url).trim()
    }
  }
  return "/abstract-album-cover.png"
}

function extractAudioUrl(audioData: any): string {
  if (!audioData) return ""
  if (typeof audioData === "string") return audioData.trim()
  if (Array.isArray(audioData)) {
    const qualities = ["320kbps", "160kbps", "96kbps", "48kbps"]
    for (const q of qualities) {
      const a = audioData.find((i) => i?.quality === q)
      if (a?.link || a?.url) return (a.link || a.url).trim()
    }
    for (const a of audioData) {
      if (a?.link || a?.url) return (a.link || a.url).trim()
    }
  }
  return ""
}

function transformSong(song: any): ModernSong {
  if (!song) {
    return {
      id: `fallback-${Date.now()}`,
      title: "Unknown Song",
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration: 0,
      image: "/fallback-song-cover.jpg",
      preview_url: "",
      download_url: "",
      language: "hindi",
      quality: "160kbps",
      genres: [],
    }
  }

  const imageUrl = extractImageUrl(song.image)
  const audioUrl = extractAudioUrl(song.downloadUrl || song.download_url)

  return {
    id: song.id || `saavn-${Date.now()}-${Math.random()}`,
    title: sanitizeString(song.name || song.title) || "Unknown Song",
    artist: sanitizeString(song.primaryArtists || song.artist || song.artists) || "Unknown Artist",
    album: sanitizeString(song.album?.name || song.album) || "Unknown Album",
    duration: parseDuration(song.duration),
    image: imageUrl,
    preview_url: audioUrl,
    download_url: audioUrl,
    external_urls: {
      saavn: song.permaUrl || song.url,
      spotify: song.spotify_url,
      youtube: song.youtube_url,
    },
    explicit: Boolean(song.explicitContent || song.explicit),
    release_date: song.year || song.releaseDate,
    language: song.language || "hindi",
    quality:
      (Array.isArray(song.downloadUrl || song.download_url) && (song.downloadUrl || song.download_url)[0]?.quality) ||
      "160kbps",
    label: sanitizeString(song.label),
    genres: Array.isArray(song.genres) ? song.genres : [],
  }
}

async function tryFetchJson(url: string, timeout = 8000): Promise<any> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get("content-type") || ""
    if (ct.includes("application/json")) return await res.json()
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error("Invalid JSON")
    }
  } finally {
    clearTimeout(t)
  }
}

function dedupeByIdOrKey(songs: ModernSong[]): ModernSong[] {
  const seen = new Set<string>()
  const out: ModernSong[] = []
  for (const s of songs) {
    const key = s.id || `${(s.title || "").toLowerCase()}::${(s.artist || "").toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(s)
    }
  }
  return out
}

async function fetchFromCharts(base: string): Promise<ModernSong[]> {
  const url = `${base}/api/charts`
  const json = await tryFetchJson(url, 7000)
  let list: any[] = []
  if (json?.success && json?.data) {
    if (Array.isArray(json.data?.charts)) {
      for (const chart of json.data.charts) {
        if (Array.isArray(chart?.songs)) list.push(...chart.songs)
      }
    }
    if (Array.isArray(json.data?.trending)) list.push(...json.data.trending)
    if (Array.isArray(json)) list = json
  }
  return list.map(transformSong).filter(Boolean)
}

async function fetchFromSearch(base: string, query: string, page: number, limit: number): Promise<ModernSong[]> {
  const url = `${base}/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
  const json = await tryFetchJson(url, 7000)
  if (json?.success && Array.isArray(json?.data?.results)) {
    return json.data.results.map(transformSong).filter(Boolean)
  }
  return []
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const limit = Math.min(30, Math.max(10, Number(searchParams.get("limit") || "20")))
  const now = new Date()
  const seedIndex = (now.getHours() + page - 1) % SEEDED_QUERIES.length
  const seedQuery = SEEDED_QUERIES[seedIndex]

  // Try each base url with charts first, then seeded searches
  for (const base of BASE_URLS) {
    try {
      const fromCharts = await fetchFromCharts(base)
      if (fromCharts.length >= limit) {
        const slice = dedupeByIdOrKey(fromCharts).slice(0, limit)
        return NextResponse.json({ success: true, data: { trending: slice, hasMore: true } })
      }
      const fromSearch1 = await fetchFromSearch(base, seedQuery, page, limit)
      const fromSearch2 = await fetchFromSearch(
        base,
        SEEDED_QUERIES[(seedIndex + 3) % SEEDED_QUERIES.length],
        page,
        limit,
      )
      const merged = dedupeByIdOrKey([...fromCharts, ...fromSearch1, ...fromSearch2]).slice(0, limit)
      if (merged.length) {
        // naive hasMore heuristic
        const hasMore = page < 3 && merged.length === limit
        return NextResponse.json({ success: true, data: { trending: merged, hasMore } })
      }
    } catch {
      // try next base
    }
  }

  // Fallback
  const hasMore = page < 3
  return NextResponse.json({ success: true, data: { trending: SAMPLE_SONGS.slice(0, limit), hasMore } })
}
