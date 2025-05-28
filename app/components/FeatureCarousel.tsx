"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Music, Headphones, Radio } from "lucide-react"

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

export default function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const features: Feature[] = [
    {
      icon: Music,
      title: "Discover New Music",
      description: "Explore millions of songs from various genres and artists",
      color: "from-purple-600 to-blue-600",
    },
    {
      icon: Headphones,
      title: "Personalized Experience",
      description: "Get recommendations based on your mood and listening habits",
      color: "from-pink-600 to-purple-600",
    },
    {
      icon: Radio,
      title: "Original Songs",
      description: "Listen to high-quality original tracks from your favorite artists",
      color: "from-blue-600 to-cyan-600",
    },
  ]

  useEffect(() => {
    // Auto-rotate carousel
    const interval = setInterval(() => {
      nextFeature()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex])

  const nextFeature = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length)
  }

  const prevFeature = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-xl">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br ${features[currentIndex].color}`}
        >
          {React.createElement(features[currentIndex].icon, { className: "w-12 h-12 text-white mb-4" })}
          <h3 className="text-xl font-bold text-white mb-2">{features[currentIndex].title}</h3>
          <p className="text-white/80">{features[currentIndex].description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>

      <button
        onClick={prevFeature}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextFeature}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
