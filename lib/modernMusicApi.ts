"use client"

// Modern Music API Integration - 2024 Updated
// Using only reliable, CORS-friendly APIs

// --- Modern Interfaces ---
export interface ModernSong {
  id: string
  title: string
  artist: string
  album?: string
  duration?: number
  image?: string
  preview_url?: string
  external_urls?: {
    spotify?: string
    youtube?: string
  }
  popularity?: number
  explicit?: boolean
  release_date?: string
  genres?: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
  }
}

// --- Modern Error Handling ---
class ModernApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
    public apiName?: string,
  ) {
    super(message)
    this.name = "ModernApiError"
  }
}

// --- Modern Fetch with Latest Standards ---
async function modernFetch<T>(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
    timeout?: number
    retries?: number
    apiName?: string
  } = {},
): Promise<T> {
  const { method = "GET", headers = {}, body, timeout = 8000, retries = 1, apiName = "Unknown" } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const defaultHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ...headers,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🚀 [${apiName}] Attempt ${attempt + 1}: ${method} ${url}`)

      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body,
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
        cache: "no-cache",
        redirect: "follow",
      })

      clearTimeout(timeoutId)

      console.log(`📡 [${apiName}] Response: ${response.status} ${response.statusText}`)

      // For 404 errors, throw immediately without retrying
      if (response.status === 404) {
        throw new ModernApiError(`HTTP 404: Resource not found`, 404, url, apiName)
      }

      if (!response.ok) {
        throw new ModernApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, url, apiName)
      }

      // Handle different content types
      const contentType = response.headers.get("content-type") || ""
      let data: any

      if (contentType.includes("application/json")) {
        data = await response.json()
      } else if (contentType.includes("text/")) {
        const text = await response.text()
        try {
          data = JSON.parse(text)
        } catch {
          throw new ModernApiError("Invalid JSON response", response.status, url, apiName)
        }
      } else {
        data = await response.text()
      }

      console.log(`✅ [${apiName}] Success:`, data)
      return data
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error as Error

      if (error.name === "AbortError") {
        lastError = new ModernApiError(`Request timeout after ${timeout}ms`, 408, url, apiName)
      }

      console.error(`❌ [${apiName}] Attempt ${attempt + 1} failed:`, error.message || error)

      // Don't retry on client errors (except 429) or 404 errors
      if (
        error instanceof ModernApiError &&
        ((error.status && error.status >= 400 && error.status < 500 && error.status !== 429) || error.status === 404)
      ) {
        break
      }

      // Wait before retrying
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 2000)
        console.log(`⏳ [${apiName}] Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new ModernApiError("All attempts failed", 0, url, apiName)
}

// --- JioSaavn Modern API ---
class JioSaavnAPI {
  private baseUrl = "https://saavn.dev"

  async search(query: string): Promise<ModernSong[]> {
    try {
      const url = `${this.baseUrl}/api/search/songs?query=${encodeURIComponent(query)}&page=1&limit=20`
      const response = await modernFetch<any>(url, { apiName: "JioSaavn", timeout: 6000 })

      if (response.success && response.data?.results) {
        return response.data.results.map(this.transformSong)
      }
      return []
    } catch (error) {
      console.error("JioSaavn search failed:", error.message || error)
      return []
    }
  }

  async getTrending(): Promise<ModernSong[]> {
    try {
      // Use search for popular artists instead of modules endpoint which is returning 404
      const popularArtists = ["Arijit Singh", "Neha Kakkar", "Badshah", "Shreya Ghoshal", "A.R. Rahman"]
      const randomArtist = popularArtists[Math.floor(Math.random() * popularArtists.length)]

      console.log(`🎵 [JioSaavn] Getting trending songs using artist: ${randomArtist}`)

      const url = `${this.baseUrl}/api/search/songs?query=${encodeURIComponent(randomArtist)}&page=1&limit=20`
      const response = await modernFetch<any>(url, { apiName: "JioSaavn", timeout: 6000 })

      if (response.success && response.data?.results) {
        return response.data.results.slice(0, 20).map(this.transformSong)
      }

      // Try alternative endpoint if the first one fails
      console.log(`🔄 [JioSaavn] Trying alternative trending endpoint...`)
      const altUrl = `${this.baseUrl}/api/songs?page=1&limit=20`
      const altResponse = await modernFetch<any>(altUrl, { apiName: "JioSaavn", timeout: 6000 })

      if (altResponse.success && altResponse.data) {
        return Array.isArray(altResponse.data) ? altResponse.data.map(this.transformSong) : []
      }

      return []
    } catch (error) {
      console.error("JioSaavn trending failed:", error.message || error)
      return []
    }
  }

