import type { Song } from "./store"

// Sample songs data to use when API fails
export const sampleSongs: Song[] = [
  {
    id: "1",
    title: "Kesariya",
    artist: "Arijit Singh",
    album: "Brahmastra",
    image: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220825141240-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 268,
    language: "hindi",
    year: "2022",
    playCount: "50000000",
  },
  {
    id: "2",
    title: "Apna Bana Le",
    artist: "Arijit Singh",
    album: "Bhediya",
    image: "https://c.saavncdn.com/314/Bhediya-Hindi-2022-20221123111951-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 245,
    language: "hindi",
    year: "2022",
    playCount: "45000000",
  },
  {
    id: "3",
    title: "Pal Pal Dil Ke Paas",
    artist: "Arijit Singh",
    album: "Pal Pal Dil Ke Paas",
    image: "https://c.saavncdn.com/067/Pal-Pal-Dil-Ke-Paas-Hindi-2019-20190830181608-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 312,
    language: "hindi",
    year: "2019",
    playCount: "40000000",
  },
  {
    id: "4",
    title: "Raataan Lambiyan",
    artist: "Tanishk Bagchi, Jubin Nautiyal, Asees Kaur",
    album: "Shershaah",
    image:
      "https://c.saavncdn.com/236/Shershaah-Original-Motion-Picture-Soundtrack--Hindi-2021-20210815181610-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: 298,
    language: "hindi",
    year: "2021",
    playCount: "38000000",
  },
  {
    id: "5",
    title: "Dil Bechara",
    artist: "A.R. Rahman, Mohit Chauhan",
    album: "Dil Bechara",
    image: "https://c.saavncdn.com/503/Dil-Bechara-Hindi-2020-20200710184321-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    duration: 276,
    language: "hindi",
    year: "2020",
    playCount: "35000000",
  },
  {
    id: "6",
    title: "Tum Hi Aana",
    artist: "Jubin Nautiyal",
    album: "Marjaavaan",
    image: "https://c.saavncdn.com/652/Marjaavaan-Hindi-2019-20191108064820-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    duration: 254,
    language: "hindi",
    year: "2019",
    playCount: "32000000",
  },
  {
    id: "7",
    title: "Bekhayali",
    artist: "Sachet Tandon",
    album: "Kabir Singh",
    image: "https://c.saavncdn.com/191/Kabir-Singh-Hindi-2019-20190621150445-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    duration: 321,
    language: "hindi",
    year: "2019",
    playCount: "48000000",
  },
  {
    id: "8",
    title: "Malang Sajna",
    artist: "Sachet Tandon, Parampara Thakur",
    album: "Malang",
    image: "https://c.saavncdn.com/405/Malang-Hindi-2020-20200207041904-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: 287,
    language: "hindi",
    year: "2020",
    playCount: "30000000",
  },
  {
    id: "9",
    title: "Ghungroo",
    artist: "Arijit Singh, Shilpa Rao",
    album: "War",
    image: "https://c.saavncdn.com/652/War-Hindi-2019-20190930113245-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    duration: 295,
    language: "hindi",
    year: "2019",
    playCount: "42000000",
  },
  {
    id: "10",
    title: "Tera Ban Jaunga",
    artist: "Akhil Sachdeva, Tulsi Kumar",
    album: "Kabir Singh",
    image: "https://c.saavncdn.com/191/Kabir-Singh-Hindi-2019-20190621150445-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    duration: 263,
    language: "hindi",
    year: "2019",
    playCount: "36000000",
  },
  {
    id: "11",
    title: "Vaaste",
    artist: "Dhvani Bhanushali, Nikhil D'Souza",
    album: "Vaaste",
    image: "https://c.saavncdn.com/243/Vaaste-Hindi-2019-20190417040834-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    duration: 189,
    language: "hindi",
    year: "2019",
    playCount: "28000000",
  },
  {
    id: "12",
    title: "Khamoshiyan",
    artist: "Arijit Singh",
    album: "Khamoshiyan",
    image: "https://c.saavncdn.com/427/Khamoshiyan-Hindi-2015-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    duration: 278,
    language: "hindi",
    year: "2015",
    playCount: "25000000",
  },
  {
    id: "13",
    title: "Tum Se Hi",
    artist: "Mohit Chauhan",
    album: "Jab We Met",
    image: "https://c.saavncdn.com/427/Jab-We-Met-Hindi-2007-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    duration: 295,
    language: "hindi",
    year: "2007",
    playCount: "22000000",
  },
  {
    id: "14",
    title: "Channa Mereya",
    artist: "Arijit Singh",
    album: "Ae Dil Hai Mushkil",
    image: "https://c.saavncdn.com/652/Ae-Dil-Hai-Mushkil-Hindi-2016-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    duration: 289,
    language: "hindi",
    year: "2016",
    playCount: "44000000",
  },
  {
    id: "15",
    title: "Hawayein",
    artist: "Arijit Singh",
    album: "Jab Harry Met Sejal",
    image: "https://c.saavncdn.com/191/Jab-Harry-Met-Sejal-Hindi-2017-500x500.jpg",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    duration: 267,
    language: "hindi",
    year: "2017",
    playCount: "31000000",
  },
  {
    id: "16",
    title: "Perfect",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    duration: 263,
    language: "english",
    year: "2017",
    playCount: "55000000",
  },
  {
    id: "17",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3",
    duration: 233,
    language: "english",
    year: "2017",
    playCount: "60000000",
  },
  {
    id: "18",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3",
    duration: 200,
    language: "english",
    year: "2019",
    playCount: "52000000",
  },
  {
    id: "19",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    image: "https://i.scdn.co/image/ab67616d0000b273adaeba4b2b5b6e8b6b6b6e8b",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3",
    duration: 174,
    language: "english",
    year: "2020",
    playCount: "48000000",
  },
  {
    id: "20",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    image: "https://i.scdn.co/image/ab67616d0000b273fc915b69600dce2991ec8042",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3",
    duration: 203,
    language: "english",
    year: "2020",
    playCount: "46000000",
  },
]

// Function to get trending songs (shuffled sample)
export function getTrendingSampleSongs(): Song[] {
  const shuffled = [...sampleSongs].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 15)
}

// Function to search songs from sample data
export function searchSampleSongs(query: string): Song[] {
  if (!query.trim()) return []

  const searchTerm = query.toLowerCase()
  return sampleSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm) ||
      song.artist.toLowerCase().includes(searchTerm) ||
      song.album.toLowerCase().includes(searchTerm) ||
      song.language?.toLowerCase().includes(searchTerm),
  )
}

// Function to get songs by language
export function getSongsByLanguage(language: string): Song[] {
  return sampleSongs.filter((song) => song.language?.toLowerCase() === language.toLowerCase())
}

// Function to get songs by artist
export function getSongsByArtist(artist: string): Song[] {
  return sampleSongs.filter((song) => song.artist.toLowerCase().includes(artist.toLowerCase()))
}
