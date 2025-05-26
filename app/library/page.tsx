"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Play, Pause, Heart, MoreHorizontal, ChevronLeft, Download, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

interface Song {
  id: string
  title: string
  artist: string
  duration: string
}

interface Playlist {
  id: string
  title: string
  songs: number
  image: string
  songList: Song[]
}

const libraryContent = {
  playlists: [
    {
      id: "1",
      title: "Liked Songs",
      songs: 47,
      image: "/placeholder.svg?height=150&width=150",
      songList: Array.from({ length: 47 }, (_, i) => ({
        id: `liked-${i}`,
        title: `Liked Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        duration: `${Math.floor(Math.random() * 2) + 2}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
      })),
    },
    {
      id: "2",
      title: "Chill Vibes",
      songs: 23,
      image: "/placeholder.svg?height=150&width=150",
      songList: Array.from({ length: 23 }, (_, i) => ({
        id: `chill-${i}`,
        title: `Chill Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        duration: `${Math.floor(Math.random() * 2) + 2}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
      })),
    },
    {
      id: "3",
      title: "Workout Mix",
      songs: 31,
      image: "/placeholder.svg?height=150&width=150",
      songList: Array.from({ length: 31 }, (_, i) => ({
        id: `workout-${i}`,
        title: `Workout Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        duration: `${Math.floor(Math.random() * 2) + 2}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
      })),
    },
  ],
  recentlyPlayed: [
    { id: "4", title: "Midnight City", artist: "M83", image: "/placeholder.svg?height=60&width=60" },
    { id: "5", title: "Blinding Lights", artist: "The Weeknd", image: "/placeholder.svg?height=60&width=60" },
    { id: "6", title: "Levitating", artist: "Dua Lipa", image: "/placeholder.svg?height=60&width=60" },
  ],
}

export default function Library() {
  const [expandedPlaylist, setExpandedPlaylist] = useState<Playlist | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const { setCurrentSong, setIsPlaying: setGlobalPlaying } = useStore()

  const handlePlaylistClick = (playlist: Playlist) => {
    setExpandedPlaylist(playlist)
  }

  const handleBack = () => {
    setExpandedPlaylist(null)
  }

  const handleSongClick = (song: any) => {
    setCurrentSong(song)
    setGlobalPlaying(true)
  }

  return (
    <div className="min-h-screen relative">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 pointer-events-none" />

      <div className="relative z-10 pb-20">
        <AnimatePresence mode="wait">
          {expandedPlaylist ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <Button variant="ghost" onClick={handleBack} className="mb-6 text-white hover:bg-white/10">
                <ChevronLeft className="mr-2 w-5 h-5" /> Back
              </Button>

              <div className="flex flex-col items-center mb-8">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-64 h-64 mb-6">
                  <div className="glass-purple rounded-3xl w-full h-full flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <Heart className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">{expandedPlaylist.title}</h2>
                <p className="text-white/70 mb-6">{expandedPlaylist.songs} songs</p>

                <div className="flex items-center space-x-4">
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 bg-white text-black hover:bg-white/90"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 text-white hover:bg-white/10">
                    <Shuffle className="w-6 h-6" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 text-white hover:bg-white/10">
                    <Download className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-500px)]">
                <div className="space-y-2">
                  {expandedPlaylist.songList.map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: index * 0.02 },
                      }}
                      className="glass-dark rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer"
                      onClick={() => handleSongClick(song)}
                    >
                      <div className="flex items-center">
                        <span className="w-8 text-white/70 text-sm">{index + 1}</span>
                        <div className="ml-4">
                          <p className="font-medium text-white">{song.title}</p>
                          <p className="text-sm text-white/70">{song.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white/70 text-sm">{song.duration}</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <ScrollBar />
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              {/* Header */}
              <div className="pt-8 mb-8">
                <p className="text-white/70 text-sm">9:41</p>
                <h1 className="text-3xl font-bold text-white mt-2">Your Library</h1>
              </div>

              {/* Recently Played */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Recently Played</h2>
                <ScrollArea className="w-full">
                  <div className="flex space-x-4">
                    {libraryContent.recentlyPlayed.map((song, index) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: index * 0.1 },
                        }}
                        onClick={() => handleSongClick(song)}
                        className="glass-dark rounded-2xl p-4 min-w-[200px] cursor-pointer card-hover"
                      >
                        <Image
                          src={song.image || "/placeholder.svg"}
                          alt={song.title}
                          width={120}
                          height={120}
                          className="rounded-xl w-full mb-3"
                        />
                        <h3 className="text-white font-medium truncate">{song.title}</h3>
                        <p className="text-white/70 text-sm truncate">{song.artist}</p>
                      </motion.div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </section>

              {/* Playlists */}
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Made by You</h2>
                <div className="space-y-4">
                  {libraryContent.playlists.map((playlist, index) => (
                    <motion.div
                      key={playlist.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: index * 0.1 },
                      }}
                      onClick={() => handlePlaylistClick(playlist)}
                      className="glass-dark rounded-2xl p-4 flex items-center space-x-4 cursor-pointer card-hover"
                    >
                      <div className="w-16 h-16 glass-purple rounded-xl flex items-center justify-center">
                        {playlist.title === "Liked Songs" ? (
                          <Heart className="w-8 h-8 text-white fill-current" />
                        ) : (
                          <Play className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{playlist.title}</h3>
                        <p className="text-white/70 text-sm">{playlist.songs} songs</p>
                      </div>
                      <Button size="icon" variant="ghost" className="text-white/70 hover:text-white">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
