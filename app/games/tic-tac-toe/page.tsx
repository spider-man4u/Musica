'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

type SquareValue = 'X' | 'O' | null
type GameMode = 'local' | 'computer'

const TicTacToe = () => {
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const [playerX, setPlayerX] = useState('X')
  const [playerO, setPlayerO] = useState('O')
  const [gameMode, setGameMode] = useState<GameMode>('local')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  useEffect(() => {
    if (gameMode === 'computer' && !xIsNext && !calculateWinner(squares)) {
      const timer = setTimeout(() => {
        makeComputerMove()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [xIsNext, gameMode, squares])

  const handleClick = (i: number) => {
    if (calculateWinner(squares) || squares[i] || (gameMode === 'computer' && !xIsNext)) {
      return
    }
    const newSquares = squares.slice()
    newSquares[i] = xIsNext ? playerX : playerO
    setSquares(newSquares)
    setXIsNext(!xIsNext)
  }

  const makeComputerMove = () => {
    const newSquares = squares.slice()
    let move: number

    switch (difficulty) {
      case 'easy':
        move = getRandomMove(newSquares)
        break
      case 'medium':
        move = Math.random() < 0.5 ? getBestMove(newSquares) : getRandomMove(newSquares)
        break
      case 'hard':
        move = getBestMove(newSquares)
        break
    }

    if (move !== -1) {
      newSquares[move] = playerO
      setSquares(newSquares)
      setXIsNext(true)
    }
  }

  const getRandomMove = (board: SquareValue[]): number => {
    const availableMoves = board.reduce((acc, square, index) => {
      if (!square) acc.push(index)
      return acc
    }, [] as number[])
    return availableMoves[Math.floor(Math.random() * availableMoves.length)]
  }

  const getBestMove = (board: SquareValue[]): number => {
    let bestScore = -Infinity
    let bestMove = -1

    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = playerO
        let score = minimax(board, 0, false)
        board[i] = null
        if (score > bestScore) {
          bestScore = score
          bestMove = i
        }
      }
    }

    return bestMove
  }

  const minimax = (board: SquareValue[], depth: number, isMaximizing: boolean): number => {
    const winner = calculateWinner(board)
    if (winner === playerO) return 10 - depth
    if (winner === playerX) return depth - 10
    if (board.every(Boolean)) return 0

    if (isMaximizing) {
      let bestScore = -Infinity
      for (let i = 0; i < board.length; i++) {
        if (!board[i]) {
          board[i] = playerO
          let score = minimax(board, depth + 1, false)
          board[i] = null
          bestScore = Math.max(score, bestScore)
        }
      }
      return bestScore
    } else {
      let bestScore = Infinity
      for (let i = 0; i < board.length; i++) {
        if (!board[i]) {
          board[i] = playerX
          let score = minimax(board, depth + 1, true)
          board[i] = null
          bestScore = Math.min(score, bestScore)
        }
      }
      return bestScore
    }
  }

  const renderSquare = (i: number) => {
    return (
      <Button
        key={i}
        className="w-20 h-20 text-2xl font-bold"
        onClick={() => handleClick(i)}
      >
        {squares[i]}
      </Button>
    )
  }

  const winner = calculateWinner(squares)
  let status
  if (winner) {
    status = `Winner: ${winner === playerX ? 'Player X' : 'Player O'}`
  } else if (squares.every(Boolean)) {
    status = 'Draw!'
  } else {
    status = `Next player: ${xIsNext ? 'Player X' : 'Player O'}`
  }

  const resetGame = () => {
    setSquares(Array(9).fill(null))
    setXIsNext(true)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">Tic-Tac-Toe</h1>
      <div className="mb-4 text-xl text-white">{status}</div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => renderSquare(i))}
      </div>
      <div className="flex flex-col space-y-4 mb-4 w-full max-w-md">
        <div className="flex justify-between">
          <div>
            <label htmlFor="playerX" className="block text-sm font-medium text-white mb-1">Player X Symbol</label>
            <Select onValueChange={(value) => setPlayerX(value)} value={playerX}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="X" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X">X</SelectItem>
                <SelectItem value="🔴">🔴</SelectItem>
                <SelectItem value="🌟">🌟</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="playerO" className="block text-sm font-medium text-white mb-1">Player O Symbol</label>
            <Select onValueChange={(value) => setPlayerO(value)} value={playerO}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="O" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="O">O</SelectItem>
                <SelectItem value="🔵">🔵</SelectItem>
                <SelectItem value="💖">💖</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1">Game Mode</label>
          <RadioGroup defaultValue={gameMode} onValueChange={(value) => setGameMode(value as GameMode)} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="local" id="local" />
              <Label htmlFor="local" className="text-white">Play with local friend</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="computer" id="computer" />
              <Label htmlFor="computer" className="text-white">Play with computer</Label>
            </div>
          </RadioGroup>
        </div>
        {gameMode === 'computer' && (
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-white mb-1">Difficulty</label>
            <Select onValueChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard')} value={difficulty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <Button className="mt-4 bg-yellow-400 text-black hover:bg-yellow-500" onClick={resetGame}>
        Reset Game
      </Button>
    </div>
  )
}

function calculateWinner(squares: SquareValue[]): SquareValue {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let line of lines) {
    const [a, b, c] = line
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }
  return null
}

export default TicTacToe
