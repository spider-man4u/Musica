import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const songId = searchParams.get("songId") || ""
    const artist = searchParams.get("artist") || ""
    const title = searchParams.get("title") || ""

    if (songId) {
      try {
        const res = await fetch(`https://saavn.me/lyrics?id=${encodeURIComponent(songId)}`, {
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
        // Fallback to next method
      }
    }

    if (artist && title) {
      try {
        const res = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          },
        )
        if (res.ok) {
          const data = await res.json()
          if (data?.lyrics) {
            return NextResponse.json({ lyrics: data.lyrics as string })
          }
        }
      } catch {
        // Fallback to placeholder
      }
    }

    const placeholder = `${title || "Song"} - ${artist || "Artist"}\n\nLyrics not available at the moment.\nEnjoy the music!`
    return NextResponse.json({ lyrics: placeholder })
  } catch (e) {
    return NextResponse.json({ lyrics: null }, { status: 200 })
  }
}
