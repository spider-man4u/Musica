"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { FaGoogle, FaFacebook } from "react-icons/fa"
import { Music, Play, Pause, Volume2 } from "lucide-react"

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [musicPlaying, setMusicPlaying] = useState(false)

  // Dynamic music visualization
  const [audioLevels, setAudioLevels] = useState(Array(12).fill(0))

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(loggedIn)
    setIsLoading(false)
  }, [])

  // Animate audio levels for music visualization
  useEffect(() => {
    if (!showLogin) return

    const interval = setInterval(() => {
      setAudioLevels((prev) => prev.map(() => Math.random() * 100))
    }, 150)

    return () => clearInterval(interval)
  }, [showLogin])

  // Auto-play music visualization
  useEffect(() => {
    if (showLogin) {
      const timer = setTimeout(() => setMusicPlaying(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [showLogin])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      alert("Please enter both username and password.")
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
    setIsLoggedIn(true)
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("username", username)
    localStorage.setItem("email", email)
  }

  const handleGoogleSignIn = async () => {
    try {
      // Simulate Google Sign-In with mock data
      // In a real app, you would use Google OAuth
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

  const resetForm = () => {
    setUsername("")
    setPassword("")
    setEmail("")
    setShowLogin(false)
    setIsSignUp(false)
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
          {!showLogin ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md p-8 relative z-10"
            >
              <div className="relative glass-dark rounded-3xl p-8 overflow-hidden">
                {/* Music visualization */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-t-3xl">
                  <div className="relative w-full h-full flex items-end justify-center space-x-1 p-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="bg-white/60 rounded-full"
                        style={{ width: "4px" }}
                        animate={{
                          height: [10, audioLevels[i] * 0.8 + 20, 10],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>

                  {/* Music controls overlay */}
                  <div className="absolute bottom-4 right-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setMusicPlaying(!musicPlaying)}
                      className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      {musicPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-1" />
                      )}
                    </motion.button>
                  </div>

                  <motion.div
                    className="absolute bottom-20 left-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Music className="w-6 h-6 text-white" />
                      <Volume2 className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">MUSICA</h1>
                    <p className="text-white/70">Your Music, Your Vibe</p>
                  </motion.div>
                </div>

                <div className="mt-72 space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-white text-purple-900 rounded-xl font-medium transition-colors hover:bg-white/90"
                    onClick={() => {
                      setIsSignUp(false)
                      setShowLogin(true)
                    }}
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-transparent text-white rounded-xl font-medium border-2 border-white/30 transition-colors hover:bg-white/10"
                    onClick={() => {
                      setIsSignUp(true)
                      setShowLogin(true)
                    }}
                  >
                    Sign Up
                  </motion.button>
                </div>
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

                <div className="mt-6">
                  <p className="text-center text-white/70 mb-4">Or continue with</p>
                  <div className="flex justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSocialLogin("Facebook")}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <FaFacebook className="w-6 h-6 text-white" />
                    </motion.button>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-2">
                  <button
                    onClick={() => {
                      if (isSignUp) {
                        setIsSignUp(false)
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
