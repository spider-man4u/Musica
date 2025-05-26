"use client"

import { useState, useEffect } from "react"

export interface WeatherData {
  temperature: number
  condition: string
  description: string
  icon: string
  humidity: number
  windSpeed: number
  city: string
  country: string
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's location
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported")
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords

            // Using OpenWeatherMap API (you'll need to get a free API key)
            const API_KEY = "your_openweather_api_key" // Replace with actual API key
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`,
            )

            if (!response.ok) {
              throw new Error("Weather data not available")
            }

            const data = await response.json()

            setWeather({
              temperature: Math.round(data.main.temp),
              condition: data.weather[0].main,
              description: data.weather[0].description,
              icon: data.weather[0].icon,
              humidity: data.main.humidity,
              windSpeed: data.wind.speed,
              city: data.name,
              country: data.sys.country,
            })
            setLoading(false)
          },
          (error) => {
            // Fallback to mock data if location access is denied
            setWeather({
              temperature: 22,
              condition: "Clear",
              description: "clear sky",
              icon: "01d",
              humidity: 65,
              windSpeed: 3.5,
              city: "New York",
              country: "US",
            })
            setLoading(false)
          },
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch weather")
        // Fallback weather data
        setWeather({
          temperature: 22,
          condition: "Clear",
          description: "clear sky",
          icon: "01d",
          humidity: 65,
          windSpeed: 3.5,
          city: "New York",
          country: "US",
        })
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  return { weather, loading, error }
}
