"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw, Pause, Play } from "lucide-react"
import Link from "next/link"

const GRID_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_FOOD = { x: 15, y: 15 }

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [food, setFood] = useState(INITIAL_FOOD)
  const [direction, setDirection] = useState({ x: 0, y: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout>()

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
    return newFood
  }, [])

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection({ x: 0, y: 0 })
    setGameOver(false)
    setScore(0)
    setIsPlaying(false)
    setIsPaused(false)
  }

  const moveSnake = useCallback(() => {
    if (!isPlaying || isPaused || gameOver) return

    setSnake((currentSnake) => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      head.x += direction.x
      head.y += direction.y

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true)
        setIsPlaying(false)
        return currentSnake
      }

      // Check self collision
      if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true)
        setIsPlaying(false)
        return currentSnake
      }

      newSnake.unshift(head)

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore((prev) => prev + 10)
        setFood(generateFood())
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [direction, food, isPlaying, isPaused, gameOver, generateFood])

  useEffect(() => {
    if (isPlaying && !isPaused) {
      gameLoopRef.current = setInterval(moveSnake, 150)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [moveSnake, isPlaying, isPaused])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return

      switch (e.key) {
        case "ArrowUp":
          if (direction.y === 0) setDirection({ x: 0, y: -1 })
          break
        case "ArrowDown":
          if (direction.y === 0) setDirection({ x: 0, y: 1 })
          break
        case "ArrowLeft":
          if (direction.x === 0) setDirection({ x: -1, y: 0 })
          break
        case "ArrowRight":
          if (direction.x === 0) setDirection({ x: 1, y: 0 })
          break
        case " ":
          e.preventDefault()
          setIsPaused(!isPaused)
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [direction, isPlaying, isPaused])

  const startGame = () => {
    setIsPlaying(true)
    setDirection({ x: 1, y: 0 })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/games">
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Snake Game</h1>
          <div className="text-white font-bold">Score: {score}</div>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-dark rounded-3xl p-6 mb-6"
        >
          <div
            className="grid gap-1 bg-black/30 p-4 rounded-2xl mx-auto"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: "300px",
              height: "300px",
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE
              const y = Math.floor(index / GRID_SIZE)
              const isSnake = snake.some((segment) => segment.x === x && segment.y === y)
              const isHead = snake[0]?.x === x && snake[0]?.y === y
              const isFood = food.x === x && food.y === y

              return (
                <div
                  key={index}
                  className={`aspect-square rounded-sm ${
                    isFood ? "bg-red-500" : isHead ? "bg-green-300" : isSnake ? "bg-green-500" : "bg-gray-800/50"
                  }`}
                />
              )
            })}
          </div>
        </motion.div>

        <div className="space-y-4">
          {!isPlaying && !gameOver && (
            <Button onClick={startGame} className="w-full bg-green-500 hover:bg-green-600">
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          )}

          {isPlaying && (
            <Button onClick={() => setIsPaused(!isPaused)} className="w-full bg-yellow-500 hover:bg-yellow-600">
              {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
              {isPaused ? "Resume" : "Pause"}
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

          <div className="text-center text-white/70 text-sm">Use arrow keys to move • Space to pause</div>
        </div>
      </div>
    </div>
  )
}
