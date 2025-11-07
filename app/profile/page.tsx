"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ChevronRight,
  Lock,
  Clock,
  HelpCircle,
  Settings,
  LogOut,
  Edit,
  Camera,
  Music,
  Heart,
  Bell,
  Download,
  Globe,
  Check,
  User,
  Mail,
  MapPin,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useDateTime } from "@/hooks/useDateTime"
import { updateProfile as updateSupabaseProfile, signOut } from "@/lib/supabase"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedEmail, setEditedEmail] = useState("")
  const [editedBio, setEditedBio] = useState("")
  const [editedLocation, setEditedLocation] = useState("")
  const [profileImage, setProfileImage] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loginMethod, setLoginMethod] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { userData, updateUserProfile, updateUserSettings } = useStore()
  const router = useRouter()
  const dateTime = useDateTime()

  useEffect(() => {
    // Load user data from localStorage and userData store
    const storedName = localStorage.getItem("username")
    const storedEmail = localStorage.getItem("email")
    const storedBio = localStorage.getItem("userBio")
    const storedLocation = localStorage.getItem("userLocation")
    const storedImage = localStorage.getItem("userImage")
    const storedLoginMethod = localStorage.getItem("loginMethod")

    setEditedName(storedName || userData.name || "Music Lover")
    setEditedEmail(storedEmail || userData.email || "user@example.com")
    setEditedBio(storedBio || "Music enthusiast who loves discovering new sounds")
    setEditedLocation(storedLocation || "New York, USA")
    setProfileImage(storedImage || userData.avatar || "")
    setLoginMethod(storedLoginMethod || "")
  }, [userData])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadingImage(true)

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfileImage(result)
        localStorage.setItem("userImage", result)
        updateUserProfile({ avatar: result })
        const uid = localStorage.getItem("supabase_user_id") || userData.id
        if (uid) {
          updateSupabaseProfile(uid, { avatar: result }).catch(() => {})
        }
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = () => {
    localStorage.setItem("username", editedName)
    localStorage.setItem("email", editedEmail)
    localStorage.setItem("userBio", editedBio)
    localStorage.setItem("userLocation", editedLocation)

    updateUserProfile({
      name: editedName,
      email: editedEmail,
      avatar: profileImage,
      bio: editedBio,
      location: editedLocation,
    })

    const uid = localStorage.getItem("supabase_user_id") || userData.id
    if (uid) {
      updateSupabaseProfile(uid, {
        name: editedName,
        email: editedEmail,
        avatar: profileImage || undefined,
        bio: editedBio,
        location: editedLocation,
      }).catch((err) => console.error("Profile update error:", err))
    }

    setIsEditing(false)
  }

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        // Call Supabase sign out
        await signOut()

        // Clear all user data
        localStorage.removeItem("isLoggedIn")
        localStorage.removeItem("username")
        localStorage.removeItem("email")
        localStorage.removeItem("userBio")
        localStorage.removeItem("userLocation")
        localStorage.removeItem("userImage")
        localStorage.removeItem("loginMethod")
        localStorage.removeItem("supabase_user_id")

        // Reset store
        updateUserProfile({
          id: "",
          name: "",
          email: "",
          avatar: "",
          theme: "dark",
          recentSearches: [],
          recentlyPlayed: [],
          favorites: [],
          playlists: [],
          settings: {
            notifications: true,
            quality: "high",
            downloadEnabled: true,
            language: "en",
            autoplay: true,
            crossfade: false,
          },
        })

        router.push("/auth/login")
      } catch (error) {
        console.error("Logout error:", error)
        window.location.href = "/auth/login"
      }
    }
  }

  const handleSettingsToggle = (setting: string, value: boolean) => {
    updateUserSettings({ [setting]: value })
  }

  const menuItems = [
    { icon: Music, label: "Your Music", link: "/library", count: userData.playlists.length },
    { icon: Heart, label: "Liked Songs", link: "/library?tab=favorites", count: userData.favorites.length },
    { icon: Clock, label: "Recently Played", link: "/library?tab=recent", count: userData.recentlyPlayed.length },
    { icon: Download, label: "Downloads", link: "/downloads", count: 0 },
    { icon: Lock, label: "Privacy", link: "/privacy" },
    { icon: HelpCircle, label: "Help & Support", link: "/help" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between pt-8 mb-8">
          <Link href="/">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="w-6 h-6 text-white" />
            </motion.div>
          </Link>
          <div className="text-center">
            <p className="text-white/70 text-sm">{dateTime.time}</p>
            <h1 className="text-xl font-semibold text-white">Profile</h1>
          </div>
          <div className="w-6" />
        </div>

        <AnimatePresence mode="wait">
          {!showSettings ? (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Profile Header */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/10">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profileImage || "/placeholder.svg"} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        {editedName[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    {loginMethod !== "google" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-4 h-4 border-2 border-purple-900 border-t-transparent rounded-full"
                          />
                        ) : (
                          <Camera className="w-4 h-4 text-purple-900" />
                        )}
                      </motion.button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  {isEditing ? (
                    <div className="w-full space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-white flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          disabled={loginMethod === "google"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-white flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          disabled={loginMethod === "google"}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio" className="text-white">
                          Bio
                        </Label>
                        <Input
                          id="bio"
                          value={editedBio}
                          onChange={(e) => setEditedBio(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="location" className="text-white flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={editedLocation}
                          onChange={(e) => setEditedLocation(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Where are you from?"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSaveProfile}
                          className="flex-1 bg-white text-purple-900 hover:bg-white/90"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 border-white/20 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center w-full">
                      <h2 className="text-xl font-semibold text-white">{editedName}</h2>
                      <p className="text-white/70 text-sm mb-2">{editedEmail}</p>
                      {loginMethod === "google" && <p className="text-blue-400 text-xs mb-2">Signed in with Google</p>}
                      <p className="text-white/60 text-sm mb-2">{editedBio}</p>
                      <p className="text-white/50 text-xs mb-4">📍 {editedLocation}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-white/70 hover:text-white transition-colors mx-auto"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Profile
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/10">
                  <div className="text-2xl font-bold text-white">{userData.playlists.length}</div>
                  <div className="text-white/70 text-sm">Playlists</div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/10">
                  <div className="text-2xl font-bold text-white">{userData.favorites.length}</div>
                  <div className="text-white/70 text-sm">Liked</div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/10">
                  <div className="text-2xl font-bold text-white">{userData.recentlyPlayed.length}</div>
                  <div className="text-white/70 text-sm">Recent</div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
                    }}
                    whileHover={{ x: 5 }}
                    className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between border border-white/10"
                  >
                    <Link href={item.link} className="flex items-center w-full">
                      <item.icon className="w-5 h-5 mr-3 text-white" />
                      <span className="flex-1 text-white">{item.label}</span>
                      {item.count !== undefined && <span className="text-white/70 mr-2">{item.count}</span>}
                      <ChevronRight className="w-5 h-5 text-white/70" />
                    </Link>
                  </motion.div>
                ))}

                <motion.button
                  whileHover={{ x: 5 }}
                  onClick={() => setShowSettings(true)}
                  className="w-full bg-white/5 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between border border-white/10"
                >
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 mr-3 text-white" />
                    <span className="text-white">Settings</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/70" />
                </motion.button>

                <motion.button
                  whileHover={{ x: 5 }}
                  onClick={handleLogout}
                  className="w-full bg-white/5 backdrop-blur-xl rounded-2xl p-4 flex items-center border border-red-500/30"
                >
                  <LogOut className="w-5 h-5 mr-3 text-red-400" />
                  <span className="text-red-400">Logout</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center mb-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSettings(false)}
                  className="mr-4 text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <h2 className="text-xl font-semibold text-white">Settings</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <h3 className="font-medium mb-4 text-white">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bell className="w-5 h-5 mr-3 text-white/70" />
                        <span className="text-white">Push Notifications</span>
                      </div>
                      <Switch
                        checked={userData.settings.notifications}
                        onCheckedChange={(checked) => handleSettingsToggle("notifications", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <h3 className="font-medium mb-4 text-white">Playback</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Download className="w-5 h-5 mr-3 text-white/70" />
                        <span className="text-white">Download over WiFi only</span>
                      </div>
                      <Switch
                        checked={userData.settings.downloadEnabled}
                        onCheckedChange={(checked) => handleSettingsToggle("downloadEnabled", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <h3 className="font-medium mb-4 text-white">Audio Quality</h3>
                  <div className="space-y-2">
                    {["high", "medium", "low"].map((quality) => (
                      <motion.button
                        key={quality}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => updateUserSettings({ quality: quality as any })}
                        className={`w-full text-left p-3 rounded-xl transition-colors ${
                          userData.settings.quality === quality
                            ? "bg-white text-purple-900"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <h3 className="font-medium mb-4 text-white">Language & Region</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 mr-3 text-white/70" />
                      <span className="text-white">Language</span>
                    </div>
                    <span className="text-white/70">English</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
