import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AIRequestSchema } from '@/schemas/ai';
import { generateIdeas, AIParseError } from '@/services/ai';

/**
 * In-memory sliding window rate limiter.
 * Tracks request timestamps per IP.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = parseInt(process.env['RATE_LIMIT_MAX'] ?? '10', 10);

/**
 * Checks if the given IP has exceeded the rate limit.
 * @param ip - Client IP address
 * @returns true if the request should be blocked
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

/**
 * POST /api/ai/ideas
 *
 * Accepts user preferences and returns AI-generated celebration ideas.
 * Protected by rate limiting and input validation.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 },
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = AIRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    // Generate ideas
    const ideas = await generateIdeas(parsed.data.preferences);

    return NextResponse.json(ideas);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const apiKey = process.env['GEMINI_API_KEY'];
    let safeErrorLog = error instanceof Error ? (error.stack ?? error.message) : String(error);
    if (apiKey) {
      safeErrorLog = safeErrorLog.replaceAll(apiKey, '[REDACTED]');
    }
    safeErrorLog = safeErrorLog.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]');
    console.error('AI ideas generation error:', safeErrorLog);

    if (
      error instanceof AIParseError ||
      msg.includes('AI response could not be processed') ||
      msg.includes('AI returned invalid JSON')
    ) {
      return NextResponse.json({ error: 'AI response could not be processed' }, { status: 502 });
    }

    if (
      msg.includes('404') ||
      msg.toLowerCase().includes('not found') ||
      msg.toLowerCase().includes('is not available') ||
      msg.toLowerCase().includes('no longer available') ||
      msg.toLowerCase().includes('not supported')
    ) {
      return NextResponse.json({ error: 'AI model unavailable' }, { status: 404 });
    }

    if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
      return NextResponse.json(
        { error: 'Invalid or unauthorized Gemini API key' },
        { status: 401 },
      );
    }

    if (
      msg.includes('503') ||
      msg.toLowerCase().includes('high demand') ||
      msg.toLowerCase().includes('temporarily unavailable')
    ) {
      return NextResponse.json(
        { error: 'AI service is experiencing high demand. Please try again shortly.' },
        { status: 503 },
      );
    }

    const isConfigError = error instanceof Error && error.message.includes('GEMINI_API_KEY');
    return NextResponse.json(
      {
        error: isConfigError
          ? 'AI service is not configured'
          : 'Failed to generate ideas. Please try again.',
      },
      { status: isConfigError ? 503 : 500 },
    );
  }
}
