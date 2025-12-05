"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  ListMusic,
  Sparkles,
  Zap,
  Heart,
  Trash2,
  GripVertical,
  Music,
  Brain,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { predictSkipProbability } from "@/lib/queue-recommendations"
import { toast } from "@/components/ui/use-toast"

interface EnhancedQueueManagerProps {
  isOpen: boolean
  onClose: () => void
}

const getSkipRiskColor = (probability: number) => {
  if (probability < 20) return "text-green-400"
  if (probability < 50) return "text-yellow-400"
  if (probability < 75) return "text-orange-400"
  return "text-red-400"
}

const getSkipRiskLabel = (probability: number) => {
  if (probability < 20) return "Will play"
  if (probability < 50) return "Might skip"
  if (probability < 75) return "Likely to skip"
  return "High skip risk"
}

const formatTimeSec = (time: number) => {
  if (!time || isNaN(time)) return "0:00"
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function EnhancedQueueManager({ isOpen, onClose }: EnhancedQueueManagerProps) {
  const [sortBy, setSortBy] = useState<"current" | "recommended" | "skip-risk">("current")
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const {
    queue,
    queueIndex,
    currentSong,
    userData,
    userPreferences,
    playFromQueue,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    saveQueueAsPlaylist,
    generateRelatedSongs,
  } = useStore()

  const safeQueue = Array.isArray(queue) ? queue : []
  const safeFavorites = Array.isArray(userData?.favorites) ? userData.favorites : []

  const safeUserPreferences = {
    ...userPreferences,
    dislikedSongs:
      userPreferences?.dislikedSongs instanceof Set
        ? userPreferences.dislikedSongs
        : new Set(Array.isArray(userPreferences?.dislikedSongs) ? userPreferences.dislikedSongs : []),
  }

  // Compute skip probabilities for all queue items
  const queueWithScores = useMemo(
    () =>
      safeQueue.map((song, index) => {
        if (!song || !song.id) return { song: null, index, skipProb: 100 }
        const skipProb = predictSkipProbability(song, safeFavorites, userPreferences)
        return { song, index, skipProb }
      }),
    [safeQueue, safeFavorites, userPreferences],
  )

  // Sort queue based on selected sort method
  const sortedQueue = useMemo(() => {
    const items = [...queueWithScores].filter((item) => item.song !== null)
    switch (sortBy) {
      case "recommended":
        return items.sort((a, b) => {
          if (!a.song || !b.song) return 0
          const aScore = safeFavorites.some((fav) => fav?.id === a.song?.id) ? 100 : 0
          const bScore = safeFavorites.some((fav) => fav?.id === b.song?.id) ? 100 : 0
          return bScore - aScore
        })
      case "skip-risk":
        return items.sort((a, b) => a.skipProb - b.skipProb)
      default:
        return items
    }
  }, [queueWithScores, sortBy, safeFavorites])

  const handleDragStart = useCallback((index: number) => {
    setDraggedItem(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (dropIndex: number) => {
      if (draggedItem === null || draggedItem === dropIndex) return
      moveQueueItem(draggedItem, dropIndex)
      setDraggedItem(null)
    },
    [draggedItem, moveQueueItem],
  )

  const handleAddRelated = useCallback(async () => {
    if (!currentSong) return
    try {
      const added = await generateRelatedSongs(currentSong, 15)
      if (added.length > 0) {
        toast({
          title: "Smart Queue Updated",
          description: `Added ${added.length} recommended songs based on your preferences`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add recommended songs",
        variant: "destructive",
      })
    }
  }, [currentSong, generateRelatedSongs])

  const handleSaveQueue = useCallback(() => {
    const playlist = saveQueueAsPlaylist()
    toast({
      title: "Queue Saved",
      description: `Saved as "${playlist.name}"`,
    })
  }, [saveQueueAsPlaylist])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      className="fixed inset-x-2 md:inset-x-10 z-[70] bottom-32 md:bottom-40 max-h-[70vh]"
    >
      <div className="bg-gradient-to-br from-gray-900/98 to-black/98 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-700 p-4 md:p-6 z-10">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <ListMusic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg md:text-xl">Smart Queue</h3>
                <p className="text-gray-400 text-xs md:text-sm">{safeQueue.length} songs queued</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setSortBy("current")}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors",
                  sortBy === "current" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white",
                )}
              >
                Current
              </button>
              <button
                onClick={() => setSortBy("recommended")}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                  sortBy === "recommended" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white",
                )}
              >
                <Sparkles className="w-3 h-3" /> Recommended
              </button>
              <button
                onClick={() => setSortBy("skip-risk")}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1",
                  sortBy === "skip-risk" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white",
                )}
              >
                <Brain className="w-3 h-3" /> AI Analysis
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddRelated}
                disabled={!currentSong}
                className="text-xs border-gray-600 bg-transparent hover:bg-gray-800 text-gray-300"
              >
                <Sparkles className="w-3 h-3 mr-1" /> Add Smart
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveQueue}
                className="text-xs border-gray-600 bg-transparent hover:bg-gray-800 text-gray-300"
              >
                Save Queue
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearQueue}
                className="text-xs border-red-600/30 bg-transparent hover:bg-red-600/20 text-red-300"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto">
          {safeQueue.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div>
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">No songs in queue</p>
                <p className="text-gray-500 text-sm mt-2">Add songs to get started</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              <AnimatePresence>
                {sortedQueue.map(({ song, index, skipProb }, displayIndex) => {
                  if (!song) return null
                  const isCurrentlyPlaying = index === queueIndex
                  const isFavorite = safeFavorites.some((fav) => fav?.id === song.id)

                  return (
                    <motion.div
                      key={`${song.id}-${displayIndex}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      className={cn(
                        "flex items-center gap-3 p-3 md:p-4 hover:bg-gray-800/50 cursor-pointer group transition-all duration-200",
                        "border-l-2 border-l-transparent hover:border-l-gray-600",
                        isCurrentlyPlaying && "bg-gray-800/30 border-l-green-500",
                      )}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {/* Drag Handle */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-gray-600" />
                      </div>

                      {/* Queue Index */}
                      <div className="w-6 text-center flex-shrink-0">
                        {isCurrentlyPlaying ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse" />
                        ) : (
                          <span className="text-gray-500 text-sm">{index + 1}</span>
                        )}
                      </div>

                      {/* Song Image */}
                      <Image
                        src={song.image || "/placeholder.svg"}
                        alt={song.title || "Song"}
                        width={44}
                        height={44}
                        className="rounded w-11 h-11 object-cover flex-shrink-0"
                      />

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium truncate">{song.title || "Unknown"}</h4>
                        <p className="text-gray-400 text-xs truncate">{song.artist || "Unknown Artist"}</p>
                      </div>

                      {/* Skip Risk Badge (AI Analysis) */}
                      {sortBy === "skip-risk" && (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className={cn("text-xs font-medium", getSkipRiskColor(skipProb))}>
                              {getSkipRiskLabel(skipProb)}
                            </p>
                            <p className="text-gray-500 text-xs">{Math.round(skipProb)}% risk</p>
                          </div>
                          <Zap className={cn("w-4 h-4", getSkipRiskColor(skipProb))} />
                        </div>
                      )}

                      {/* Favorite Indicator */}
                      {isFavorite && <Heart className="w-4 h-4 fill-red-500 text-red-500 flex-shrink-0" />}

                      {/* Duration */}
                      <span className="text-gray-400 text-xs w-10 text-right flex-shrink-0">
                        {formatTimeSec(song.duration || 0)}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            try {
                              moveQueueItem(index, Math.max(0, index - 1))
                            } catch (err) {
                              console.error("Move up error:", err)
                            }
                          }}
                          className="w-7 h-7 text-gray-400 hover:text-white"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            try {
                              moveQueueItem(index, Math.min(safeQueue.length - 1, index + 1))
                            } catch (err) {
                              console.error("Move down error:", err)
                            }
                          }}
                          className="w-7 h-7 text-gray-400 hover:text-white"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            try {
                              removeFromQueue(index)
                            } catch (err) {
                              console.error("Remove from queue error:", err)
                            }
                          }}
                          className="w-7 h-7 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
