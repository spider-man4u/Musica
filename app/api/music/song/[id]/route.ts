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

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params // Next.js 15 async params [^2]
  if (!id) return NextResponse.json({ success: false, data: null, message: "Missing id" }, { status: 400 })

  for (const base of BASE_URLS) {
    try {
      const url = `${base}/api/songs/${encodeURIComponent(id)}`
      const json = await tryFetchJson(url, 8000)
      if (json?.success && json?.data) {
        const song: ModernSong = transformSong(json.data)
        return NextResponse.json({ success: true, data: song })
      }
    } catch {
      // try next base
    }
  }

  return NextResponse.json({ success: false, data: null, message: "Not found" }, { status: 404 })
}
