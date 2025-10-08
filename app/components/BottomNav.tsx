"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Search, Library, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

const tabs = [
  { name: "Home", path: "/", icon: Home },
  { name: "Search", path: "/search", icon: Search },
  { name: "Library", path: "/library", icon: Library },
  { name: "Profile", path: "/profile", icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { currentSong } = useStore()

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-40", "px-3 py-2 md:px-6 md:py-3")} aria-label="Primary">
      <div
        className={cn(
          "mx-auto max-w-3xl md:max-w-4xl",
          "rounded-2xl border border-gray-700/60 bg-black/70 backdrop-blur-xl",
          "shadow-[0_8px_40px_rgba(0,0,0,0.45)]",
        )}
      >
        <ul className="relative grid grid-cols-4">
          <AnimatePresence initial={false}>
            {tabs.map((t) => {
              const active = pathname === t.path
              const Icon = t.icon
              return (
                <li key={t.path} className="relative">
                  <Link
                    href={t.path}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 md:py-4 transition-colors",
                      active ? "text-white" : "text-gray-400 hover:text-white",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <motion.div
                      initial={false}
                      animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="relative"
                    >
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                      {active && (
                        <motion.span
                          layoutId="active-dot"
                          className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400"
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                        />
                      )}
                    </motion.div>
                    <span className="sr-only md:not-sr-only md:text-sm">{t.name}</span>
                  </Link>
                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="pointer-events-none absolute inset-1 -z-10 rounded-xl bg-gradient-to-r from-purple-600/15 to-emerald-600/15"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </li>
              )
            })}
          </AnimatePresence>
        </ul>
        {currentSong && (
          <div className="flex items-center justify-center pb-2 text-[10px] text-gray-400 md:text-xs">
            <Sparkles className="mr-1 h-3 w-3" />
            Now Playing: <span className="ml-1 truncate max-w-[160px] md:max-w-[240px]">{currentSong.title}</span>
          </div>
        )}
      </div>
    </nav>
  )
}
