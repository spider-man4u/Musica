"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "./useDebounce"

interface SearchSuggestion {
  id: string
  text: string
  type: "song" | "artist" | "album" | "query"
  image?: string
  artist?: string
}

const popularSuggestions: SearchSuggestion[] = [
  {
    id: "1",
    text: "Arijit Singh",
    type: "artist",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    text: "Kesariya",
    type: "song",
    artist: "Arijit Singh",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop",
  },
  { id: "3", text: "Bollywood hits", type: "query" },
  {
    id: "4",
    text: "AR Rahman",
    type: "artist",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop",
  },
  {
    id: "5",
    text: "Shreya Ghoshal",
    type: "artist",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop",
  },
  {
    id: "6",
    text: "Raataan Lambiyan",
    type: "song",
    artist: "Tanishk Bagchi",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop",
  },
  { id: "7", text: "Punjabi songs", type: "query" },
  {
    id: "8",
    text: "Dil Bechara",
    type: "song",
    artist: "A.R. Rahman",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop",
  },
  { id: "9", text: "Love songs", type: "query" },
  {
    id: "10",
    text: "Atif Aslam",
    type: "artist",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop",
  },
]

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions(popularSuggestions.slice(0, 6))
      return
    }

    setIsLoading(true)

    // Simulate API call with filtered suggestions
    const filteredSuggestions = popularSuggestions.filter(
      (suggestion) =>
        suggestion.text.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        suggestion.artist?.toLowerCase().includes(debouncedQuery.toLowerCase()),
    )

    // Add query-based suggestions
    const querySuggestions: SearchSuggestion[] = [
      { id: `query-${debouncedQuery}`, text: debouncedQuery, type: "query" },
      { id: `query-${debouncedQuery}-songs`, text: `${debouncedQuery} songs`, type: "query" },
      { id: `query-${debouncedQuery}-artist`, text: `${debouncedQuery} artist`, type: "query" },
    ]

    const combinedSuggestions = [...querySuggestions.slice(0, 2), ...filteredSuggestions.slice(0, 4)]

    setTimeout(() => {
      setSuggestions(combinedSuggestions)
      setIsLoading(false)
    }, 200)
  }, [debouncedQuery])

  return { suggestions, isLoading }
}
