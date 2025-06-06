"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Music,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  AlertCircle,
  Smartphone,
  Shield,
  Users,
  Clock,
  User,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { LocalAuth, type User as LocalUser } from "@/lib/auth-local"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showArtistSelection, setShowArtistSelection] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("login")

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
      description: "Your ultimate music streaming companion with AI-powered recommendations",
      icon: Music,
      color: "from-purple-500 to-blue-500",
      features: ["AI Recommendations", "Local Storage", "Offline Ready"],
    },
    {
      title: "Discover New Music",
      description: "Explore millions of songs with intelligent suggestions based on your taste",
      icon: Music,
      color: "from-green-500 to-teal-500",
      features: ["Smart Discovery", "Mood-Based Playlists", "Trending Songs"],
    },
    {
      title: "Your Data, Your Device",
      description: "All your preferences and data stored securely on your device",
      icon: Shield,
      color: "from-orange-500 to-red-500",
      features: ["Privacy First", "No Cloud Dependency", "Always Available"],
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
    "Taylor Swift",
    "Ed Sheeran",
    "The Weeknd",
    "Billie Eilish",
    "Drake",
    "Ariana Grande",
  ]

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = LocalAuth.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)

          // Check if user needs to select artists
          if (!currentUser.selectedArtists || currentUser.selectedArtists.length === 0) {
            setShowArtistSelection(true)
          }

          // Update store with user data
          updateUserProfile({
            id: currentUser.id,
            name: currentUser.username,
            email: currentUser.email,
            avatar: currentUser.avatar || "",
          })
        }
      } catch (error) {
        console.error("Auth check error:", error)
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
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [user, welcomeSlides.length])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = LocalAuth.signIn(loginForm.email, loginForm.password)

      if (!result.success) {
        setError(result.error || "Login failed")
        return
      }

      if (result.user) {
        setUser(result.user)
        setSuccess("Welcome back!")

        // Check if user needs to select artists
        if (!result.user.selectedArtists || result.user.selectedArtists.length === 0) {
          setShowArtistSelection(true)
        }

        // Update store
        updateUserProfile({
          id: result.user.id,
          name: result.user.username,
          email: result.user.email,
          avatar: result.user.avatar || "",
        })
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
    setSuccess(null)

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords don't match!")
      return
    }

    if (signupForm.password.length < 6) {
      setError("Password must be at least 6 characters long!")
      return
    }

    setAuthLoading(true)

    try {
      const result = LocalAuth.signUp(signupForm.email, signupForm.password, signupForm.username)

      if (!result.success) {
        setError(result.error || "Signup failed")
        return
      }

      if (result.user) {
        setUser(result.user)
        setSuccess("Account created successfully!")
        setShowArtistSelection(true)

        // Update store
        updateUserProfile({
          id: result.user.id,
          name: result.user.username,
          email: result.user.email,
          avatar: result.user.avatar || "",
        })
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

      const result = LocalAuth.updateUser({
        selectedArtists: selectedArtists,
      })

      if (result.success && result.user) {
        setUser(result.user)
        setShowArtistSelection(false)
        setSuccess("Preferences saved! Enjoy your personalized music experience!")
      } else {
        setError("Error saving your preferences. Please try again.")
      }
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
      setSuccess(null)

      // Reset store
      updateUserProfile({
        id: "",
        name: "",
        email: "",
        avatar: "",
      })
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
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Musica</h1>
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading your music experience...</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
            <Smartphone className="w-4 h-4" />
            <span>Local Authentication</span>
          </div>
        </motion.div>
      </div>
    )
  }

  if (showArtistSelection && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl">
          <Card className="bg-black/20 backdrop-blur-xl border-white/10">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Music className="w-10 h-10 text-white" />
              </motion.div>
              <CardTitle className="text-3xl text-white mb-2">Choose Your Favorite Artists</CardTitle>
              <CardDescription className="text-gray-400 text-lg">
                Select at least 3 artists to personalize your music experience with AI recommendations
              </CardDescription>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-green-400">
                <Users className="w-4 h-4" />
                <span>Welcome, {user.username}!</span>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{error}</span>
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                {popularArtists.map((artist, index) => (
                  <motion.button
                    key={artist}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleArtist(artist)}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      selectedArtists.includes(artist)
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25"
                        : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{artist}</span>
                      {selectedArtists.includes(artist) && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle className="w-5 h-5" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <div className="text-2xl font-bold text-white mb-2">{selectedArtists.length}/3</div>
                  <div className="text-gray-400">
                    {selectedArtists.length < 3
                      ? `Select ${3 - selectedArtists.length} more artists`
                      : "Perfect! Ready to continue"}
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleArtistSelection}
                    disabled={selectedArtists.length < 3 || authLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                    size="lg"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Continue to Musica"
                    )}
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 px-8 py-3"
                    disabled={authLoading}
                    size="lg"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    const userStats = LocalAuth.getUserStats()

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
        {/* Left Side - Welcome Slides */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-3xl" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="text-center relative z-10 max-w-lg"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                className={`w-32 h-32 bg-gradient-to-r ${welcomeSlides[currentSlide].color} rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl`}
              >
                {React.createElement(welcomeSlides[currentSlide].icon, {
                  className: "w-16 h-16 text-white",
                })}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl font-bold text-white mb-6"
              >
                {welcomeSlides[currentSlide].title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-gray-300 mb-8 leading-relaxed"
              >
                {welcomeSlides[currentSlide].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3"
              >
                {welcomeSlides[currentSlide].features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center justify-center gap-3 text-gray-300"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {welcomeSlides.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Music className="w-10 h-10 text-white" />
                </motion.div>
                <CardTitle className="text-3xl text-white mb-2">Welcome to Musica</CardTitle>
                <CardDescription className="text-gray-400 text-lg">
                  Sign in to your account or create a new one
                </CardDescription>

                {/* Local Auth Indicator */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Secure Local Authentication</span>
                </div>

                {/* User Stats */}
                {userStats.totalUsers > 0 && (
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{userStats.totalUsers} users</span>
                    </div>
                    {userStats.lastLogin && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last login</span>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">{success}</span>
                  </motion.div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/10 mb-6">
                    <TabsTrigger
                      value="login"
                      className="data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-200"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-200"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <motion.form
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleLogin}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            className="pr-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 transition-colors"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium transition-all duration-200"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </motion.form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <motion.form
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleSignup}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-white flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Username
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          value={signupForm.username}
                          onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-white flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 transition-colors"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-white flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signupForm.password}
                            onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            className="pr-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 transition-colors"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-white flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={signupForm.confirmPassword}
                            onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                            className="pr-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 transition-colors"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-medium transition-all duration-200"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </motion.form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <span className="text-green-400 text-sm">🔒 Your data is stored securely on your device</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
