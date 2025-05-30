"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, AlertCircle, CheckCircle, RefreshCw, Wifi, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

export default function ModernApiStatusIndicator() {
  const { apiStatus, workingApis, checkApiStatus, retryConnection, isLoading } = useStore()
  const [isRetrying, setIsRetrying] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [autoHide, setAutoHide] = useState(false)

  useEffect(() => {
    // Check API status on mount
    checkApiStatus()

    // Check API status every minute
    const interval = setInterval(checkApiStatus, 60 * 1000)

    // Auto-hide the indicator after 5 seconds if status is healthy
    if (apiStatus === "healthy" && !showDetails) {
      const hideTimer = setTimeout(() => {
        setAutoHide(true)
      }, 5000)
      return () => {
        clearInterval(interval)
        clearTimeout(hideTimer)
      }
    }

    return () => clearInterval(interval)
  }, [checkApiStatus, apiStatus, showDetails])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await retryConnection()
    } finally {
      setIsRetrying(false)
    }
  }

  const getStatusConfig = () => {
    switch (apiStatus) {
      case "healthy":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          message: `Connected to ${workingApis.length} API${workingApis.length !== 1 ? "s" : ""}`,
          details: workingApis.join(", "),
          showRetry: false,
        }
      case "unhealthy":
        return {
          icon: WifiOff,
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
          message: "API connection issues",
          details: "Using fallback data sources",
          showRetry: true,
        }
      default:
        return {
          icon: AlertCircle,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
          message: "Connecting to music APIs...",
          details: "Testing multiple music services",
          showRetry: false,
        }
    }
  }

  const config = getStatusConfig()

  // Don't show the indicator if it's set to auto-hide and status is healthy
  if (autoHide && apiStatus === "healthy" && !showDetails) {
    return null
  }

  return (
    <AnimatePresence>
      {(apiStatus !== "healthy" || isLoading || showDetails || !autoHide) && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className={`fixed top-4 right-4 z-50 ${config.bgColor} ${config.borderColor} border backdrop-blur-xl rounded-xl shadow-lg max-w-sm`}
          onClick={() => {
            if (apiStatus === "healthy") {
              setShowDetails(!showDetails)
              setAutoHide(false)
            }
          }}
        >
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 flex-1">
                {isRetrying ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <RefreshCw className="w-5 h-5 text-blue-400" />
                  </motion.div>
                ) : (
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                )}
                <div className="flex-1">
                  <div className={`text-sm font-medium ${config.color}`}>
                    {isRetrying ? "Reconnecting..." : config.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{config.details}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {config.showRetry && !isRetrying && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRetry()
                    }}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 h-8 px-3"
                  >
                    <Wifi className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}

                {apiStatus === "healthy" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDetails(!showDetails)
                      setAutoHide(false)
                    }}
                    className="text-green-400 hover:bg-green-500/10 h-8 px-2"
                  >
                    <Zap className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Modern API Status Details */}
            {apiStatus === "healthy" && showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-green-500/20"
              >
                <div className="text-xs text-green-400 font-medium mb-2">🚀 Working Music APIs</div>
                <div className="space-y-1 text-xs">
                  {workingApis.map((api) => (
                    <div key={api} className="flex justify-between">
                      <span className="text-gray-400">{api}:</span>
                      <span className="text-green-400">✓ Active</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
