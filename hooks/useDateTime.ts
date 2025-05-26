"use client"

import { useState, useEffect } from "react"

export interface DateTimeInfo {
  time: string
  date: string
  greeting: string
  timeOfDay: "morning" | "afternoon" | "evening" | "night"
  dayOfWeek: string
  month: string
  day: number
}

export function useDateTime(): DateTimeInfo {
  const [dateTime, setDateTime] = useState<DateTimeInfo>(() => {
    const now = new Date()
    return getDateTimeInfo(now)
  })

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      setDateTime(getDateTimeInfo(now))
    }

    // Update immediately
    updateDateTime()

    // Update every second for live time
    const interval = setInterval(updateDateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return dateTime
}

function getDateTimeInfo(date: Date): DateTimeInfo {
  const hour = date.getHours()
  const minutes = date.getMinutes()

  // Format time
  const time = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

  // Format date
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" })
  const month = date.toLocaleDateString("en-US", { month: "long" })
  const day = date.getDate()
  const year = date.getFullYear()
  const dateStr = `${dayOfWeek}, ${month} ${day}, ${year}`

  // Determine greeting and time of day
  let greeting: string
  let timeOfDay: "morning" | "afternoon" | "evening" | "night"

  if (hour >= 5 && hour < 12) {
    greeting = "Good morning"
    timeOfDay = "morning"
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
    timeOfDay = "afternoon"
  } else if (hour >= 17 && hour < 22) {
    greeting = "Good evening"
    timeOfDay = "evening"
  } else {
    greeting = "Good night"
    timeOfDay = "night"
  }

  return {
    time,
    date: dateStr,
    greeting,
    timeOfDay,
    dayOfWeek,
    month,
    day,
  }
}
