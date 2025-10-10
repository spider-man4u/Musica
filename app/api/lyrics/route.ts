import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const artist = searchParams.get("artist") || ""
    const title = searchParams.get("title") || ""
    if (!artist || !title) {
      return NextResponse.json({ lyrics: null }, { status: 200 })
    }

    // Try lyrics.ovh first (plain text). If it fails, fall back to placeholder.
    try {
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.lyrics) {
          return NextResponse.json({ lyrics: data.lyrics as string })
        }
      }
    } catch {
      // ignore and fallback
    }

    // Fallback placeholder
    const placeholder = `${title} - ${artist}\n\nLyrics currently unavailable.\nWe'll keep trying to fetch them...`
    return NextResponse.json({ lyrics: placeholder })
  } catch (e) {
    return NextResponse.json({ lyrics: null }, { status: 200 })
  }
}
