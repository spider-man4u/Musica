"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { supabase, ensureProfileExists, loadUserData } from "@/lib/supabase"
import { useStore } from "@/lib/store"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { setCurrentUserId, setSyncStatus } = useStore()

  useEffect(() => {
    let active = true
    const completeAuth = async () => {
      try {
        // detectSessionInUrl=true will parse the URL and set the session automatically
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!active) return
        if (session?.user) {
          await ensureProfileExists(session.user)
          setCurrentUserId(session.user.id)
          setSyncStatus("syncing")
          const res = await loadUserData(session.user.id)
          if (res.success && res.userData) {
            useStore.setState({ userData: res.userData })
            setSyncStatus("synced")
          } else {
            setSyncStatus("error")
          }
        }
      } catch (e) {
        // no-op
      } finally {
        if (active) router.replace("/")
      }
    }
    completeAuth()
    return () => {
      active = false
    }
  }, [router, setCurrentUserId, setSyncStatus])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex items-center gap-3 text-white/80">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Signing you in...</span>
      </div>
    </div>
  )
}
