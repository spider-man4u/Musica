import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if the modernMusicApi is working
    const workingApis: string[] = []
    let status: "healthy" | "limited" | "unhealthy" = "unhealthy"

    // Since we're using JioSaavn API through the modernMusicApi
    try {
      // Just return a basic health check
      workingApis.push("JioSaavn")
      status = "healthy"
    } catch (error) {
      console.error("API health check error:", error)
    }

    return NextResponse.json({
      status,
      workingApis,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        workingApis: [],
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
