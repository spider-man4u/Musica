"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FaGoogle } from "react-icons/fa"
import { Music, ChevronRight } from "lucide-react"

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showArtistSelection, setShowArtistSelection] = useState(false)
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])

  // Dynamic music visualization
  const [audioLevels, setAudioLevels] = useState(Array(12).fill(0))

  // Welcome slides data
  const welcomeSlides = [
    {
      title: "Welcome to Musica",
      subtitle: "Your ultimate music companion",
      description: "Discover millions of songs, create playlists, and enjoy high-quality music streaming.",
      image: "/placeholder.svg?height=300&width=300",
      color: "from-purple-600 to-blue-600",
    },
    {
      title: "Personalized Experience",
      subtitle: "Music that matches your mood",
      description: "Get recommendations based on your listening habits and discover new favorites.",
      image: "/placeholder.svg?height=300&width=300",
      color: "from-pink-600 to-purple-600",
    },
    {
      title: "High Quality Audio",
      subtitle: "Crystal clear sound",
      description: "Enjoy your favorite tracks in the highest quality available.",
      image: "/placeholder.svg?height=300&width=300",
      color: "from-blue-600 to-cyan-600",
    },
  ]

  // Popular artists for selection
  const popularArtists = [
    "Arijit Singh",
    "Shreya Ghoshal",
    "AR Rahman",
    "Rahat Fateh Ali Khan",
    "Atif Aslam",
    "Neha Kakkar",
    "Armaan Malik",
    "Sunidhi Chauhan",
    "Sonu Nigam",
    "Lata Mangeshkar",
    "Kishore Kumar",
    "Mohammed Rafi",
  ]

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(loggedIn)
    setIsLoading(false)
  }, [])

  // Animate audio levels for music visualization
  useEffect(() => {
    if (!showLogin && !showSignup) return

    const interval = setInterval(() => {
      setAudioLevels((prev) => prev.map(() => Math.random() * 100))
    }, 150)

    return () => clearInterval(interval)
  }, [showLogin, showSignup])

  // Auto-play music visualization
  useEffect(() => {
    if (showLogin || showSignup) {
      const timer = setTimeout(() => setMusicPlaying(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [showLogin, showSignup])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      alert("Please enter both username and password.")
      return
    }

    // Check if user exists
    const existingUser = localStorage.getItem(`user_${username}`)
    if (!existingUser) {
      alert("User not found. Please sign up first.")
      setShowLogin(false)
      setShowSignup(true)
      setIsSignUp(true)
      return
    }

    setIsLoggedIn(true)
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("username", username)
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !email || !password) {
      alert("Please fill in all fields.")
      return
    }

    // Save user data
    const userData = { username, email, password, createdAt: new Date().toISOString() }
    localStorage.setItem(`user_${username}`, JSON.stringify(userData))
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("username", username)
    localStorage.setItem("email", email)

    setShowArtistSelection(true)
  }

  const handleGoogleSignIn = async () => {
    try {
      // Simulate Google Sign-In with mock data
      const mockGoogleUser = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      }

      // Store Google user data
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("username", mockGoogleUser.name)
      localStorage.setItem("email", mockGoogleUser.email)
      localStorage.setItem("userImage", mockGoogleUser.picture)
      localStorage.setItem("loginMethod", "google")

      setIsLoggedIn(true)
    } catch (error) {
      console.error("Google Sign-In failed:", error)
      alert("Google Sign-In failed. Please try again.")
    }
  }

  const handleSocialLogin = (provider: string) => {
    if (provider === "Google") {
      handleGoogleSignIn()
    } else {
      // Mock Facebook login
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("username", "Facebook User")
      localStorage.setItem("loginMethod", provider.toLowerCase())
      setIsLoggedIn(true)
    }
  }

  const handleArtistSelection = () => {
    if (selectedArtists.length > 0) {
      localStorage.setItem("selectedArtists", JSON.stringify(selectedArtists))
      setIsLoggedIn(true)
    } else {
      alert("Please select at least one artist to continue.")
    }
  }

  const toggleArtistSelection = (artist: string) => {
    setSelectedArtists((prev) => (prev.includes(artist) ? prev.filter((a) => a !== artist) : [...prev, artist]))
  }

  const nextSlide = () => {
    if (currentSlide < welcomeSlides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      setShowLogin(true)
    }
  }

  const resetForm = () => {
    setUsername("")
    setPassword("")
    setEmail("")
    setShowLogin(false)
    setShowSignup(false)
    setIsSignUp(false)
    setCurrentSlide(0)
    setShowArtistSelection(false)
    setSelectedArtists([])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full"
              animate={{
                x: [0, Math.random() * window.innerWidth],
                y: [0, Math.random() * window.innerHeight],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 5,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 5,
              }}
              style={{
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {showArtistSelection ? (
            <motion.div
              key="artist-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md p-8 relative z-10"
            >
              <div className="glass-dark rounded-3xl p-8">
                {/* Musica Logo */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">Musica</h1>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Choose Your Favorites</h2>
                  <p className="text-white/70">Select artists you like to get personalized recommendations</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto">
                  {popularArtists.map((artist) => (
                    <motion.button
                      key={artist}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleArtistSelection(artist)}
                      className={`p-3 rounded-xl text-sm transition-all ${
                        selectedArtists.includes(artist)
                          ? "bg-green-500 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {artist}
                    </motion.button>
                  ))}
                </div>

                <Button
                  onClick={handleArtistSelection}
                  disabled={selectedArtists.length === 0}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  Continue ({selectedArtists.length} selected)
                </Button>
              </div>
            </motion.div>
          ) : !showLogin && !showSignup ? (
            <motion.div
              key="welcome-slides"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md p-8 relative z-10"
            >
              <div className="glass-dark rounded-3xl p-8 text-center">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="mb-8"
                >
                  <div
                    className={`w-32 h-32 mx-auto mb-6 bg-gradient-to-br ${welcomeSlides[currentSlide].color} rounded-full flex items-center justify-center`}
                  >
                    <Music className="w-16 h-16 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{welcomeSlides[currentSlide].title}</h2>
                  <h3 className="text-lg text-white/80 mb-4">{welcomeSlides[currentSlide].subtitle}</h3>
                  <p className="text-white/70">{welcomeSlides[currentSlide].description}</p>
                </motion.div>

                <div className="flex justify-center space-x-2 mb-6">
                  {welcomeSlides.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentSlide ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextSlide}
                  className="w-full py-3 bg-white text-purple-900 rounded-xl font-medium transition-colors hover:bg-white/90"
                >
                  {currentSlide === welcomeSlides.length - 1 ? "Get Started" : "Continue"}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md p-8 relative z-10"
            >
              <div className="glass-dark rounded-3xl p-8 relative overflow-hidden">
                {/* Background music visualization */}
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-purple-600/20 to-blue-600/20 flex items-center justify-center space-x-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-white/30 rounded-full"
                      style={{ width: "2px" }}
                      animate={{
                        height: [5, audioLevels[i] * 0.3 + 10, 5],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>

                {/* Musica Logo for Sign-Up */}
                {isSignUp && (
                  <div className="flex items-center justify-center mb-6 mt-8">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white">Musica</h1>
                  </div>
                )}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8 mt-8">
                  <h2 className="text-2xl font-bold text-white">{isSignUp ? "Join Musica" : "Welcome Back"}</h2>
                  <p className="text-white/70">
                    {isSignUp ? "Create your music journey" : "Continue your music journey"}
                  </p>
                </motion.div>

                {/* Google Sign-In Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 bg-white text-gray-900 rounded-xl font-medium transition-colors hover:bg-gray-100 flex items-center justify-center space-x-2 mb-4"
                >
                  <FaGoogle className="w-5 h-5" />
                  <span>Continue with Google</span>
                </motion.button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-white/70">or</span>
                  </div>
                </div>

                <form onSubmit={isSignUp ? handleSignup : handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-all"
                    />
                    {isSignUp && (
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-all"
                      />
                    )}
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/30 transition-all"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium transition-all hover:from-purple-700 hover:to-blue-700"
                  >
                    {isSignUp ? "Create Account" : "Sign In"}
                  </motion.button>
                </form>

                <div className="mt-6 text-center space-y-2">
                  <button
                    onClick={() => {
                      if (isSignUp) {
                        setIsSignUp(false)
                        setShowSignup(false)
                        setShowLogin(true)
                      } else {
                        resetForm()
                      }
                    }}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {isSignUp ? "Already have an account? Sign In" : "Back to welcome screen"}
                  </button>
                  {!isSignUp && (
                    <div>
                      <button className="text-white/50 hover:text-white/70 transition-colors">Forgot password?</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return <div>{children}</div>
}

export default AuthWrapper
