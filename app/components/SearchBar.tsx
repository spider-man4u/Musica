"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, X, Clock, TrendingUp, Music, User, Disc } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions"
import { useStore } from "@/lib/store"
import Image from "next/image"

interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  autoFocus?: boolean
}

export default function SearchBar({
  placeholder = "Search songs, artists, albums...",
  className,
  onSearch,
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { suggestions, isLoading } = useSearchSuggestions(query)
  const { searchHistory, addToSearchHistory } = useStore()

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setIsFocused(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setQuery(searchQuery)
    setShowSuggestions(false)
    setIsFocused(false)
    addToSearchHistory(searchQuery)
    onSearch?.(searchQuery)
    inputRef.current?.blur()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestions(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query)
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  const clearSearch = () => {
    setQuery("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "song":
        return <Music className="w-4 h-4" />
      case "artist":
        return <User className="w-4 h-4" />
      case "album":
        return <Disc className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div
        className={cn(
          "relative flex items-center bg-white/10 backdrop-blur-sm rounded-full border transition-all duration-200",
          isFocused ? "border-white/30 bg-white/15" : "border-white/20",
        )}
      >
        <Search className="w-5 h-5 text-gray-400 ml-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            setShowSuggestions(true)
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-400 px-4 py-3 focus:outline-none"
        />
        {query && (
          <button onClick={clearSearch} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (isFocused || query) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                  />
                  <span>Searching...</span>
                </div>
              </div>
            ) : (
              <div className="py-2">
                {/* Recent Searches */}
                {!query && searchHistory.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                      <Clock className="w-4 h-4" />
                      <span>Recent searches</span>
                    </div>
                    {searchHistory.slice(0, 3).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="flex items-center space-x-3 w-full p-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                      >
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-white">{search}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                <div className="px-4 py-2">
                  {!query && (
                    <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Popular searches</span>
                    </div>
                  )}

                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSearch(suggestion.text)}
                      className="flex items-center space-x-3 w-full p-2 hover:bg-white/5 rounded-lg transition-colors text-left group"
                    >
                      {suggestion.image ? (
                        <Image
                          src={suggestion.image || "/placeholder.svg"}
                          alt={suggestion.text}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{suggestion.text}</p>
                        {suggestion.artist && <p className="text-gray-400 text-sm truncate">{suggestion.artist}</p>}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {suggestions.length === 0 && query && (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No suggestions found</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
