"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
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
import OpeningAnimation from "@/components/OpeningAnimation"

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
  const [showEmailForm, setShowEmailForm] = useState(false)

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
      try {
        await ensureProfileExists(u)
      } catch (err) {
        console.warn("Profile creation failed, continuing anyway:", err)
      }
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
      <OpeningAnimation
        showAuthOptions={!user}
        onComplete={() => {
          setIsLoading(false)
        }}
        onGoogleClick={handleOAuth}
        onEmailClick={() => setShowEmailForm(true)}
        isLoading={authLoading}
      />
    )
  }

  if (user) {
    return <>{children}</>
  }

  return (
    <OpeningAnimation
      showAuthOptions={true}
      onGoogleClick={handleOAuth}
      onEmailClick={() => setShowEmailForm(true)}
      isLoading={authLoading}
    />
  )
}
