import { type NextRequest, NextResponse } from "next/server"
import { getTrendingMusic, type ModernSong } from "@/lib/modernMusicApi"

export const revalidate = 0
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const apiResponse = await getTrendingMusic()

    if (!apiResponse.success) {
      console.warn("Trending API returned an error:", apiResponse.message)
    }

    const trending: ModernSong[] = Array.isArray(apiResponse?.data?.trending) ? apiResponse.data.trending : []

    return NextResponse.json({
      success: true,
      data: {
        trending: trending,
      },
    })
  } catch (error: any) {
    console.error("Trending API error:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Trending failed",
      },
      { status: 500 },
    )
  }
}
