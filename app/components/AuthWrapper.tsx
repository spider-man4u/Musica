"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ImprovedAboutDeveloper from "./ImprovedAboutDeveloper"
import { useToast } from "@/hooks/use-toast"
import { supabase, ensureProfileExists, loadUserData } from "@/lib/supabase"
import { useStore } from "@/lib/store"
import type { User } from "@supabase/supabase-js"
import { motion } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, Github, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { loadStoreData } = useStore()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAboutPage, setShowAboutPage] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const user = session.user
          setUser(user)

          try {
            const profileResult = await ensureProfileExists(user)
            if (profileResult.error) {
              console.warn("Profile sync warning:", profileResult.error)
            }

            const loadResult = await loadUserData(user.id)
            if (loadResult.success && loadResult.userData) {
              loadStoreData(loadResult.userData)
            }

            setShowAboutPage(true)
          } catch (err) {
            console.error("Error loading user data:", err)
            setError("Failed to load user data")
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err)
        setError(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        if (event === "SIGNED_IN") {
          try {
            await ensureProfileExists(session.user)
            const loadResult = await loadUserData(session.user.id)
            if (loadResult.success && loadResult.userData) {
              loadStoreData(loadResult.userData)
            }
            setShowAboutPage(true)
          } catch (err) {
            console.error("Error after sign in:", err)
          }
        }
      } else {
        setUser(null)
        setShowAboutPage(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [loadStoreData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setAuthLoading(true)

    try {
      if (!email || !password) {
        setError("Please fill in all fields")
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (data.user) {
        setUser(data.user)
        setEmail("")
        setPassword("")
        toast({ description: "Logged in successfully!" })
      }
    } catch (err: any) {
      setError(err?.message || "Login failed")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setAuthLoading(true)

    try {
      if (!email || !password || !confirmPassword) {
        setError("Please fill in all fields")
        return
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        setSuccess("Account created! Confirming email...")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setTimeout(() => {
          setActiveTab("login")
          setSuccess(null)
        }, 2000)
      }
    } catch (err: any) {
      setError(err?.message || "Signup failed")
    } finally {
      setAuthLoading(false)
    }
  }

  // Show about page after login/signup
  if (user && showAboutPage) {
    return <ImprovedAboutDeveloper onSkip={() => setShowAboutPage(false)} showSkipButton={true} />
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-purple-400" />
        </motion.div>
      </div>
    )
  }

  // Show auth if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Musica
              </h1>
              <p className="text-white/60 mt-2">Your Music Companion</p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm"
              >
                {success}
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-2 rounded-md font-medium transition-all ${
                  activeTab === "login"
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`flex-1 py-2 rounded-md font-medium transition-all ${
                  activeTab === "signup"
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Login Form */}
            {activeTab === "login" && (
              <motion.form
                onSubmit={handleLogin}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-white/60 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all mt-6"
                >
                  {authLoading ? "Logging in..." : "Login"}
                </Button>
              </motion.form>
            )}

            {/* Signup Form */}
            {activeTab === "signup" && (
              <motion.form
                onSubmit={handleSignup}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-white/60 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-white/60 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-all mt-6"
                >
                  {authLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </motion.form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/60 text-sm">Or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* OAuth Button */}
            <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2">
              <Github className="w-5 h-5" />
              GitHub
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show children if logged in and about page dismissed
  return (
    <>
      <div className="fixed top-3 right-3 z-40" />
      {children}
    </>
  )
}
