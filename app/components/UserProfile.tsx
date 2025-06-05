"use client"
import { Button } from "@/components/ui/button"
import { Moon } from "lucide-react"
import { useTheme } from "@/lib/themeContext"

const UserProfile = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-medium">Profile Information</h3>
        <p className="text-sm text-gray-500">Update your profile information here.</p>
      </div>
      <div className="space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-lg transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">Dark Mode</h4>
              <p className="text-gray-400 text-sm">Toggle dark/light theme</p>
            </div>
          </div>
          <Button onClick={toggleTheme} variant="ghost" size="sm" className="text-white hover:bg-white/10">
            {theme === "dark" ? "On" : "Off"}
          </Button>
        </div>
        {/* Other settings can be added here */}
      </div>
    </div>
  )
}

export default UserProfile
