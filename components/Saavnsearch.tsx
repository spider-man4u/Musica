"use client"

import { useState } from "react"
import { searchAll, getHighQualityImage, formatDuration, SaavnSong } from "@/lib/saavnApi"

export default function SaavnSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SaavnSong[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    const songs = await searchAll(query).catch((e) => { console.error(e); return [] })
    setResults(songs)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type song or artist..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button onClick={handleSearch} className="bg-blue-600 text-white px-4 rounded">
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {results.map((song) => (
          <div key={song.id} className="border rounded shadow p-3">
            <img
              src={getHighQualityImage(song.image)}
              alt={song.title}
              className="w-full h-40 object-cover rounded"
            />
            <h2 className="mt-2 font-semibold">{song.title}</h2>
            <p className="text-sm text-gray-600">{song.singers || song.primaryArtists}</p>
            <p className="text-xs text-gray-500">{formatDuration(song.duration)}</p>
            <a
              href={song.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm hover:underline"
            >
              Play on JioSaavn
            </a>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <p className="text-gray-500">No songs found. Try another query.</p>
      )}
    </div>
  )
}