  private transformSong(song: any): ModernSong {
    return {
      id: song.id || `saavn-${Date.now()}-${Math.random()}`,
      title: song.name || song.title || "Unknown Song",
      artist: song.primaryArtists || song.artist || "Unknown Artist",
      album: song.album?.name || song.album || "Unknown Album",
      duration: Number.parseInt(song.duration) || 0,
      image: getImageUrl(song.image),
      preview_url: getAudioUrl(song.downloadUrl),
      explicit: Boolean(song.explicitContent),
      release_date: song.year,
    }
  }
}

// --- Enhanced Sample Data API ---
class SampleDataAPI {
  // International hits
  private internationalSongs = [
    {
      id: "sample-1",
      title: "Perfect",
      artist: "Ed Sheeran",
      album: "÷ (Divide)",
      duration: 263,
      image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "sample-2",
      title: "Shape of You",
      artist: "Ed Sheeran",
      album: "÷ (Divide)",
      duration: 233,
      image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "sample-3",
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      duration: 200,
      image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
      id: "sample-4",
      title: "Watermelon Sugar",
      artist: "Harry Styles",
      album: "Fine Line",
      duration: 174,
      image: "https://i.scdn.co/image/ab67616d0000b273adaeba4b2b5b6e8b6b6b6e8b",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
    {
      id: "sample-5",
      title: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      duration: 203,
      image: "https://i.scdn.co/image/ab67616d0000b273fc915b69600dce2991ec8042",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    },
    {
      id: "sample-6",
      title: "As It Was",
      artist: "Harry Styles",
      album: "Harry's House",
      duration: 167,
      image: "https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    },
    {
      id: "sample-7",
      title: "Anti-Hero",
      artist: "Taylor Swift",
      album: "Midnights",
      duration: 200,
      image: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    },
    {
      id: "sample-8",
      title: "Unstoppable",
      artist: "Sia",
      album: "This Is Acting",
      duration: 217,
      image: "https://i.scdn.co/image/ab67616d0000b273b1a8be1c37f2b1f1c1ed6cd7",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    },
    {
      id: "sample-9",
      title: "Cheap Thrills",
      artist: "Sia",
      album: "This Is Acting",
      duration: 224,
      image: "https://i.scdn.co/image/ab67616d0000b273b1a8be1c37f2b1f1c1ed6cd7",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    },
    {
      id: "sample-10",
      title: "Calm Down",
      artist: "Rema, Selena Gomez",
      album: "Rave & Roses",
      duration: 239,
      image: "https://i.scdn.co/image/ab67616d0000b273c5716278e44f6dd4f5e7559a",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    },
    {
      id: "sample-11",
      title: "Flowers",
      artist: "Miley Cyrus",
      album: "Endless Summer Vacation",
      duration: 200,
      image: "https://i.scdn.co/image/ab67616d0000b273a635c9ba98d45bd3f4b4f42d",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    },
    {
      id: "sample-12",
      title: "Unholy",
      artist: "Sam Smith, Kim Petras",
      album: "Gloria",
      duration: 156,
      image: "https://i.scdn.co/image/ab67616d0000b273a935e4689f15953311772cc4",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    },
    {
      id: "sample-13",
      title: "Bad Guy",
      artist: "Billie Eilish",
      album: "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?",
      duration: 194,
      image: "https://i.scdn.co/image/ab67616d0000b273d55bc15651c8677bd9c093a9",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    },
    {
      id: "sample-14",
      title: "Stay",
      artist: "The Kid LAROI, Justin Bieber",
      album: "Stay",
      duration: 141,
      image: "https://i.scdn.co/image/ab67616d0000b273e85259a1cae0588a95d1fb99",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    },
    {
      id: "sample-15",
      title: "Heat Waves",
      artist: "Glass Animals",
      album: "Dreamland",
      duration: 238,
      image: "https://i.scdn.co/image/ab67616d0000b273712701c5e263efc8726b1464",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    },
  ]

  // Hindi songs
  private hindiSongs = [
    {
      id: "hindi-1",
      title: "Kesariya",
      artist: "Arijit Singh",
      album: "Brahmastra",
      duration: 268,
      image: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220825141240-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "hindi-2",
      title: "Apna Bana Le",
      artist: "Arijit Singh",
      album: "Bhediya",
      duration: 245,
      image: "https://c.saavncdn.com/314/Bhediya-Hindi-2022-20221123111951-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "hindi-3",
      title: "Pal Pal Dil Ke Paas",
      artist: "Arijit Singh",
      album: "Pal Pal Dil Ke Paas",
      duration: 312,
      image: "https://c.saavncdn.com/067/Pal-Pal-Dil-Ke-Paas-Hindi-2019-20190830181608-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
      id: "hindi-4",
      title: "Raataan Lambiyan",
      artist: "Tanishk Bagchi, Jubin Nautiyal",
      album: "Shershaah",
      duration: 298,
      image:
        "https://c.saavncdn.com/236/Shershaah-Original-Motion-Picture-Soundtrack--Hindi-2021-20210815181610-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
    {
      id: "hindi-5",
      title: "Dil Bechara",
      artist: "A.R. Rahman, Mohit Chauhan",
      album: "Dil Bechara",
      duration: 276,
      image: "https://c.saavncdn.com/503/Dil-Bechara-Hindi-2020-20200710184321-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    },
    {
      id: "hindi-6",
      title: "Tum Hi Aana",
      artist: "Jubin Nautiyal",
      album: "Marjaavaan",
      duration: 254,
      image: "https://c.saavncdn.com/652/Marjaavaan-Hindi-2019-20191108064820-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    },
    {
      id: "hindi-7",
      title: "Bekhayali",
      artist: "Sachet Tandon",
      album: "Kabir Singh",
      duration: 321,
      image: "https://c.saavncdn.com/191/Kabir-Singh-Hindi-2019-20190621150445-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    },
    {
      id: "hindi-8",
      title: "Ghungroo",
      artist: "Arijit Singh, Shilpa Rao",
      album: "War",
      duration: 295,
      image: "https://c.saavncdn.com/652/War-Hindi-2019-20190930113245-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    },
    {
      id: "hindi-9",
      title: "Tum Kya Mile",
      artist: "Arijit Singh, Shreya Ghoshal",
      album: "Rocky Aur Rani Kii Prem Kahaani",
      duration: 290,
      image: "https://c.saavncdn.com/248/Rocky-Aur-Rani-Kii-Prem-Kahaani-Hindi-2023-20230718152435-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    },
    {
      id: "hindi-10",
      title: "Chaleya",
      artist: "Arijit Singh, Shilpa Rao",
      album: "Jawan",
      duration: 230,
      image: "https://c.saavncdn.com/807/Jawan-Hindi-2023-20230921140620-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    },
    {
      id: "hindi-11",
      title: "Heeriye",
      artist: "Arijit Singh, Jasleen Royal",
      album: "Heeriye",
      duration: 210,
      image: "https://c.saavncdn.com/734/Heeriye-Hindi-2023-20230731051001-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    },
    {
      id: "hindi-12",
      title: "Phir Aur Kya Chahiye",
      artist: "Arijit Singh",
      album: "Zara Hatke Zara Bachke",
      duration: 240,
      image: "https://c.saavncdn.com/546/Zara-Hatke-Zara-Bachke-Hindi-2023-20230613162350-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    },
    {
      id: "hindi-13",
      title: "Satranga",
      artist: "Arijit Singh",
      album: "Animal",
      duration: 270,
      image: "https://c.saavncdn.com/119/Animal-Hindi-2023-20231124191036-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    },
    {
      id: "hindi-14",
      title: "Jhoome Jo Pathaan",
      artist: "Arijit Singh, Sukriti Kakar",
      album: "Pathaan",
      duration: 230,
      image: "https://c.saavncdn.com/807/Pathaan-Hindi-2022-20221222104158-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    },
    {
      id: "hindi-15",
      title: "Kahani Suno",
      artist: "Kaifi Khalil",
      album: "Kahani Suno",
      duration: 250,
      image: "https://c.saavncdn.com/977/Kahani-Suno-Hindi-2022-20220729225710-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    },
  ]

  // Trending songs (mix of both)
  private trendingSongs = [
    {
      id: "trending-1",
      title: "Arjan Vailly",
      artist: "Manan Bhardwaj, Bhupinder Babbal",
      album: "Animal",
      duration: 210,
      image: "https://c.saavncdn.com/119/Animal-Hindi-2023-20231124191036-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "trending-2",
      title: "Chaleya",
      artist: "Arijit Singh, Shilpa Rao",
      album: "Jawan",
      duration: 230,
      image: "https://c.saavncdn.com/807/Jawan-Hindi-2023-20230921140620-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "trending-3",
      title: "Heeriye",
      artist: "Arijit Singh, Jasleen Royal",
      album: "Heeriye",
      duration: 210,
      image: "https://c.saavncdn.com/734/Heeriye-Hindi-2023-20230731051001-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
    {
      id: "trending-4",
      title: "Flowers",
      artist: "Miley Cyrus",
      album: "Endless Summer Vacation",
      duration: 200,
      image: "https://i.scdn.co/image/ab67616d0000b273a635c9ba98d45bd3f4b4f42d",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
    {
      id: "trending-5",
      title: "Calm Down",
      artist: "Rema, Selena Gomez",
      album: "Rave & Roses",
      duration: 239,
      image: "https://i.scdn.co/image/ab67616d0000b273c5716278e44f6dd4f5e7559a",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    },
    {
      id: "trending-6",
      title: "Kesariya",
      artist: "Arijit Singh",
      album: "Brahmastra",
      duration: 268,
      image: "https://c.saavncdn.com/191/Brahmastra-Hindi-2022-20220825141240-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    },
    {
      id: "trending-7",
      title: "As It Was",
      artist: "Harry Styles",
      album: "Harry's House",
      duration: 167,
      image: "https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    },
    {
      id: "trending-8",
      title: "Tum Kya Mile",
      artist: "Arijit Singh, Shreya Ghoshal",
      album: "Rocky Aur Rani Kii Prem Kahaani",
      duration: 290,
      image: "https://c.saavncdn.com/248/Rocky-Aur-Rani-Kii-Prem-Kahaani-Hindi-2023-20230718152435-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    },
    {
      id: "trending-9",
      title: "Unstoppable",
      artist: "Sia",
      album: "This Is Acting",
      duration: 217,
      image: "https://i.scdn.co/image/ab67616d0000b273b1a8be1c37f2b1f1c1ed6cd7",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    },
    {
      id: "trending-10",
      title: "Phir Aur Kya Chahiye",
      artist: "Arijit Singh",
      album: "Zara Hatke Zara Bachke",
      duration: 240,
      image: "https://c.saavncdn.com/546/Zara-Hatke-Zara-Bachke-Hindi-2023-20230613162350-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    },
    {
      id: "trending-11",
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      duration: 200,
      image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    },
    {
      id: "trending-12",
      title: "Kahani Suno",
      artist: "Kaifi Khalil",
      album: "Kahani Suno",
      duration: 250,
      image: "https://c.saavncdn.com/977/Kahani-Suno-Hindi-2022-20220729225710-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    },
    {
      id: "trending-13",
      title: "Levitating",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      duration: 203,
      image: "https://i.scdn.co/image/ab67616d0000b273fc915b69600dce2991ec8042",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    },
    {
      id: "trending-14",
      title: "Apna Bana Le",
      artist: "Arijit Singh",
      album: "Bhediya",
      duration: 245,
      image: "https://c.saavncdn.com/314/Bhediya-Hindi-2022-20221123111951-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    },
    {
      id: "trending-15",
      title: "Perfect",
      artist: "Ed Sheeran",
      album: "÷ (Divide)",
      duration: 263,
      image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    },
    {
      id: "trending-16",
      title: "Jhoome Jo Pathaan",
      artist: "Arijit Singh, Sukriti Kakar",
      album: "Pathaan",
      duration: 230,
      image: "https://c.saavncdn.com/807/Pathaan-Hindi-2022-20221222104158-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    },
    {
      id: "trending-17",
      title: "Stay",
      artist: "The Kid LAROI, Justin Bieber",
      album: "Stay",
      duration: 141,
      image: "https://i.scdn.co/image/ab67616d0000b273e85259a1cae0588a95d1fb99",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3",
    },
    {
      id: "trending-18",
      title: "Raataan Lambiyan",
      artist: "Tanishk Bagchi, Jubin Nautiyal",
      album: "Shershaah",
      duration: 298,
      image:
        "https://c.saavncdn.com/236/Shershaah-Original-Motion-Picture-Soundtrack--Hindi-2021-20210815181610-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3",
    },
    {
      id: "trending-19",
      title: "Heat Waves",
      artist: "Glass Animals",
      album: "Dreamland",
      duration: 238,
      image: "https://i.scdn.co/image/ab67616d0000b273712701c5e263efc8726b1464",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3",
    },
    {
      id: "trending-20",
      title: "Satranga",
      artist: "Arijit Singh",
      album: "Animal",
      duration: 270,
      image: "https://c.saavncdn.com/119/Animal-Hindi-2023-20231124191036-500x500.jpg",
      preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3",
    },
  ]

  // Get all available sample songs
  private getAllSampleSongs(): ModernSong[] {
    return [...this.internationalSongs, ...this.hindiSongs]
  }

  async search(query: string): Promise<ModernSong[]> {
    console.log(`📦 [Sample] Searching for: ${query}`)

    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    const allSongs = this.getAllSampleSongs()
    const results = allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm) ||
        song.artist.toLowerCase().includes(searchTerm) ||
        song.album.toLowerCase().includes(searchTerm),
    )

    console.log(`📦 [Sample] Found ${results.length} results`)
    return results
  }

  async getTrending(): Promise<ModernSong[]> {
    console.log(`📦 [Sample] Getting trending songs`)
    // Return pre-curated trending songs
    return this.trendingSongs
  }
}

// --- Modern Music Service Manager ---
class ModernMusicService {
  // Remove Deezer API and rely on JioSaavn and enhanced Sample data
  private apis = [new JioSaavnAPI(), new SampleDataAPI()]

  async search(query: string): Promise<ModernSong[]> {
    console.log(`🔍 Modern search for: ${query}`)

    if (!query.trim()) {
      return []
    }

    // First try to get sample data immediately to ensure we have something to show
    let sampleResults: ModernSong[] = []
    try {
      const sampleApi = this.apis[1] // Sample data API
      sampleResults = await sampleApi.search(query)
      console.log(`📥 Found ${sampleResults.length} sample results (immediate)`)
    } catch (error) {
      console.error(`❌ Sample API search failed:`, error.message || error)
    }

    // If we have sample results, use them immediately
    const results: ModernSong[] = [...sampleResults]

    // Try JioSaavn API with a short timeout
    try {
      const jioSaavnApi = this.apis[0]
      console.log(`🔍 [JioSaavn] Starting search...`)
      const songs = await jioSaavnApi.search(query)
      console.log(`✅ [JioSaavn] Found ${songs.length} songs`)
      results.push(...songs)
    } catch (error) {
      console.error(`❌ JioSaavn API search failed:`, error.message || error)
    }

    // Remove duplicates and limit results
    const uniqueResults = this.removeDuplicates(results)
    console.log(`✅ Final result: ${uniqueResults.length} unique songs`)

    return uniqueResults.slice(0, 20)
  }

  async getTrending(): Promise<ModernSong[]> {
    console.log(`📈 Fetching modern trending songs`)

    // First try to get sample data immediately to ensure we have something to show
    let sampleResults: ModernSong[] = []
    try {
      const sampleApi = this.apis[1] // Sample data API
      sampleResults = await sampleApi.getTrending()
      console.log(`📥 Adding ${sampleResults.length} trending songs from Sample (immediate)`)
    } catch (error) {
      console.error(`❌ Sample API trending failed:`, error.message || error)
    }

    // If we have sample results, use them immediately
    const results: ModernSong[] = [...sampleResults]

    // Try JioSaavn API with a short timeout
    try {
      const jioSaavnApi = this.apis[0]
      console.log(`📈 [JioSaavn] Getting trending...`)
      const songs = await jioSaavnApi.getTrending()
      console.log(`✅ [JioSaavn] Found ${songs.length} trending songs`)
      results.push(...songs)
    } catch (error) {
      console.error(`❌ JioSaavn API trending failed:`, error.message || error)
    }

    // Remove duplicates and limit results
    const uniqueResults = this.removeDuplicates(results)
    console.log(`✅ Final trending result: ${uniqueResults.length} unique songs`)

    // If we have no results from APIs, ensure we return sample data
    if (uniqueResults.length === 0) {
      console.log(`⚠️ No trending results from APIs, using sample data fallback`)
      return sampleResults
    }

    return uniqueResults.slice(0, 20)
  }

  private removeDuplicates(songs: ModernSong[]): ModernSong[] {
    const seen = new Set<string>()
    return songs.filter((song) => {
      const key = `${song.title.toLowerCase().trim()}-${song.artist.toLowerCase().trim()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  async checkHealth(): Promise<{ status: string; workingApis: string[]; message: string }> {
    console.log(`🏥 Checking modern API health`)

    // Sample data is always considered working
    const workingApis: string[] = ["Sample"]
    console.log(`✅ [Sample] Health check passed (automatic)`)

    // Check JioSaavn API with a short timeout
    try {
      console.log(`🏥 [JioSaavn] Health check...`)
      const jioSaavnApi = this.apis[0]
      const results = await jioSaavnApi.search("test")
      const isWorking = Array.isArray(results) && results.length > 0

      if (isWorking) {
        workingApis.push("JioSaavn")
        console.log(`✅ [JioSaavn] Health check passed`)
      } else {
        console.log(`❌ [JioSaavn] Health check failed - no results`)
      }
    } catch (error) {
      console.error(`❌ [JioSaavn] Health check error:`, error.message || error)
    }

    // Always consider status healthy if sample data is available
    const status = "healthy"
    const message = `${workingApis.length} APIs working: ${workingApis.join(", ")}`

    console.log(`🏥 Health check result: ${status} - ${message}`)

    return { status, workingApis, message }
  }
}

// --- Utility Functions ---
function getImageUrl(image: any): string {
  if (!image) return "/placeholder.svg?height=300&width=300"

  if (typeof image === "string") {
    return image.trim() || "/placeholder.svg?height=300&width=300"
  }

  if (Array.isArray(image)) {
    // Try to find the best quality image
    const highQuality = image.find((img) => img?.quality === "500x500" || img?.quality === "150x150")
    if (highQuality && highQuality.link && highQuality.link.trim()) {
      return highQuality.link.trim()
    }
    // Fallback to first image with a link
    for (const img of image) {
      if (img && img.link && img.link.trim()) return img.link.trim()
    }
  }

  return "/placeholder.svg?height=300&width=300"
}

function getAudioUrl(downloadUrl: any): string {
  if (!downloadUrl) return ""

  if (typeof downloadUrl === "string") {
    return downloadUrl.trim()
  }

  if (Array.isArray(downloadUrl)) {
    // Try to find the best quality audio
    const highQuality = downloadUrl.find((audio) => audio?.quality === "320kbps" || audio?.quality === "160kbps")
    if (highQuality && highQuality.link && highQuality.link.trim()) {
      return highQuality.link.trim()
    }
    // Fallback to first audio with a link
    for (const audio of downloadUrl) {
      if (audio && audio.link && audio.link.trim()) return audio.link.trim()
    }
  }

  return ""
}

// --- Export Modern Service ---
export const modernMusicService = new ModernMusicService()

// --- Legacy Compatibility Functions ---
export async function searchMusic(query: string): Promise<{ success: boolean; data: { results: ModernSong[] } }> {
  try {
    const results = await modernMusicService.search(query)
    return {
      success: true,
      data: { results },
    }
  } catch (error) {
    console.error("Modern search failed:", error.message || error)
    return {
      success: false,
      data: { results: [] },
    }
  }
}

export async function getTrendingMusic(): Promise<{ success: boolean; data: { trending: ModernSong[] } }> {
  try {
    const trending = await modernMusicService.getTrending()
    return {
      success: true,
      data: { trending },
    }
  } catch (error) {
    console.error("Modern trending failed:", error.message || error)
    return {
      success: false,
      data: { trending: [] },
    }
  }
}

export async function checkApiHealth(): Promise<{ status: string; message: string; workingEndpoint?: string }> {
  const health = await modernMusicService.checkHealth()
  return {
    status: health.status,
    message: health.message,
    workingEndpoint: health.workingApis[0] || undefined,
  }
}

// --- Utility Functions ---
export function getHighQualityImage(image: any): string {
  return getImageUrl(image)
}

export function getHighQualityAudio(audio: any): string {
  return getAudioUrl(audio)
}

export function sanitizeString(str: string | undefined): string {
  if (!str) return ""
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

export function formatDuration(duration: number): string {
  if (!duration) return "0:00"
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export { ModernApiError as ApiError }
export type { ModernSong as ApiSong }
