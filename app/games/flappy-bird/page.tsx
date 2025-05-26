'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const GRAVITY = 0.5
const JUMP = -10
const PIPE_WIDTH = 50
const PIPE_GAP = 150

const FlappyBird = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let bird = { x: 50, y: canvas.height / 2, velocity: 0 }
    let pipes: { x: number; y: number }[] = []

    // Images
    const birdImg = new Image()
    const pipeImg = new Image()
    const backgroundImg = new Image()

    birdImg.crossOrigin = 'anonymous'
    pipeImg.crossOrigin = 'anonymous'
    backgroundImg.crossOrigin = 'anonymous'

    let loadedImages = 0
    const totalImages = 3

    const onImageLoad = () => {
      loadedImages++
      if (loadedImages === totalImages) {
        setImagesLoaded(true)
      }
    }

    const onImageError = (imageName: string) => {
      console.error(`Failed to load ${imageName}`)
    }

    birdImg.onload = onImageLoad
    pipeImg.onload = onImageLoad
    backgroundImg.onload = onImageLoad

    birdImg.onerror = () => onImageError('bird image')
    pipeImg.onerror = () => onImageError('pipe image')
    backgroundImg.onerror = () => onImageError('background image')

    birdImg.src = 'https://i.ibb.co/xJSVFhj/ddb0a4f27b9be7ffedf03a872545a3e2.png'
    pipeImg.src = 'https://i.ibb.co/GRKbQ21/1000011338-removebg-preview.png'
    backgroundImg.src = 'https://i.ibb.co/s9x554n/b2b084ad6061dfe2122302266ea8af58.jpg'

    const generatePipe = () => {
      const y = Math.random() * (canvas.height - PIPE_GAP) + PIPE_GAP / 2
      pipes.push({ x: canvas.width, y })
    }

    const drawBird = () => {
      ctx.drawImage(birdImg, bird.x - 20, bird.y - 20, 40, 40)
    }

    const drawPipes = () => {
      pipes.forEach((pipe) => {
        ctx.drawImage(pipeImg, pipe.x, 0, PIPE_WIDTH, pipe.y - PIPE_GAP / 2)
        ctx.save()
        ctx.scale(1, -1)
        ctx.drawImage(pipeImg, pipe.x, -canvas.height, PIPE_WIDTH, canvas.height - pipe.y - PIPE_GAP / 2)
        ctx.restore()
      })
    }

    const drawBackground = () => {
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height)
    }

    const updateGame = () => {
      bird.velocity += GRAVITY
      bird.y += bird.velocity

      if (bird.y > canvas.height - 20 || bird.y < 20) {
        gameOver()
      }

      pipes.forEach((pipe, index) => {
        pipe.x -= 2

        if (pipe.x + PIPE_WIDTH < 0) {
          pipes.splice(index, 1)
          setScore((prevScore) => prevScore + 1)
        }

        if (
          bird.x + 20 > pipe.x &&
          bird.x - 20 < pipe.x + PIPE_WIDTH &&
          (bird.y - 20 < pipe.y - PIPE_GAP / 2 || bird.y + 20 > pipe.y + PIPE_GAP / 2)
        ) {
          gameOver()
        }
      })

      if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        generatePipe()
      }
    }

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground()
      drawPipes()
      drawBird()
      if (gameStarted) {
        updateGame()
      }
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    const gameOver = () => {
      setGameStarted(false)
      if (score > highScore) {
        setHighScore(score)
      }
      bird = { x: 50, y: canvas.height / 2, velocity: 0 }
      pipes = []
      setScore(0)
    }

    const handleClick = () => {
      if (!gameStarted) {
        setGameStarted(true)
      }
      bird.velocity = JUMP
    }

    canvas.addEventListener('click', handleClick)
    gameLoop()

    return () => {
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('click', handleClick)
    }
  }, [score, highScore])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-sky-200 p-4">
      <h1 className="text-3xl font-bold mb-4 text-white">Flappy Bird</h1>
      <div className="mb-4 text-white">
        <span className="mr-4">Score: {score}</span>
        <span>High Score: {highScore}</span>
      </div>
      {!imagesLoaded ? (
        <div className="text-white">Loading images...</div>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            className="border-4 border-yellow-400 rounded-lg shadow-lg"
          />
        </motion.div>
      )}
      {!gameStarted && imagesLoaded && (
        <Button className="mt-4 bg-yellow-400 text-black hover:bg-yellow-500" onClick={() => setGameStarted(true)}>
          Start Game
        </Button>
      )}
    </div>
  )
}

export default FlappyBird
