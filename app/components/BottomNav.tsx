"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Search, Library, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

const BottomNav = () => {
  const pathname = usePathname()
  const { currentSong } = useStore()

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Search", path: "/search", icon: Search },
    { name: "Your Library", path: "/library", icon: Library },
    { name: "Profile", path: "/profile", icon: User },
  ]

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-gray-800/50",
        currentSong && "border-t-0", // Remove border when player is active
      )}
    >
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <li key={item.name} className="flex-1">
                <Link href={item.path} className="relative block">
                  <div className="flex flex-col items-center py-2">
                    <div className="relative">
                      <item.icon
                        className={cn(
                          "w-5 h-5 transition-colors duration-200",
                          isActive ? "text-white" : "text-gray-400",
                        )}
                      />
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-1 transition-colors duration-200",
                        isActive ? "text-white font-medium" : "text-gray-400",
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export default BottomNav
