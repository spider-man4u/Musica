import { Song } from './store'

export const sampleSongs: Song[] = [
  {
    id: '1',
    title: 'Dark Paradise',
    artist: 'Lana Del Rey',
    album: 'Born to Die',
    image: 'https://i.ibb.co/ZNw4X3s/hq720-3.jpg',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: '3:50',
    rating: 4,
    genre: ['Pop', 'Alternative']
  },
  {
    id: '2',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    image: 'https://i.ibb.co/GWD6s99/hq720-2.jpg',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: '3:50',
    rating: 3,
    genre: ['R&B', 'Pop']
  },
  {
    id: '3',
    title: 'Magic',
    artist: 'Sia',
    album: 'This Is Acting',
    image: 'https://i.ibb.co/VHnpMJ0/hqdefault.jpg',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: '4:15',
    rating: 5,
    genre: ['Pop']
  },
  // Add more sample songs as needed
]

export const genres = [
  { id: '1', name: 'Indie Pop', color: 'from-purple-400 to-pink-400', emoji: '🎸' },
  { id: '2', name: 'Hip Hop', color: 'from-blue-400 to-indigo-400', emoji: '🎤' },
  { id: '3', name: 'Electronic', color: 'from-green-400 to-emerald-400', emoji: '🎹' },
  { id: '4', name: 'Rock', color: 'from-red-400 to-orange-400', emoji: '🤘' },
  { id: '5', name: 'Jazz', color: 'from-yellow-400 to-amber-400', emoji: '🎷' },
  { id: '6', name: 'Classical', color: 'from-purple-400 to-violet-400', emoji: '🎻' }
]

export const defaultPlaylists = [
  {
    id: 'discover-weekly',
    title: 'Discover Weekly',
    description: 'Your weekly mix of fresh music',
    image: '/placeholder.svg?height=300&width=300',
    songs: sampleSongs.slice(0, 3),
    createdAt: new Date().toISOString()
  },
  {
    id: 'daily-mix-1',
    title: 'Daily Mix 1',
    description: 'Based on your recent listening',
    image: '/placeholder.svg?height=300&width=300',
    songs: sampleSongs.slice(1, 4),
    createdAt: new Date().toISOString()
  }
]
