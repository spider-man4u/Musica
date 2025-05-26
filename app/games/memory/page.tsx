'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼']
const allEmojis = [...emojis, ...emojis]

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  useEffect(() => {
    shuffleCards()
  }, [])

  const shuffleCards = () => {
    const shuffledCards = allEmojis
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }))
    setCards(shuffledCards)
    setFlippedCards([])
    setMoves(0)
    setGameWon(false)
  }

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return

    const newCards = [...cards]
    newCards[id].isFlipped = true
    setCards(newCards)

    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1)
      checkForMatch(newFlippedCards)
    }
  }

  const checkForMatch = (flippedCardIds: number[]) => {
    const [firstId, secondId] = flippedCardIds
    if (cards[firstId].emoji === cards[secondId].emoji) {
      const newCards = [...cards]
      newCards[firstId].isMatched = true
      newCards[secondId].isMatched = true
      setCards(newCards)
      setFlippedCards([])

      if (newCards.every(card => card.isMatched)) {
        setGameWon(true)
      }
    } else {
      setTimeout(() => {
        const newCards = [...cards]
        newCards[firstId].isFlipped = false
        newCards[secondId].isFlipped = false
        setCards(newCards)
        setFlippedCards([])
      }, 1000)
    }
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-3xl font-bold mb-4 text-center">Memory Game</h1>
      <div className="flex justify-between items-center mb-4">
        <p className="text-lg">Moves: {moves}</p>
        <Button onClick={shuffleCards} className="flex items-center">
          <Shuffle className="mr-2" /> Shuffle
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {cards.map(card => (
          <motion.div
            key={card.id}
            className={`aspect-square bg-purple-600 rounded-lg flex items-center justify-center text-4xl cursor-pointer ${
              card.isFlipped || card.isMatched ? 'bg-purple-400' : ''
            }`}
            onClick={() => handleCardClick(card.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {(card.isFlipped || card.isMatched) && card.emoji}
          </motion.div>
        ))}
      </div>
      {gameWon && (
        <div className="mt-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
          <p className="text-lg">You won in {moves} moves.</p>
          <Button onClick={shuffleCards} className="mt-4">
            Play Again
          </Button>
        </div>
      )}
    </div>
  )
}
