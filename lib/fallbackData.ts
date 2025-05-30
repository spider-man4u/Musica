"use client"

// Minimal fallback data only used when ALL APIs fail
export const fallbackSongs = [
  {
    id: "fallback-1",
    name: "API Connection Lost",
    primaryArtists: "System Message",
    album: { name: "Error State" },
    duration: "0",
    image: [{ link: "/placeholder.svg?height=300&width=300" }],
    downloadUrl: [{ link: "" }],
    language: "system",
    year: "2024",
  },
]

export const fallbackTrendingResponse = {
  success: true,
  data: {
    trending: fallbackSongs,
  },
}

export const fallbackSearchResponse = {
  success: true,
  data: {
    results: [],
    total: 0,
  },
}
