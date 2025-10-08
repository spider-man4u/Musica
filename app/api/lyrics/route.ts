import { NextResponse } from "next/server"

type LyricLine = { t?: number; text: string }

function toSeconds(tag: string) {
  // [mm:ss.xx] -> seconds
  const m = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?]/.exec(tag)
  if (!m) return undefined
  const min = Number(m[1])
  const sec = Number(m[2])
  const ms = m[3] ? Number(m[3]) : 0
  return min * 60 + sec + ms / 1000
}

function generateFallbackLyrics(title: string, artist: string): { type: "plain"; lyrics: string } {
  const verses = [
    `${title} - ${artist}`,
    "La la la ...",
    "Feel the rhythm, feel the beat,",
    "Music takes us to the street.",
    "Sing it loud, sing it clear,",
    "Melody we love to hear.",
  ]
  return { type: "plain", lyrics: verses.join("\n") }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") || "Unknown"
  const artist = searchParams.get("artist") || "Unknown"

  // In a real app you could call a lyrics provider here.
  // We return a simple but structured response with basic timed lines demo.
  const timed = [
    "[00:02.00] " + title,
    "[00:08.00] by " + artist,
    "[00:14.00] La la la ...",
    "[00:20.00] Feel the rhythm, feel the beat,",
    "[00:26.00] Music takes us to the street.",
    "[00:32.00] Sing it loud, sing it clear,",
    "[00:38.00] Melody we love to hear.",
  ]

  const lines: LyricLine[] = timed.map((l) => {
    const m = l.match(/^\[(.*?)\]\s*(.*)$/)
    if (!m) return { text: l }
    return { t: toSeconds("[" + m[1] + "]"), text: m[2] }
  })

  return NextResponse.json({
    success: true,
    type: "lrc",
    title,
    artist,
    lines,
    fallback: generateFallbackLyrics(title, artist),
  })
}
