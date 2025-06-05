"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Mail, Lock, User, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { useStore } from "@/lib/store"
import { LocalAuth, type User as AuthUser } from "@/lib/auth"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showArtistSelection, setShowArtistSelection] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const { updateUserProfile } = useStore()

  const welcomeSlides = [
    {
      title: "Welcome to Musica",
      description: "Your ultimate music streaming companion",
      icon: Music,
      color: "from-purple-500 to-blue-500",
    },
    {
      title: "Discover New Music",
      description: "Explore millions of songs from your favorite artists",
      icon: Music,
      color: "from-green-500 to-teal-500",
    },
    {
      title: "Create Playlists",
      description: "Build your perfect soundtrack for every moment",
      icon: Music,
      color: "from-orange-500 to-red-500",
    },
  ]

  const popularArtists = [
    "Arijit Singh",
    "Shreya Ghoshal",
    "AR Rahman",
    "Atif Aslam",
    "Neha Kakkar",
    "Rahat Fateh Ali Khan",
    "Sonu Nigam",
    "Sunidhi Chauhan",
    "Armaan Malik",
    "Asees Kaur",
    "Kishore Kumar",
    "Lata Mangeshkar",
  ]

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = LocalAuth.getCurrentUser()
        setUser(currentUser)

        if (currentUser) {
          updateUserProfile({
            name: currentUser.username,
            email: currentUser.email,
          })

          // Check if user has selected artists
          if (!currentUser.selectedArtists || currentUser.selectedArtists.length === 0) {
            setShowArtistSelection(true)
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setError("Failed to check authentication status")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [updateUserProfile])

  // Welcome slides auto-rotation
  useEffect(() => {
    if (!user) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % welcomeSlides.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [user, welcomeSlides.length])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError(null)

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      const result = LocalAuth.signIn(loginForm.email, loginForm.password)

      if (!result.success) {
        setError(result.error || "Login failed")
        return
      }

      if (result.user) {
        setUser(result.user)
        updateUserProfile({
          name: result.user.username,
          email: result.user.email,
        })

        // Check if user has selected artists
        if (!result.user.selectedArtists || result.user.selectedArtists.length === 0) {
          setShowArtistSelection(true)
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred during login")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords don't match!")
      return
    }

    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters long!")
      return
    }

    setAuthLoading(true)

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      const result = LocalAuth.signUp(signupForm.email, signupForm.password, signupForm.username)

      if (!result.success) {
        setError(result.error || "Signup failed")
        return
      }

      if (result.user) {
        setUser(result.user)
        updateUserProfile({
          name: result.user.username,
          email: result.user.email,
        })
        setShowArtistSelection(true)
      }
    } catch (error) {
      console.error("Signup error:", error)
      setError("An unexpected error occurred during signup")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleArtistSelection = async () => {
    if (selectedArtists.length < 3) {
      setError("Please select at least 3 artists to continue")
      return
    }

    if (!user) return

    try {
      setAuthLoading(true)
      setError(null)

      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Update user with selected artists
      const result = LocalAuth.updateUser({ selectedArtists })

      if (!result.success) {
        setError("Error saving your preferences. Please try again.")
        return
      }

      if (result.user) {
        setUser(result.user)
      }

      setShowArtistSelection(false)
    } catch (error) {
      console.error("Artist selection error:", error)
      setError("An error occurred while saving your preferences")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = () => {
    try {
      LocalAuth.signOut()
      setUser(null)
      setShowArtistSelection(false)
      setSelectedArtists([])
      setError(null)
    } catch (error) {
      console.error("Sign out error:", error)
      setError("Error signing out")
    }
  }

  const toggleArtist = (artist: string) => {
    setSelectedArtists((prev) => (prev.includes(artist) ? prev.filter((a) => a !== artist) : [...prev, artist]))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Musica</h1>
          <p className="text-gray-400">Loading your music experience...</p>
        </div>
      </div>
    )
  }

  if (showArtistSelection && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-black/20 backdrop-blur-xl border-white/10">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Choose Your Favorite Artists</CardTitle>
            <CardDescription className="text-gray-400">
              Select at least 3 artists to personalize your music experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {popularArtists.map((artist) => (
                <motion.button
                  key={artist}
                  onClick={() => toggleArtist(artist)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedArtists.includes(artist)
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{artist}</span>
                    {selectedArtists.includes(artist) && <CheckCircle className="w-4 h-4" />}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">Selected: {selectedArtists.length}/3 minimum</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleArtistSelection}
                  disabled={selectedArtists.length < 3 || authLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue to Musica"
                  )}
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  disabled={authLoading}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
        {/* Left Side - Welcome Slides */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div
                className={`w-24 h-24 bg-gradient-to-r ${welcomeSlides[currentSlide].color} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                {React.createElement(welcomeSlides[currentSlide].icon, { className: "w-12 h-12 text-white" })}
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">{welcomeSlides[currentSlide].title}</h2>
              <p className="text-xl text-gray-300">{welcomeSlides[currentSlide].description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators */}
          <div className="absolute bottom-8 left-1/4 flex space-x-2">
            {welcomeSlides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <Card className="w-full max-w-md bg-black/20 backdrop-blur-xl border-white/10">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Welcome to Musica</CardTitle>
              <CardDescription className="text-gray-400">Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-black">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-black">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          value={signupForm.username}
                          onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-white">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-white">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-white">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {authLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
