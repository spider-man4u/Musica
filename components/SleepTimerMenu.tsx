"use client"

import { useState, useCallback } from "react"
import { Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { toast } from "@/components/ui/use-toast"

interface SleepTimerProps {
  onSetTimer: (minutes: number) => void
  onClose: () => void
}

export default function SleepTimerMenu({ onSetTimer, onClose }: SleepTimerProps) {
  const [customMinutes, setCustomMinutes] = useState(15)

  const presets = [
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "1 hour", value: 60 },
    { label: "2 hours", value: 120 },
  ]

  const handleSetTimer = useCallback(
    (minutes: number) => {
      onSetTimer(minutes)
      toast({
        title: "Sleep Timer Set",
        description: `Music will stop in ${minutes} minutes`,
      })
      onClose()
    },
    [onSetTimer, onClose],
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 w-80 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Clock className="w-5 h-5 text-purple-400" />
          Sleep Timer
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            onClick={() => handleSetTimer(preset.value)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white justify-center"
          >
            {preset.label}
          </Button>
        ))}

        <div className="flex gap-2 pt-2">
          <input
            type="number"
            min="1"
            max="240"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Number(e.target.value))}
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
            placeholder="Custom minutes"
          />
          <Button
            onClick={() => handleSetTimer(customMinutes)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Set
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
