import { NextRequest, NextResponse } from 'next/server';

interface MetricsPayload {
  type: string;
  metrics: Record<string, any>;
  timestamp: number;
  url: string;
  userAgent?: string;
}

/**
 * POST /api/metrics
 * Collect performance metrics from clients
 */
export async function POST(request: NextRequest) {
  try {
    const payload: MetricsPayload = await request.json();

    console.log('[API] Metrics received:', {
      type: payload.type,
      url: payload.url,
      timestamp: new Date(payload.timestamp).toISOString(),
    });

    // TODO: Store metrics in database
    // Example: await db.metrics.create(payload)

    // Log metrics for monitoring
    if (payload.metrics.firstContentfulPaint) {
      console.log(
        `[Metrics] FCP: ${payload.metrics.firstContentfulPaint}ms`
      );
    }
    if (payload.metrics.pageLoadTime) {
      console.log(`[Metrics] Load: ${payload.metrics.pageLoadTime}ms`);
    }

    return NextResponse.json(
      { success: true, id: Date.now() },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/metrics
 * Get performance metrics summary
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Query metrics from database and return summary
    // Example: const summary = await db.metrics.getSummary()

    return NextResponse.json({
      success: true,
      summary: {
        avgPageLoadTime: 0,
        avgFCP: 0,
        avgLCP: 0,
        avgCLS: 0,
        samples: 0,
      },
    });
  } catch (error) {
    console.error('[API] Metrics summary error:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics summary' },
      { status: 500 }
    );
  }
}
