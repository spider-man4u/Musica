interface Holiday {
  name: string
  emoji: string
  color: string
  startDate: [number, number]
  endDate: [number, number]
  keywords: string[]
}

const HOLIDAYS: Holiday[] = [
  {
    name: "New Year",
    emoji: "🎆",
    color: "from-purple-500 to-pink-500",
    startDate: [1, 1],
    endDate: [1, 7],
    keywords: ["new year", "celebration", "party"],
  },
  {
    name: "Valentine's Day",
    emoji: "💕",
    color: "from-pink-500 to-red-500",
    startDate: [2, 7],
    endDate: [2, 17],
    keywords: ["love", "romantic", "valentine"],
  },
  {
    name: "Holi",
    emoji: "🎨",
    color: "from-yellow-500 to-orange-500",
    startDate: [3, 20],
    endDate: [3, 27],
    keywords: ["holi", "colors", "festival"],
  },
  {
    name: "Easter",
    emoji: "🐰",
    color: "from-green-500 to-blue-500",
    startDate: [4, 7],
    endDate: [4, 14],
    keywords: ["easter", "spring", "celebration"],
  },
  {
    name: "Summer",
    emoji: "☀️",
    color: "from-yellow-500 to-orange-500",
    startDate: [6, 20],
    endDate: [6, 30],
    keywords: ["summer", "beach", "chill"],
  },
  {
    name: "Eid",
    emoji: "🌙",
    color: "from-green-600 to-emerald-500",
    startDate: [4, 8],
    endDate: [4, 15],
    keywords: ["eid", "festival", "celebration"],
  },
  {
    name: "Diwali",
    emoji: "🪔",
    color: "from-orange-500 to-yellow-500",
    startDate: [10, 20],
    endDate: [10, 27],
    keywords: ["diwali", "lights", "festival"],
  },
  {
    name: "Halloween",
    emoji: "🎃",
    color: "from-orange-600 to-black",
    startDate: [10, 25],
    endDate: [11, 1],
    keywords: ["halloween", "spooky", "party"],
  },
  {
    name: "Christmas",
    emoji: "🎄",
    color: "from-red-500 to-green-500",
    startDate: [12, 15],
    endDate: [12, 31],
    keywords: ["christmas", "festive", "holiday"],
  },
  {
    name: "Thanksgiving",
    emoji: "🦃",
    color: "from-orange-500 to-amber-600",
    startDate: [11, 18],
    endDate: [11, 25],
    keywords: ["thanksgiving", "gratitude", "celebration"],
  },
]

export function getActiveHolidays(): Holiday[] {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()

  return HOLIDAYS.filter((holiday) => {
    const [startMonth, startDay] = holiday.startDate
    const [endMonth, endDay] = holiday.endDate

    const startDate = new Date(now.getFullYear(), startMonth - 1, startDay)
    const endDate = new Date(now.getFullYear(), endMonth - 1, endDay)
    const currentDate = new Date(now.getFullYear(), month - 1, day)

    return currentDate >= startDate && currentDate <= endDate
  })
}

export function isHolidaySeason(): boolean {
  return getActiveHolidays().length > 0
}

export function getHolidayByName(name: string): Holiday | undefined {
  return HOLIDAYS.find((h) => h.name.toLowerCase() === name.toLowerCase())
}
