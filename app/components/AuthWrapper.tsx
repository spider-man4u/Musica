"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Mail, Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle, Shield, User, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/lib/store"
import {
  supabase,
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  ensureProfileExists,
  signInWithProvider,
  setupRealtimeSync,
  loadUserData,
} from "@/lib/supabase"
import type { User as SupaUser } from "@supabase/supabase-js"

interface AuthWrapperProps {
  children: React.ReactNode
}

function onIdle(cb: () => void, timeout = 800) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    ;(window as any).requestIdleCallback(cb, { timeout })
  } else {
    setTimeout(cb, 0)
  }
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { toast } = useToast()
  const [user, setUser] = useState<SupaUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("login")

  const { setCurrentUserId, setSyncStatus } = useStore()

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastHydrateAtRef = useRef<number>(0)
  const splashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const HYDRATE_MIN_INTERVAL_MS = 5000
  const POLL_INTERVAL_MS = 20000
  const INITIAL_SPLASH_MAX_MS = 400

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({ username: "", email: "", password: "", confirmPassword: "" })

  const safeHydrate = async (uid: string) => {
    const now = Date.now()
    if (now - lastHydrateAtRef.current < HYDRATE_MIN_INTERVAL_MS) return
    lastHydrateAtRef.current = now
    try {
      setSyncStatus("syncing")
      const res = await loadUserData(uid)
      if (res.success && res.userData) {
        useStore.setState({ userData: res.userData })
        setSyncStatus("synced")
      } else {
        setSyncStatus("error")
      }
    } catch (e) {
      console.warn("Hydration failed:", e)
      setSyncStatus("error")
    }
  }

  const subscribeRealtime = (userId: string) => {
    unsubscribeRealtime()
    const off = setupRealtimeSync(userId, () => {
      // Debounced hydrate on change events
      onIdle(() => safeHydrate(userId))
    })
    unsubscribeRef.current = off

    // Fallback polling in case realtime is blocked/not enabled
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      safeHydrate(userId)
    }, POLL_INTERVAL_MS)
  }

  const unsubscribeRealtime = () => {
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current()
      } catch {}
      unsubscribeRef.current = null
    }
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    let mounted = true

    const onAuthReady = async (u: SupaUser) => {
      setUser(u)
      setCurrentUserId(u.id)
      await ensureProfileExists(u)
      // Fast, non-blocking hydration
      onIdle(() => safeHydrate(u.id), 500)
      subscribeRealtime(u.id)
    }

    const init = async () => {
      try {
        // Start a short guard so splash doesn't block longer than ~400ms
        splashTimeoutRef.current = setTimeout(() => {
          setIsLoading(false)
        }, INITIAL_SPLASH_MAX_MS)

        const u = await getCurrentUser()
        if (!mounted) return
        if (u) {
          await onAuthReady(u)
        }
      } catch (err) {
        console.error("Auth init error:", err)
      } finally {
        // If the timeout already fired, this won't flicker; otherwise drop splash now.
        setIsLoading(false)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      if (u) {
        await onAuthReady(u)
      } else {
        setUser(null)
        setCurrentUserId(null)
        unsubscribeRealtime()
      }
    })

    init()

    // Rehydrate when app becomes visible or network is back
    const onVisible = () => {
      const uid = supabase.auth.getUser().then((res) => {
        const current = res.data.user
        if (current) onIdle(() => safeHydrate(current.id))
      })
      return uid
    }
    const onOnline = () => {
      const uid = supabase.auth.getUser().then((res) => {
        const current = res.data.user
        if (current) onIdle(() => safeHydrate(current.id))
      })
      return uid
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onVisible()
    })
    window.addEventListener("online", onOnline)

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
      unsubscribeRealtime()
      if (splashTimeoutRef.current) clearTimeout(splashTimeoutRef.current)
      document.removeEventListener("visibilitychange", onVisible as any)
      window.removeEventListener("online", onOnline as any)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentUserId, setSyncStatus])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await signIn(loginForm.email, loginForm.password)
      if (!res.success) {
        setError(res.error || "Login failed")
        toast({ title: "Login failed", description: res.error || "Please try again.", variant: "destructive" })
        return
      }
      setSuccess("Welcome back!")
      toast({ title: "Signed in", description: "Welcome back to Musica." })
    } catch (err) {
      console.error("Login error:", err)
      setError("Unexpected error during login")
      toast({ title: "Login error", description: "Unexpected error. Please try again.", variant: "destructive" })
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
      const res = await signUp(signupForm.email, signupForm.password)
      if (!res.success) {
        setError(
          res.error ||
            "Could not create your account. If this persists, try 'Continue with Google' or magic link signup.",
        )
        toast({
          title: "Signup failed",
          description:
            res.error || "Please try again. You can also use Google or request a magic link if the issue continues.",
          variant: "destructive",
        })
        return
      }
      if (res.needsEmailConfirmation) {
        setSuccess(res.message || "Check your email to confirm your account")
        toast({
          title: "Confirm your email",
          description: res.message || "We sent a confirmation link to your inbox.",
        })
      } else {
        setSuccess("Account created successfully!")
        toast({ title: "Account created", description: "Welcome to Musica." })
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError("Unexpected error during signup")
      toast({ title: "Signup error", description: "Unexpected error. Please try again.", variant: "destructive" })
    } finally {
      setAuthLoading(false)
    }
  }

  const handleOAuth = async () => {
    setAuthLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await signInWithProvider("google")
      if (!res.success) {
        setError(res.error || "Google sign in failed")
        toast({ title: "Google sign in failed", description: res.error || "Please try again.", variant: "destructive" })
      } else {
        toast({
          title: "Continue with Google",
          description: "We opened Google in a new tab. Complete sign in and you'll be redirected back.",
        })
      }
    } catch (err) {
      console.error("OAuth error:", err)
      setError("Unexpected error during Google sign in")
      toast({ title: "Google sign in error", description: "Unexpected error.", variant: "destructive" })
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      unsubscribeRealtime()
      setUser(null)
      setCurrentUserId(null)
      toast({ title: "Signed out", description: "You have been signed out successfully." })
    } catch (err) {
      console.error("Sign out error:", err)
      toast({ title: "Sign out error", description: "Please try again.", variant: "destructive" })
    }
  }

  // Fast-first-paint: show minimal splash briefly, but never block > 400ms
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Musica</h1>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </motion.div>
      </div>
    )
  }

  if (user) {
    return (
      <>
        <div className="fixed top-3 right-3 z-40">
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white/70 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
        {children}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex p-6">
      <div className="w-full flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="bg-black/20 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl text-white mb-2">Sign in to Musica</CardTitle>
              <CardDescription className="text-gray-400 text-lg">Continue with email or Google</CardDescription>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Supabase Authentication</span>
              </div>
            </CardHeader>

            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">{success}</span>
                </div>
              )}

              <div className="mb-4">
                <Button
                  onClick={handleOAuth}
                  disabled={authLoading}
                  className="w-full bg-white text-black hover:bg-white/90"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Continue with Google...
                    </>
                  ) : (
                    "Continue with Google"
                  )}
                </Button>
                <div className="flex items-center gap-2 my-4">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-xs text-white/60">or</span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>
              </div>

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
                  <form onSubmit={handleLogin} className="space-y-6">
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
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
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-6">
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
                          placeholder="Create a password (6+ chars)"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          className="pr-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
