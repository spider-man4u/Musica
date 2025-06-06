"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Play, Heart, MoreHorizontal, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.0, 0.0, 0.2, 1],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 1, 1],
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.0, 0.0, 0.2, 1],
    },
  },
}

interface AIRecommendationsProps {
  isVisible: boolean
  onClose: () => void
}

export default function AIRecommendations({ isVisible, onClose }: AIRecommendationsProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    userData,
    currentSong,
    playSong,
    addToFavorites,
    removeFromFavorites,
    generateAISuggestions,
    getPersonalizedRecommendations,
  } = useStore()

  const [recommendations, setRecommendations] = useState(userData.aiSuggestions || [])

  useEffect(() => {
    if (isVisible && recommendations.length === 0) {
      generateRecommendations()
    }
  }, [isVisible])

  const generateRecommendations = async () => {
    setIsGenerating(true)
    try {
      let newRecommendations = []

      if (currentSong) {
        // Generate AI suggestions based on current song
        newRecommendations = await generateAISuggestions(currentSong)
      } else {
        // Generate personalized recommendations
        newRecommendations = getPersonalizedRecommendations()
      }

      setRecommendations(newRecommendations)
    } catch (error) {
      console.error("Failed to generate recommendations:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlaySong = (song: any, index: number) => {
    playSong(song, recommendations)
  }

  const toggleFavorite = (song: any) => {
    const isFavorite = userData.favorites.some((fav) => fav.id === song.id)
    if (isFavorite) {
      removeFromFavorites(song.id)
    } else {
      addToFavorites(song)
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[80vh] overflow-hidden"
        >
          <Card className="bg-transparent border-0">
            <CardHeader className="border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl">AI Recommendations</CardTitle>
                    <p className="text-gray-400 text-sm">
                      {currentSong ? `Based on "${currentSong.title}"` : "Personalized for you"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateRecommendations}
                    disabled={isGenerating}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3 text-gray-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                    />
                    <span>Generating AI recommendations...</span>
                  </div>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No recommendations available</p>
                  <Button onClick={generateRecommendations} className="bg-purple-600 hover:bg-purple-700">
                    Generate Recommendations
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recommendations.map((song, index) => {
                    const isFavorite = userData.favorites.some((fav) => fav.id === song.id)

                    return (
                      <motion.div
                        key={song.id}
                        variants={itemVariants}
                        className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer group transition-all duration-200"
                        whileHover={{ x: 4 }}
                      >
                        <div className="relative">
                          <Image
                            src={song.image || "/placeholder.svg?height=48&width=48"}
                            alt={song.title}
                            width={48}
                            height={48}
                            className="rounded-lg"
                          />
                          <div
                            onClick={() => handlePlaySong(song, index)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                          >
                            <Play className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{song.title}</h4>
                          <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {song.mood && (
                              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                                {song.mood}
                              </Badge>
                            )}
                            {song.genre && (
                              <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                                {song.genre}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleFavorite(song)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white w-8 h-8"
                          >
                            <Heart className={cn("w-4 h-4", isFavorite && "fill-red-500 text-red-500")} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white w-8 h-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {recommendations.length > 0 && !isGenerating && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm">{recommendations.length} AI-generated recommendations</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (recommendations.length > 0) {
                          playSong(recommendations[0], recommendations)
                        }
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play All
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
