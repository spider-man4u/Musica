import { type NextRequest, NextResponse } from "next/server"
import { searchMusic, type ModernSong } from "@/lib/modernMusicApi"

export const revalidate = 0
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const query = request.nextUrl.searchParams.get("query") || ""
    const apiResponse = await searchMusic(query)

    if (!apiResponse.success) {
      console.warn("Search API returned an error:", apiResponse.message)
    }

    const results: ModernSong[] = Array.isArray(apiResponse?.data?.results) ? apiResponse.data.results : []

    return NextResponse.json({
      success: true,
      data: {
        results: results,
      },
    })
  } catch (error: any) {
    console.error("Search API error:", error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Search failed",
      },
      { status: 500 },
    )
  }
}
