// JioSaavn API for Hindi music
const JIOSAAVN_BASE_URL = "https://jiosaavn-api-privatecvc.vercel.app"

export interface Track {
  id: string
  name: string
  duration: number
  artist_name: string
  album_name: string
  image: string
  audio: string
  language?: string
}

export async function searchHindiTracks(query: string): Promise<Track[]> {
  try {
    const response = await fetch(`${JIOSAAVN_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=1&limit=20`)
    const data = await response.json()

    if (data.success && data.data?.results) {
      return data.data.results.map((track: any) => ({
        id: track.id,
        name: track.name,
        duration: track.duration,
        artist_name: track.primaryArtists,
        album_name: track.album?.name || "Unknown Album",
        image: track.image?.[2]?.link || track.image?.[1]?.link || "/placeholder.svg",
        audio: track.downloadUrl?.[4]?.link || track.downloadUrl?.[3]?.link || "",
        language: track.language,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching Hindi tracks:", error)
    return []
  }
}

export async function getTrendingHindiTracks(): Promise<Track[]> {
  try {
    const response = await fetch(`${JIOSAAVN_BASE_URL}/modules?language=hindi`)
    const data = await response.json()

    if (data.success && data.data?.trending) {
      return data.data.trending.map((track: any) => ({
        id: track.id,
        name: track.name,
        duration: track.duration,
        artist_name: track.primaryArtists,
        album_name: track.album?.name || "Unknown Album",
        image: track.image?.[2]?.link || track.image?.[1]?.link || "/placeholder.svg",
        audio: track.downloadUrl?.[4]?.link || track.downloadUrl?.[3]?.link || "",
        language: track.language,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching trending Hindi tracks:", error)
    return []
  }
}

export async function getHindiPlaylistTracks(playlistId: string): Promise<Track[]> {
  try {
    const response = await fetch(`${JIOSAAVN_BASE_URL}/playlists?id=${playlistId}`)
    const data = await response.json()

    if (data.success && data.data?.songs) {
      return data.data.songs.map((track: any) => ({
        id: track.id,
        name: track.name,
        duration: track.duration,
        artist_name: track.primaryArtists,
        album_name: track.album?.name || "Unknown Album",
        image: track.image?.[2]?.link || track.image?.[1]?.link || "/placeholder.svg",
        audio: track.downloadUrl?.[4]?.link || track.downloadUrl?.[3]?.link || "",
        language: track.language,
      }))
    }
    return []
  } catch (error) {
    console.error("Error fetching playlist tracks:", error)
    return []
  }
}

// Fallback to Jamendo for international music
export async function searchInternationalTracks(query: string): Promise<Track[]> {
  const JAMENDO_CLIENT_ID = "df187b27"
  const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0"

  try {
    const response = await fetch(
      `${JAMENDO_BASE_URL}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=20&search=${query}`,
    )
    const data = await response.json()

    return (
      data.results?.map((track: any) => ({
        id: track.id,
        name: track.name,
        duration: track.duration,
        artist_name: track.artist_name,
        album_name: track.album_name,
        image: track.image,
        audio: track.audio,
        language: "en",
      })) || []
    )
  } catch (error) {
    console.error("Error fetching international tracks:", error)
    return []
  }
}
