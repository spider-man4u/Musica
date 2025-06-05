"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Search, UserPlus, UserMinus, Music, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function FollowingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [followingList, setFollowingList] = useState([
    {
      id: "1",
      name: "Arijit Singh",
      type: "artist",
      followers: "15.2M",
      image: "/placeholder.svg?height=80&width=80",
      isFollowing: true,
      latestSong: "Kesariya",
    },
    {
      id: "2",
      name: "Shreya Ghoshal",
      type: "artist",
      followers: "12.8M",
      image: "/placeholder.svg?height=80&width=80",
      isFollowing: true,
      latestSong: "Ghar More Pardesiya",
    },
    {
      id: "3",
      name: "AR Rahman",
      type: "artist",
      followers: "18.5M",
      image: "/placeholder.svg?height=80&width=80",
      isFollowing: true,
      latestSong: "Ponniyin Selvan",
    },
    {
      id: "4",
      name: "Music Lover",
      type: "user",
      followers: "1.2K",
      image: "/placeholder.svg?height=80&width=80",
      isFollowing: true,
      latestSong: "Created 'Chill Vibes' playlist",
    },
    {
      id: "5",
      name: "Atif Aslam",
      type: "artist",
      followers: "8.9M",
      image: "/placeholder.svg?height=80&width=80",
      isFollowing: true,
      latestSong: "Rafta Rafta",
    },
  ])

  const suggestedFollows = [
    {
      id: "6",
      name: "Neha Kakkar",
      type: "artist",
      followers: "11.3M",
      image: "/placeholder.svg?height=80&width=80",
      isFollowing: false,
      latestSong: "O Saki Saki",
    },
    {
      id: "7",
      name: "Rahat Fateh Ali Khan",
      type: "artist",
      followers: "6.7M",
      image: "/placeholder.svg?height=80&width=80",
      isFollowing: false,
      latestSong: "Ishq Sufiyana",
    },
    {
      id: "8",
      name: "Bollywood Hits",
      type: "user",
      followers: "892",
      image: "/placeholder.svg?height=80&width=80",
      isFollowing: false,
      latestSong: "Updated 'Top 50 Bollywood' playlist",
    },
  ]

  const toggleFollow = (id: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      // Unfollow - remove from following list
      setFollowingList((prev) => prev.filter((item) => item.id !== id))
    } else {
      // Follow - move from suggested to following
      const userToFollow = suggestedFollows.find((user) => user.id === id)
      if (userToFollow) {
        setFollowingList((prev) => [...prev, { ...userToFollow, isFollowing: true }])
      }
    }
  }

  const filteredFollowing = followingList.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredSuggested = suggestedFollows.filter(
    (user) =>
      !followingList.some((following) => following.id === user.id) &&
      user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8 pt-8">
          <Link href="/profile">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="w-6 h-6 text-white mr-4" />
            </motion.div>
          </Link>
          <h1 className="text-3xl font-bold text-white">Following</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-center"
          >
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{followingList.length}</div>
            <div className="text-gray-400 text-sm">Following</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-center"
          >
            <Music className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {followingList.filter((u) => u.type === "artist").length}
            </div>
            <div className="text-gray-400 text-sm">Artists</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-center"
          >
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{followingList.filter((u) => u.type === "user").length}</div>
            <div className="text-gray-400 text-sm">Users</div>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mb-8"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search following..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </motion.div>

        {/* Following List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Following ({filteredFollowing.length})</h2>

          {filteredFollowing.length > 0 ? (
            <div className="space-y-4">
              {filteredFollowing.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user.image || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-white font-semibold">{user.name}</h3>
                      <p className="text-gray-400 text-sm capitalize">
                        {user.type} • {user.followers} followers
                      </p>
                      <p className="text-gray-500 text-xs">{user.latestSong}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFollow(user.id, true)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No following found</p>
            </div>
          )}
        </motion.div>

        {/* Suggested Follows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Suggested for You</h2>

          {filteredSuggested.length > 0 ? (
            <div className="space-y-4">
              {filteredSuggested.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user.image || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-white font-semibold">{user.name}</h3>
                      <p className="text-gray-400 text-sm capitalize">
                        {user.type} • {user.followers} followers
                      </p>
                      <p className="text-gray-500 text-xs">{user.latestSong}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => toggleFollow(user.id, false)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No suggestions available</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
