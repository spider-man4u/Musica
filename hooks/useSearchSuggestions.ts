"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "./useDebounce"

interface SearchSuggestion {
  id: string
  text: string
  type: "song" | "artist" | "album"
}

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    // Mock suggestions - in real app, this would be an API call
    const mockSuggestions: SearchSuggestion[] = [
      { id: "1", text: `${debouncedQuery} songs`, type: "song" },
      { id: "2", text: `${debouncedQuery} artist`, type: "artist" },
      { id: "3", text: `Best of ${debouncedQuery}`, type: "album" },
      { id: "4", text: `${debouncedQuery} hits`, type: "song" },
      { id: "5", text: `${debouncedQuery} playlist`, type: "album" },
    ]

    // Simulate API delay
    setTimeout(() => {
      setSuggestions(mockSuggestions)
      setIsLoading(false)
    }, 200)
  }, [debouncedQuery])

  return { suggestions, isLoading }
}
