"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw, Play } from "lucide-react"
import Link from "next/link"

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: "bg-cyan-500" },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "bg-yellow-500",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "bg-purple-500",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "bg-green-500",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "bg-red-500",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "bg-blue-500",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "bg-orange-500",
  },
}

export default function TetrisGame() {
  const [board, setBoard] = useState(() =>
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0)),
  )
  const [currentPiece, setCurrentPiece] = useState(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const gameLoopRef = useRef()

  const getRandomPiece = () => {
    const pieces = Object.keys(TETROMINOES)
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)]
    return {
      type: randomPiece,
      shape: TETROMINOES[randomPiece].shape,
      color: TETROMINOES[randomPiece].color,
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0,
    }
  }

  const resetGame = () => {
    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(0)),
    )
    setCurrentPiece(null)
    setScore(0)
    setLevel(1)
    setLines(0)
    setIsPlaying(false)
    setIsPaused(false)
    setGameOver(false)
  }

  const startGame = () => {
    setIsPlaying(true)
    setCurrentPiece(getRandomPiece())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/games">
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Tetris</h1>
          <div className="text-white font-bold">Score: {score}</div>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-dark rounded-3xl p-6 mb-6"
        >
          <div className="grid grid-cols-10 gap-1 bg-black/30 p-4 rounded-2xl">
            {board.map((row, y) =>
              row.map((cell, x) => (
                <div key={`${x}-${y}`} className={`aspect-square rounded-sm ${cell ? "bg-white" : "bg-gray-800/50"}`} />
              )),
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-6 text-white text-center">
          <div className="glass-dark rounded-2xl p-3">
            <div className="text-sm opacity-70">Level</div>
            <div className="text-xl font-bold">{level}</div>
          </div>
          <div className="glass-dark rounded-2xl p-3">
            <div className="text-sm opacity-70">Lines</div>
            <div className="text-xl font-bold">{lines}</div>
          </div>
          <div className="glass-dark rounded-2xl p-3">
            <div className="text-sm opacity-70">Score</div>
            <div className="text-xl font-bold">{score}</div>
          </div>
        </div>

        <div className="space-y-4">
          {!isPlaying && !gameOver && (
            <Button onClick={startGame} className="w-full bg-purple-500 hover:bg-purple-600">
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          )}

          {gameOver && (
            <div className="text-center">
              <p className="text-white text-xl mb-4">Game Over! Final Score: {score}</p>
              <Button onClick={resetGame} className="bg-blue-500 hover:bg-blue-600">
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again
              </Button>
            </div>
          )}

          <div className="text-center text-white/70 text-sm">Coming soon - Full Tetris implementation</div>
        </div>
      </div>
    </div>
  )
}
