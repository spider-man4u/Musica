export interface Mood {
  id: string
  name: string
  emoji: string
  color: string
  description: string
  keywords: string[]
}

export const moods: Mood[] = [
  {
    id: "happy",
    name: "Happy",
    emoji: "😊",
    color: "from-yellow-400 to-orange-400",
    description: "Upbeat and energetic vibes",
    keywords: ["upbeat", "energetic", "pop", "dance", "happy", "cheerful"],
  },
  {
    id: "chill",
    name: "Chill",
    emoji: "😌",
    color: "from-blue-400 to-cyan-400",
    description: "Relaxed and mellow tunes",
    keywords: ["chill", "relaxed", "ambient", "lo-fi", "calm", "peaceful"],
  },
  {
    id: "focus",
    name: "Focus",
    emoji: "🎯",
    color: "from-green-400 to-emerald-400",
    description: "Music for concentration",
    keywords: ["instrumental", "classical", "ambient", "focus", "study", "concentration"],
  },
  {
    id: "workout",
    name: "Workout",
    emoji: "💪",
    color: "from-red-400 to-pink-400",
    description: "High energy for exercise",
    keywords: ["workout", "gym", "energetic", "rock", "electronic", "motivation"],
  },
  {
    id: "romantic",
    name: "Romantic",
    emoji: "💕",
    color: "from-pink-400 to-rose-400",
    description: "Love songs and ballads",
    keywords: ["romantic", "love", "ballad", "slow", "intimate", "acoustic"],
  },
  {
    id: "melancholy",
    name: "Melancholy",
    emoji: "🌧️",
    color: "from-gray-400 to-blue-400",
    description: "Emotional and introspective",
    keywords: ["sad", "emotional", "indie", "alternative", "melancholy", "introspective"],
  },
  {
    id: "party",
    name: "Party",
    emoji: "🎉",
    color: "from-purple-400 to-pink-400",
    description: "Party anthems and dance hits",
    keywords: ["party", "dance", "electronic", "hip-hop", "club", "celebration"],
  },
  {
    id: "nostalgic",
    name: "Nostalgic",
    emoji: "🌅",
    color: "from-amber-400 to-yellow-400",
    description: "Classic hits and throwbacks",
    keywords: ["classic", "retro", "nostalgic", "oldies", "throwback", "vintage"],
  },
]

export function getMoodBasedOnTime(timeOfDay: string): Mood {
  switch (timeOfDay) {
    case "morning":
      return moods.find((m) => m.id === "happy") || moods[0]
    case "afternoon":
      return moods.find((m) => m.id === "focus") || moods[2]
    case "evening":
      return moods.find((m) => m.id === "chill") || moods[1]
    case "night":
      return moods.find((m) => m.id === "melancholy") || moods[5]
    default:
      return moods[0]
  }
}

export function getMoodBasedOnWeather(weather: string): Mood {
  switch (weather.toLowerCase()) {
    case "sunny":
    case "clear":
      return moods.find((m) => m.id === "happy") || moods[0]
    case "rainy":
    case "cloudy":
      return moods.find((m) => m.id === "melancholy") || moods[5]
    case "snowy":
      return moods.find((m) => m.id === "chill") || moods[1]
    default:
      return moods[0]
  }
}
