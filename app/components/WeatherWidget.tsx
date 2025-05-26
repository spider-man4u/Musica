"use client"

import { motion } from "framer-motion"
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets } from "lucide-react"
import { useWeather } from "@/hooks/useWeather"

export function WeatherWidget() {
  const { weather, loading, error } = useWeather()

  if (loading) {
    return (
      <div className="glass-dark rounded-2xl p-4 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error || !weather) {
    return null
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return <Sun className="w-8 h-8 text-yellow-400" />
      case "clouds":
        return <Cloud className="w-8 h-8 text-gray-300" />
      case "rain":
        return <CloudRain className="w-8 h-8 text-blue-400" />
      case "snow":
        return <CloudSnow className="w-8 h-8 text-white" />
      default:
        return <Sun className="w-8 h-8 text-yellow-400" />
    }
  }

  const getWeatherGradient = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return "from-yellow-400/20 to-orange-400/20"
      case "clouds":
        return "from-gray-400/20 to-blue-400/20"
      case "rain":
        return "from-blue-400/20 to-indigo-400/20"
      case "snow":
        return "from-blue-200/20 to-white/20"
      default:
        return "from-yellow-400/20 to-orange-400/20"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-dark rounded-2xl p-4 relative overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${getWeatherGradient(weather.condition)}`} />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getWeatherIcon(weather.condition)}
          <div>
            <div className="text-2xl font-bold text-white">{weather.temperature}°</div>
            <div className="text-white/70 text-sm capitalize">{weather.description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-medium text-sm">{weather.city}</div>
          <div className="flex items-center space-x-2 text-white/60 text-xs mt-1">
            <div className="flex items-center">
              <Droplets className="w-3 h-3 mr-1" />
              {weather.humidity}%
            </div>
            <div className="flex items-center">
              <Wind className="w-3 h-3 mr-1" />
              {weather.windSpeed}m/s
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
