import { createClient } from "@supabase/supabase-js"

// Simplified Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zlxmcnazmnzkyhbuzafr.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseG1jbmF6bW56a3loYnV6YWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MjY1NzYsImV4cCI6MjA2NDUwMjU3Nn0.xGfM5CPYph8nnYgmRPDy66RTdNfaEoNdMImSZXL_HnU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Simple types
export interface Profile {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  selected_artists?: string[]
  created_at: string
  updated_at: string
}

// Simplified auth functions with better error handling
export const signUp = async (email: string, password: string, username: string) => {
  try {
    console.log("🔐 Starting sign up process...")

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: username,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user account" }
    }

    console.log("✅ User created successfully:", authData.user.id)

    // Check if email confirmation is required
    if (!authData.session) {
      return {
        success: true,
        user: authData.user,
        needsEmailConfirmation: true,
      }
    }

    return {
      success: true,
      user: authData.user,
      needsEmailConfirmation: false,
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return { success: false, error: "An unexpected error occurred during sign up" }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    console.log("🔐 Starting sign in process...")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Sign in error:", error)
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: "Sign in failed - no user data received" }
    }

    console.log("✅ Sign in successful:", data.user.id)
    return { success: true, user: data.user, session: data.session }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "An unexpected error occurred during sign in" }
  }
}

export const signOut = async () => {
  try {
    console.log("🔐 Signing out...")
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error)
      return { success: false, error: error.message }
    }
    console.log("✅ Sign out successful")
    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return { success: false, error: "An unexpected error occurred during sign out" }
  }
}

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Get user error:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Get user profile error:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Get user profile error:", error)
    return null
  }
}

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Update user profile error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Update user profile error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Dummy functions for compatibility
export const syncUserData = async (userId: string, userData: any) => {
  console.log("Sync user data called for:", userId)
  return { success: true }
}

export const loadUserData = async (userId: string) => {
  console.log("Load user data called for:", userId)
  return { success: true, userData: null }
}

export const setupRealtimeSync = (userId: string, callback: (payload: any) => void) => {
  console.log("Setup realtime sync called for:", userId)
  return () => console.log("Cleanup realtime sync")
}
