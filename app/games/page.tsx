"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  GamepadIcon,
  Dices,
  Target,
  Zap,
  Puzzle,
  Grid3X3,
  Gamepad2,
  Brain,
  Trophy,
  Sparkles,
  Shuffle,
  Timer,
  ArrowUp,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const games = [
  {
    title: "Tic Tac Toe",
    path: "/games/tic-tac-toe",
    icon: Target,
    color: "from-purple-500 to-pink-500",
    description: "Classic strategy game",
    difficulty: "Easy",
  },
  {
    title: "Flappy Bird",
    path: "/games/flappy-bird",
    icon: GamepadIcon,
    color: "from-blue-500 to-cyan-500",
    description: "Navigate through pipes",
    difficulty: "Hard",
  },
  {
    title: "Memory Game",
    path: "/games/memory",
    icon: Brain,
    color: "from-green-500 to-emerald-500",
    description: "Match the pairs",
    difficulty: "Medium",
  },
  {
    title: "Snake Game",
    path: "/games/snake",
    icon: Zap,
    color: "from-green-600 to-lime-500",
    description: "Eat and grow longer",
    difficulty: "Medium",
  },
  {
    title: "Tetris",
    path: "/games/tetris",
    icon: Grid3X3,
    color: "from-purple-600 to-indigo-500",
    description: "Clear lines with blocks",
    difficulty: "Hard",
  },
  {
    title: "15 Puzzle",
    path: "/games/puzzle",
    icon: Puzzle,
    color: "from-orange-500 to-red-500",
    description: "Slide to arrange numbers",
    difficulty: "Medium",
  },
  {
    title: "2048",
    path: "/games/2048",
    icon: Gamepad2,
    color: "from-yellow-500 to-orange-500",
    description: "Combine tiles to reach 2048",
    difficulty: "Hard",
  },
  {
    title: "Word Search",
    path: "/games/word-search",
    icon: Sparkles,
    color: "from-teal-500 to-blue-500",
    description: "Find hidden words",
    difficulty: "Easy",
  },
  {
    title: "Color Match",
    path: "/games/color-match",
    icon: Dices,
    color: "from-pink-500 to-rose-500",
    description: "Match the colors quickly",
    difficulty: "Medium",
  },
  {
    title: "Number Puzzle",
    path: "/games/number-puzzle",
    icon: Trophy,
    color: "from-indigo-500 to-purple-500",
    description: "Solve math challenges",
    difficulty: "Hard",
  },
  {
    title: "Card Flip",
    path: "/games/card-flip",
    icon: Shuffle,
    color: "from-emerald-500 to-teal-500",
    description: "Memory card matching",
    difficulty: "Easy",
  },
  {
    title: "Speed Tap",
    path: "/games/speed-tap",
    icon: Timer,
    color: "from-red-500 to-pink-500",
    description: "Test your reaction time",
    difficulty: "Medium",
  },
]

export default function Games() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400"
      case "Medium":
        return "text-yellow-400"
      case "Hard":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-32">
      <div className="max-w-md mx-auto">
        <div className="pt-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Games</h1>
          <p className="text-white/70">Choose your favorite game to play</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {games.map((game, index) => (
            <Link href={game.path} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.1 },
                }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`glass-dark rounded-3xl p-6 relative overflow-hidden cursor-pointer card-hover group`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-30 transition-opacity`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <game.icon className="w-8 h-8 text-white" />
                    <span className={`text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                      {game.difficulty}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
                    {game.title}
                  </h2>

                  <p className="text-white/70 text-sm group-hover:text-white/80 transition-colors">
                    {game.description}
                  </p>
                </div>

                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Featured Game Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass-purple rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30" />
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
              <h3 className="text-xl font-bold text-white">Game of the Day</h3>
            </div>
            <p className="text-white/80 mb-4">
              Challenge yourself with our featured game and compete for the highest score!
            </p>
            <Link href="/games/snake">
              <Button className="bg-white/20 hover:bg-white/30 text-white rounded-full px-6 backdrop-blur-sm">
                Play Snake Game
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Scroll to top button */}
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-32 right-6 w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center shadow-lg z-40"
          >
            <ArrowUp className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </div>
    </main>
  )
}
