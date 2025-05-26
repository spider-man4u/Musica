"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw } from "lucide-react"
import Link from "next/link"

const GRID_SIZE = 4

export default function Game2048() {
  const [board, setBoard] = useState(() =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(0)),
  )
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [hasWon, setHasWon] = useState(false)

  const initializeGame = () => {
    const newBoard = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(0))
    addRandomTile(newBoard)
    addRandomTile(newBoard)
    setBoard(newBoard)
    setScore(0)
    setGameOver(false)
    setHasWon(false)
  }

  const addRandomTile = (board) => {
    const emptyCells = []
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (board[i][j] === 0) {
          emptyCells.push({ x: i, y: j })
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4
    }
  }

  const getTileColor = (value) => {
    const colors = {
      0: "bg-gray-300",
      2: "bg-gray-100 text-gray-800",
      4: "bg-gray-200 text-gray-800",
      8: "bg-orange-300 text-white",
      16: "bg-orange-400 text-white",
      32: "bg-orange-500 text-white",
      64: "bg-red-400 text-white",
      128: "bg-yellow-400 text-white",
      256: "bg-yellow-500 text-white",
      512: "bg-yellow-600 text-white",
      1024: "bg-purple-500 text-white",
      2048: "bg-purple-600 text-white",
    }
    return colors[value] || "bg-purple-700 text-white"
  }

  useEffect(() => {
    initializeGame()
    const saved = localStorage.getItem("2048-best")
    if (saved) setBestScore(Number.parseInt(saved))
  }, [])

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      localStorage.setItem("2048-best", score.toString())
    }
  }, [score, bestScore])

  const handleKeyPress = useCallback(
    (e) => {
      if (gameOver) return

      const moved = false
      const newBoard = board.map((row) => [...row])
      const newScore = score

      // Movement logic would go here
      // This is a simplified version

      if (moved) {
        addRandomTile(newBoard)
        setBoard(newBoard)
        setScore(newScore)
      }
    },
    [board, score, gameOver],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/games">
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">2048</h1>
          <Button variant="ghost" size="icon" onClick={initializeGame} className="text-white">
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-white text-center">
          <div className="glass-dark rounded-2xl p-3">
            <div className="text-sm opacity-70">Score</div>
            <div className="text-xl font-bold">{score}</div>
          </div>
          <div className="glass-dark rounded-2xl p-3">
            <div className="text-sm opacity-70">Best</div>
            <div className="text-xl font-bold">{bestScore}</div>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-dark rounded-3xl p-6 mb-6"
        >
          <div className="grid grid-cols-4 gap-2 bg-black/30 p-4 rounded-2xl">
            {board.map((row, i) =>
              row.map((cell, j) => (
                <motion.div
                  key={`${i}-${j}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`aspect-square rounded-lg flex items-center justify-center font-bold text-lg ${getTileColor(cell)}`}
                >
                  {cell !== 0 && cell}
                </motion.div>
              )),
            )}
          </div>
        </motion.div>

        <div className="text-center text-white/70 text-sm">
          Use arrow keys to move tiles • Combine tiles to reach 2048!
        </div>
      </div>
    </div>
  )
}
