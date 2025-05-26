"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react"
import Link from "next/link"

export default function PuzzleGame() {
  const [tiles, setTiles] = useState([])
  const [moves, setMoves] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const initializePuzzle = () => {
    const numbers = Array.from({ length: 15 }, (_, i) => i + 1)
    numbers.push(null) // Empty space

    // Shuffle the array
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }

    setTiles(numbers)
    setMoves(0)
    setIsComplete(false)
    setStartTime(Date.now())
  }

  useEffect(() => {
    initializePuzzle()
  }, [])

  useEffect(() => {
    if (startTime && !isComplete) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [startTime, isComplete])

  const canMove = (index) => {
    const emptyIndex = tiles.indexOf(null)
    const row = Math.floor(index / 4)
    const col = index % 4
    const emptyRow = Math.floor(emptyIndex / 4)
    const emptyCol = emptyIndex % 4

    return (Math.abs(row - emptyRow) === 1 && col === emptyCol) || (Math.abs(col - emptyCol) === 1 && row === emptyRow)
  }

  const moveTile = (index) => {
    if (!canMove(index)) return

    const newTiles = [...tiles]
    const emptyIndex = tiles.indexOf(null)

    newTiles[emptyIndex] = newTiles[index]
    newTiles[index] = null

    setTiles(newTiles)
    setMoves(moves + 1)

    // Check if puzzle is complete
    const isWin = newTiles.slice(0, 15).every((tile, i) => tile === i + 1)
    if (isWin) {
      setIsComplete(true)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/games">
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">15 Puzzle</h1>
          <Button variant="ghost" size="icon" onClick={initializePuzzle} className="text-white">
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-white text-center">
          <div className="glass-dark rounded-2xl p-3">
            <div className="text-sm opacity-70">Moves</div>
            <div className="text-xl font-bold">{moves}</div>
          </div>
          <div className="glass-dark rounded-2xl p-3">
            <div className="text-sm opacity-70">Time</div>
            <div className="text-xl font-bold">{formatTime(elapsedTime)}</div>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-dark rounded-3xl p-6 mb-6"
        >
          <div className="grid grid-cols-4 gap-2 bg-black/30 p-4 rounded-2xl">
            {tiles.map((tile, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: tile ? 1.05 : 1 }}
                whileTap={{ scale: tile ? 0.95 : 1 }}
                onClick={() => moveTile(index)}
                className={`aspect-square rounded-lg flex items-center justify-center text-xl font-bold transition-colors ${
                  tile
                    ? canMove(index)
                      ? "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                      : "bg-gray-600 text-white cursor-not-allowed"
                    : "bg-transparent"
                }`}
                disabled={!tile}
              >
                {tile}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {isComplete && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-dark rounded-3xl p-6 text-center text-white"
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="mb-4">
              You solved the puzzle in {moves} moves and {formatTime(elapsedTime)}!
            </p>
            <Button onClick={initializePuzzle} className="bg-green-500 hover:bg-green-600">
              Play Again
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
