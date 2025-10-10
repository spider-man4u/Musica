"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Completing sign in...")

  useEffect(() => {
    const code = searchParams.get("code")
    const next = searchParams.get("next")
    if (!code) {
      setStatus("error")
      setMessage("Missing authorization code.")
      return
    }
    // Exchange code for session on the client. After success, redirect. [^4]
    ;(async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        setStatus("error")
        setMessage(error.message || "Failed to complete sign in.")
        return
      }
      setStatus("success")
      setMessage("Signed in! Redirecting...")
      setTimeout(() => {
        const target = next && next.startsWith("/") ? next : "/"
        router.replace(target)
      }, 800)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        {status === "loading" && <Loader2 className="w-6 h-6 animate-spin text-white/80" />}
        {status === "success" && <CheckCircle className="w-6 h-6 text-green-400" />}
        {status === "error" && <AlertTriangle className="w-6 h-6 text-yellow-400" />}
        <p className="text-white/90">{message}</p>
      </div>
    </div>
  )
}
