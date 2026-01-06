"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import OpeningAnimation from "@/components/OpeningAnimation"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [hasSetupProfile, setHasSetupProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { setCurrentUserId, updateUserProfile } = useStore()

  useEffect(() => {
    const checkExistingProfile = () => {
      const profileSetup = localStorage.getItem("musica_profile_setup")
      const userId = localStorage.getItem("musica_user_id")

      if (profileSetup === "true" && userId) {
        const displayName = localStorage.getItem("musica_display_name") || "Music Lover"
        const avatar = localStorage.getItem("musica_avatar") || "/placeholder.svg"

        setCurrentUserId(userId)
        updateUserProfile({
          name: displayName,
          avatar: avatar,
        })
        setHasSetupProfile(true)
      }

      setIsLoading(false)
    }

    const timer = setTimeout(checkExistingProfile, 100)
    return () => clearTimeout(timer)
  }, [setCurrentUserId, updateUserProfile])

  const handleOnboardingComplete = async (displayName: string, avatar?: string) => {
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      updateUserProfile({
        name: displayName,
        avatar: avatar || "/diverse-user-avatars.png",
      })

      localStorage.setItem("musica_profile_setup", "true")
      localStorage.setItem("musica_user_id", userId)
      localStorage.setItem("musica_display_name", displayName)
      localStorage.setItem("username", displayName)
      if (avatar) {
        localStorage.setItem("musica_avatar", avatar)
        localStorage.setItem("userImage", avatar)
      }

      setCurrentUserId(userId)
      setHasSetupProfile(true)
    } catch (err) {
      console.error("Profile setup error:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!hasSetupProfile) {
    return <OpeningAnimation onComplete={handleOnboardingComplete} isLoading={isLoading} />
  }

  return <>{children}</>
}
