"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Play, Heart, MoreHorizontal, X, RefreshCw, TrendingUp, Music, Brain, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [activeTab, setActiveTab] = useState("smart")

  const {
    userData,
    currentSong,
    trendingSongs,
    playSong,
    addToFavorites,
    removeFromFavorites,
    generateAISuggestions,
    getPersonalizedRecommendations,
  } = useStore()

  const [smartRecommendations, setSmartRecommendations] = useState<any[]>([])
  const [moodBasedRecommendations, setMoodBasedRecommendations] = useState<any[]>([])
  const [similarArtistRecommendations, setSimilarArtistRecommendations] = useState<any[]>([])
  const [trendingRecommendations, setTrendingRecommendations] = useState<any[]>([])

  useEffect(() => {
    if (isVisible) {
      generateAllRecommendations()
    }
  }, [isVisible])

  const generateAllRecommendations = async () => {
    setIsGenerating(true)
    try {
      // Smart AI Recommendations
      const smart = currentSong ? await generateAISuggestions(currentSong) : getPersonalizedRecommendations()

      // Mood-based recommendations
      const moodBased = generateMoodBasedRecommendations()

      // Similar artist recommendations
      const similarArtist = generateSimilarArtistRecommendations()

      // Trending recommendations
      const trending = trendingSongs.slice(0, 10)

      setSmartRecommendations(smart)
      setMoodBasedRecommendations(moodBased)
      setSimilarArtistRecommendations(similarArtist)
      setTrendingRecommendations(trending)
    } catch (error) {
      console.error("Failed to generate recommendations:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateMoodBasedRecommendations = () => {
    const currentHour = new Date().getHours()
    let moodKeywords = []

    if (currentHour < 6) {
      moodKeywords = ["chill", "ambient", "calm"]
    } else if (currentHour < 12) {
      moodKeywords = ["energetic", "upbeat", "morning"]
    } else if (currentHour < 18) {
      moodKeywords = ["focus", "productive", "work"]
    } else {
      moodKeywords = ["relaxing", "evening", "unwind"]
    }

    return trendingSongs
      .filter((song) => {
        const title = song.title?.toLowerCase() || ""
        const genre = song.genre?.toLowerCase() || ""
        return moodKeywords.some((keyword) => title.includes(keyword) || genre.includes(keyword))
      })
      .slice(0, 8)
  }

  const generateSimilarArtistRecommendations = () => {
    if (!userData.favorites.length) return trendingSongs.slice(0, 8)

    const favoriteArtists = [...new Set(userData.favorites.map((song) => song.artist))]

    return trendingSongs
      .filter((song) =>
        favoriteArtists.some(
          (artist) =>
            song.artist?.toLowerCase().includes(artist.toLowerCase()) ||
            artist.toLowerCase().includes(song.artist?.toLowerCase() || ""),
        ),
      )
      .slice(0, 8)
  }

  const handlePlaySong = (song: any, playlist: any[]) => {
    playSong(song, playlist)
  }

  const toggleFavorite = (song: any) => {
    const isFavorite = userData.favorites.some((fav) => fav.id === song.id)
    if (isFavorite) {
      removeFromFavorites(song.id)
    } else {
      addToFavorites(song)
    }
  }

  const formatDuration = (duration: number | string) => {
    if (typeof duration === "string") return duration
    if (!duration || isNaN(duration)) return "3:45"
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getRecommendationReason = (song: any, type: string) => {
    switch (type) {
      case "smart":
        return currentSong ? `Similar to "${currentSong.title}"` : "Based on your listening history"
      case "mood":
        const hour = new Date().getHours()
        if (hour < 6) return "Perfect for late night"
        if (hour < 12) return "Great for morning energy"
        if (hour < 18) return "Ideal for focus time"
        return "Perfect for evening relaxation"
      case "artist":
        return "From artists you love"
      case "trending":
        return "Popular right now"
      default:
        return "Recommended for you"
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
          className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-hidden"
        >
          <Card className="bg-transparent border-0 h-full">
            <CardHeader className="border-b border-gray-700 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-2xl">AI Music Recommendations</CardTitle>
                    <p className="text-gray-400 text-sm">Powered by advanced AI algorithms</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateAllRecommendations}
                    disabled={isGenerating}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
                    Refresh All
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

            <CardContent className="p-6 h-full overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 bg-gray-800 mb-6">
                  <TabsTrigger
                    value="smart"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Smart AI
                  </TabsTrigger>
                  <TabsTrigger
                    value="mood"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Mood Based
                  </TabsTrigger>
                  <TabsTrigger
                    value="artist"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Similar Artists
                  </TabsTrigger>
                  <TabsTrigger
                    value="trending"
                    className="data-[state=active]:bg-orange-600 data-[state=active]:text-white flex items-center"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trending
                  </TabsTrigger>
                </TabsList>

                {isGenerating ? (
                  <div className="flex items-center justify-center py-12 flex-1">
                    <div className="flex items-center space-x-3 text-gray-400">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"
                      />
                      <span>Generating AI recommendations...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="smart" className="h-full overflow-y-auto">
                      <RecommendationGrid
                        songs={smartRecommendations}
                        type="smart"
                        onPlay={handlePlaySong}
                        onToggleFavorite={toggleFavorite}
                        userData={userData}
                        getRecommendationReason={getRecommendationReason}
                        formatDuration={formatDuration}
                      />
                    </TabsContent>

                    <TabsContent value="mood" className="h-full overflow-y-auto">
                      <RecommendationGrid
                        songs={moodBasedRecommendations}
                        type="mood"
                        onPlay={handlePlaySong}
                        onToggleFavorite={toggleFavorite}
                        userData={userData}
                        getRecommendationReason={getRecommendationReason}
                        formatDuration={formatDuration}
                      />
                    </TabsContent>

                    <TabsContent value="artist" className="h-full overflow-y-auto">
                      <RecommendationGrid
                        songs={similarArtistRecommendations}
                        type="artist"
                        onPlay={handlePlaySong}
                        onToggleFavorite={toggleFavorite}
                        userData={userData}
                        getRecommendationReason={getRecommendationReason}
                        formatDuration={formatDuration}
                      />
                    </TabsContent>

                    <TabsContent value="trending" className="h-full overflow-y-auto">
                      <RecommendationGrid
                        songs={trendingRecommendations}
                        type="trending"
                        onPlay={handlePlaySong}
                        onToggleFavorite={toggleFavorite}
                        userData={userData}
                        getRecommendationReason={getRecommendationReason}
                        formatDuration={formatDuration}
                      />
                    </TabsContent>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

interface RecommendationGridProps {
  songs: any[]
  type: string
  onPlay: (song: any, playlist: any[]) => void
  onToggleFavorite: (song: any) => void
  userData: any
  getRecommendationReason: (song: any, type: string) => string
  formatDuration: (duration: number | string) => string
}

function RecommendationGrid({
  songs,
  type,
  onPlay,
  onToggleFavorite,
  userData,
  getRecommendationReason,
  formatDuration,
}: RecommendationGridProps) {
  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">No recommendations available</p>
        <p className="text-gray-500 text-sm">Try playing some music to get better recommendations</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {songs.map((song, index) => {
        if (!song) return null
        const isFavorite = userData.favorites.some((fav: any) => fav.id === song.id)

        return (
          <motion.div
            key={song.id}
            variants={itemVariants}
            className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-800/50 cursor-pointer group transition-all duration-200 border border-gray-700/50 hover:border-gray-600"
            whileHover={{ x: 4 }}
          >
            <div className="relative">
              <Image
                src={song.image || "/placeholder.svg?height=56&width=56"}
                alt={song.title}
                width={56}
                height={56}
                className="rounded-lg"
              />
              <div
                onClick={() => onPlay(song, songs)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
              >
                <Play className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate text-base">{song.title}</h4>
              <p className="text-gray-400 text-sm truncate">{song.artist}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">
                  {getRecommendationReason(song, type)}
                </Badge>
                {song.genre && (
                  <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                    {song.genre}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-gray-400 text-sm">{formatDuration(song.duration)}</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onToggleFavorite(song)}
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
  )
}
