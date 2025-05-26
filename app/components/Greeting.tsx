"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/lib/store"

export function Greeting() {
  const [greeting, setGreeting] = useState("")
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening" | "night">("morning")
  const { userData } = useStore()

  // Get the actual user name from localStorage or userData
  const [userName, setUserName] = useState("")

  useEffect(() => {
    // Get username from localStorage or use userData
    const storedName = localStorage.getItem("username")
    if (storedName) {
      setUserName(storedName)
    } else if (userData.name && userData.name !== "User") {
      setUserName(userData.name)
    } else {
      setUserName("Music Lover")
    }
  }, [userData.name])

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      let newGreeting: string
      let newTimeOfDay: typeof timeOfDay

      if (hour >= 5 && hour < 12) {
        newGreeting = "Good morning"
        newTimeOfDay = "morning"
      } else if (hour >= 12 && hour < 18) {
        newGreeting = "Good afternoon"
        newTimeOfDay = "afternoon"
      } else if (hour >= 18 && hour < 22) {
        newGreeting = "Good evening"
        newTimeOfDay = "evening"
      } else {
        newGreeting = "Good night"
        newTimeOfDay = "night"
      }

      setGreeting(newGreeting)
      setTimeOfDay(newTimeOfDay)
    }

    updateGreeting()
    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  const emoji = {
    morning: "🌅",
    afternoon: "☀️",
    evening: "🌆",
    night: "🌙",
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={timeOfDay}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6"
      >
        <motion.div
          className="flex items-center space-x-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <span className="text-2xl">{emoji[timeOfDay]}</span>
          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          >
            {greeting}, {userName}
          </motion.h1>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
