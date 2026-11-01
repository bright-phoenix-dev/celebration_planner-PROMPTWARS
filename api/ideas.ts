import type { IncomingMessage, ServerResponse } from 'http';
import { AIRequestSchema } from '../src/schemas/ai.js';
import { generateIdeas } from '../src/services/ai.js';
import {
  getSecurityHeaders,
  parseRequestBody,
  checkRateLimits,
  mapAIError,
  redactApiKey,
} from '../src/lib/serverless.js';
import { DEFAULT_GEMINI_MODEL, getGeminiModel } from '../src/lib/constants.js';

export { DEFAULT_GEMINI_MODEL, getGeminiModel };

/**
 * Serverless API handler for POST /api/ideas (and rewritten /api/ai/ideas).
 *
 * Enforces method validation, dual rate limiting (per-IP and global),
 * input schema validation via Zod, and safe error translation.
 *
 * @param req - Incoming HTTP request.
 * @param res - Outgoing HTTP response.
 */
export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  // Apply standard security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    res.setHeader(key, value);
  }

  // Method check
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Dual Rate Limiting (per-IP and global instance cap)
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string' ? (forwarded.split(',')[0]?.trim() ?? 'unknown') : 'unknown';
  const rateLimitResult = checkRateLimits(ip);
  if (rateLimitResult.isLimited) {
    res.statusCode = 429;
    res.setHeader('Retry-After', '60');
    res.end(JSON.stringify({ error: 'AI usage limit reached. Please try again later.' }));
    return;
  }

  // Parse Body
  let parsedJson: unknown;
  try {
    parsedJson = await parseRequestBody(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
    return;
  }

  // Schema Validation
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

  // Generate Ideas
  try {
    const validated = await generateIdeas(parseResult.data.preferences);
    res.statusCode = 200;
    res.end(JSON.stringify(validated));
  } catch (error) {
    const safeErrorLog = redactApiKey(error);
    console.error('Serverless Gemini generation error:', safeErrorLog);

    const mapped = mapAIError(error);
    res.statusCode = mapped.statusCode;
    if (mapped.headers) {
      for (const [hKey, hVal] of Object.entries(mapped.headers)) {
        res.setHeader(hKey, hVal);
      }
    }
    res.end(JSON.stringify(mapped.body));
  }
}
