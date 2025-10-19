export async function validateAudioUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== "string") return false

  try {
    const response = await fetch(url, {
      method: "HEAD",
      mode: "cors",
      cache: "no-cache",
    })
    return response.ok || response.status === 206 // 206 = Partial Content (streaming)
  } catch (error) {
    console.error("Audio URL validation failed:", error)
    return false
  }
}

export function sanitizeAudioUrl(url: string): string {
  if (!url) return ""
  // Remove any query params that might cause issues
  return url.split("?")[0].trim()
}
