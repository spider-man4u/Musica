"use client"

import { useState, useEffect } from "react"
import { Clock, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface SleepTimerMenuProps {
  onClose: () => void
}

export default function SleepTimerMenu({ onClose }: SleepTimerMenuProps) {
  const [customMinutes, setCustomMinutes] = useState("")
  const [activeSleepTimer, setActiveSleepTimer] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)

  const presets = [
    { label: "15 min", minutes: 15 },
    { label: "30 min", minutes: 30 },
    { label: "60 min", minutes: 60 },
    { label: "120 min", minutes: 120 },
  ]

  useEffect(() => {
    const savedEndTime = localStorage.getItem("sleepTimerEnd")
    if (savedEndTime) {
      const endTime = Number.parseInt(savedEndTime)
      const now = Date.now()
      if (endTime > now) {
        const remaining = Math.ceil((endTime - now) / 1000 / 60)
        setActiveSleepTimer(remaining)

        const interval = setInterval(() => {
          const now2 = Date.now()
          if (endTime > now2) {
            const remaining2 = Math.ceil((endTime - now2) / 1000 / 60)
            setRemainingTime(remaining2)
            setActiveSleepTimer(remaining2)
          } else {
            setActiveSleepTimer(null)
            localStorage.removeItem("sleepTimerEnd")
            clearInterval(interval)
          }
        }, 1000)

        return () => clearInterval(interval)
      } else {
        localStorage.removeItem("sleepTimerEnd")
      }
    }
  }, [])

  const handleSetTimer = (minutes: number) => {
    const endTime = Date.now() + minutes * 60 * 1000
    localStorage.setItem("sleepTimerEnd", endTime.toString())
    setActiveSleepTimer(minutes)

    window.dispatchEvent(new CustomEvent("sleepTimerSet", { detail: { endTime, minutes } }))

    toast({
      title: "Sleep Timer Set",
      description: `Music will fade out in ${minutes} minutes`,
    })
  }

  const handleCustomTimer = () => {
    const minutes = Number.parseInt(customMinutes)
    if (minutes > 0 && minutes <= 480) {
      handleSetTimer(minutes)
      setCustomMinutes("")
    } else {
      toast({
        title: "Invalid time",
        description: "Please enter a value between 1 and 480 minutes",
        variant: "destructive",
      })
    }
  }

  const handleDisableTimer = () => {
    localStorage.removeItem("sleepTimerEnd")
    setActiveSleepTimer(null)
    window.dispatchEvent(new CustomEvent("sleepTimerDisabled"))
    toast({
      title: "Sleep Timer Disabled",
      description: "Music will continue playing",
    })
  }

  const handleIncreaseTime = () => {
    if (activeSleepTimer) {
      const newMinutes = activeSleepTimer + 15
      if (newMinutes <= 480) {
        handleSetTimer(newMinutes)
        toast({
          title: "Time Extended",
          description: `Timer extended to ${newMinutes} minutes`,
        })
      } else {
        toast({
          title: "Max time reached",
          description: "Cannot exceed 480 minutes (8 hours)",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="absolute top-0 right-0 mt-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-2xl p-6 w-80 border border-purple-500/20 z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Sleep Timer</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeSleepTimer && activeSleepTimer > 0 && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-300 font-semibold text-lg">{activeSleepTimer} minutes remaining</p>
          <p className="text-green-300/70 text-sm mt-1">Music will stop after this time</p>
        </div>
      )}

      <div className="space-y-3">
        {presets.map((preset) => (
          <button
            key={preset.minutes}
            onClick={() => handleSetTimer(preset.minutes)}
            className="w-full px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg transition-colors text-sm font-medium border border-purple-500/20 hover:border-purple-500/40"
          >
            {preset.label}
          </button>
        ))}

        <div className="pt-3 border-t border-slate-700">
          <label className="block text-xs text-gray-400 mb-2">Custom time (minutes)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="1-480"
              max="480"
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleCustomTimer}
              disabled={!customMinutes}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
            >
              Set
            </button>
          </div>
        </div>

        {activeSleepTimer && activeSleepTimer > 0 && (
          <div className="pt-3 border-t border-slate-700 space-y-2">
            <button
              onClick={handleIncreaseTime}
              className="w-full px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg transition-colors text-sm font-medium border border-blue-500/20 hover:border-blue-500/40"
            >
              Add 15 Minutes
            </button>
            <button
              onClick={handleDisableTimer}
              className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg transition-colors text-sm font-medium border border-red-500/20 hover:border-red-500/40"
            >
              Disable Timer
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <p className="text-xs text-blue-300">Music will gradually fade out when the timer reaches zero</p>
      </div>
    </div>
  )
}
