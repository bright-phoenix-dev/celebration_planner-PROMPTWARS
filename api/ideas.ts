import type { IncomingMessage, ServerResponse } from 'http';
import { AIRequestSchema } from '../src/schemas/ai';
import { generateIdeas, AIParseError } from '../src/services/ai';
import { DEFAULT_GEMINI_MODEL, getGeminiModel } from '../src/lib/constants';

export { DEFAULT_GEMINI_MODEL, getGeminiModel };

// Sliding-window rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = parseInt(process.env['RATE_LIMIT_MAX'] ?? '10', 10);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function redactApiKey(error: unknown): string {
  const msg = error instanceof Error ? (error.stack ?? error.message) : String(error);
  const apiKey = process.env['GEMINI_API_KEY'];
  let sanitized = msg;
  if (apiKey) {
    sanitized = sanitized.replaceAll(apiKey, '[REDACTED]');
  }
  return sanitized.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]');
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  // CORS & Security headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Rate Limiting
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string' ? (forwarded.split(',')[0]?.trim() ?? 'unknown') : 'unknown';
  if (isRateLimited(ip)) {
    res.statusCode = 429;
    res.end(
      JSON.stringify({
        error: 'Too many requests. Please try again in a minute.',
      }),
    );
    return;
  }

  // Parse Body
  let rawBody = '';
  try {
    if (req.body && typeof req.body === 'object') {
      rawBody = JSON.stringify(req.body);
    } else {
      for await (const chunk of req) {
        rawBody += typeof chunk === 'string' ? chunk : String(chunk);
      }
    }
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody || '{}');
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    return;
  }

  const parseResult = AIRequestSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        error: 'Invalid request data',
        details: parseResult.error.issues.map((i) => i.message),
      }),
    );
    return;
  }

  // Check API Key
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'AI service is not configured' }));
    return;
  }

  try {
    const validated = await generateIdeas(parseResult.data.preferences);
    res.statusCode = 200;
    res.end(JSON.stringify(validated));
  } catch (error) {
    const safeErrorLog = redactApiKey(error);
    console.error('Serverless Gemini generation error:', safeErrorLog);

    const msg = error instanceof Error ? error.message : String(error);
    if (
      error instanceof AIParseError ||
      msg.includes('AI response could not be processed') ||
      msg.includes('AI returned invalid JSON')
    ) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'AI response could not be processed' }));
      return;
    }
    if (
      msg.includes('404') ||
      msg.toLowerCase().includes('not found') ||
      msg.toLowerCase().includes('is not available') ||
      msg.toLowerCase().includes('no longer available') ||
      msg.toLowerCase().includes('not supported')
    ) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'AI model unavailable' }));
      return;
    }
    if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Invalid or unauthorized Gemini API key' }));
      return;
    }
    if (msg.includes('GEMINI_API_KEY is not configured')) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: 'AI service is not configured' }));
      return;
    }
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to generate ideas. Please try again.' }));
  }
}
