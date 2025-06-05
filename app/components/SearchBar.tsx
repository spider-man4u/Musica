"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { motion, AnimatePresence } from "framer-motion"

interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

export default function SearchBar({ placeholder = "Search...", className = "", onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { searchContent, searchHistory } = useStore()

  // Predefined popular search terms
  const popularSearchTerms = [
    "Arijit Singh",
    "Bollywood Hits",
    "Latest Songs",
    "AR Rahman",
    "Romantic Songs",
    "Party Mix",
    "Neha Kakkar",
    "Atif Aslam",
    "Shreya Ghoshal",
    "Punjabi Hits",
  ]

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    // Filter from popular terms and recent searches
    const matchingPopular = popularSearchTerms.filter((term) => term.toLowerCase().includes(query.toLowerCase()))

    const matchingHistory = searchHistory.filter((term) => term.toLowerCase().includes(query.toLowerCase()))

    // Combine and remove duplicates
    const combined = [...new Set([...matchingHistory, ...matchingPopular])]

    // Limit to 5 suggestions
    setSuggestions(combined.slice(0, 5))
  }, [query, searchHistory])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return

      setShowSuggestions(false)

      if (onSearch) {
        onSearch(searchQuery)
      } else {
        await searchContent(searchQuery)
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      }
    },
    [onSearch, searchContent, router],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch(query)
      }
    },
    [query, handleSearch],
  )

  const clearSearch = useCallback(() => {
    setQuery("")
    setShowSuggestions(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-full"
        />
        {query && (
          <Button
            size="icon"
            variant="ghost"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSearch(suggestion)}
                className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center space-x-3 transition-colors"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-white">{suggestion}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
