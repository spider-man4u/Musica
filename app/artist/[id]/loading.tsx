import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="text-gray-400">Loading artist...</span>
      </div>
    </div>
  )
}
