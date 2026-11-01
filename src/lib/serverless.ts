import type { IncomingMessage } from 'http';
import { AIParseError } from '../services/ai.js';

/**
 * Strips sensitive API keys from strings or Error stack traces.
 *
 * @param error - Error object, string, or unknown value to sanitize.
 * @returns Sanitized error message string with API keys replaced by [REDACTED].
 */
export function redactApiKey(error: unknown): string {
  const msg = error instanceof Error ? (error.stack ?? error.message) : String(error);
  const apiKey = process.env['GEMINI_API_KEY'];
  let sanitized = msg;
  if (apiKey) {
    sanitized = sanitized.replaceAll(apiKey, '[REDACTED]');
  }
  return sanitized.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]');
}

/**
 * Standard HTTP security headers applied to all serverless API responses.
 *
 * @returns Key-value map of security headers.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
  };
}

/**
 * Parses the incoming HTTP request body across Vercel serverless, Node streams, and unit test environments.
 *
 * Supports pre-parsed objects, JSON strings, Buffers, and raw readable streams.
 *
 * @param req - Incoming HTTP request with optional pre-parsed body property.
 * @returns Parsed JSON object or primitive.
 * @throws SyntaxError if JSON payload is malformed.
 */
export async function parseRequestBody(
  req: IncomingMessage & { body?: unknown },
): Promise<unknown> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      const trimmed = req.body.trim();
      return trimmed ? JSON.parse(trimmed) : {};
    }
    if (Buffer.isBuffer(req.body)) {
      const str = req.body.toString('utf-8').trim();
      return str ? JSON.parse(str) : {};
    }
    if (typeof req.body === 'object') {
      return req.body;
    }
    return {};
  }

  let rawBody = '';
  for await (const chunk of req) {
    rawBody += typeof chunk === 'string' ? chunk : String(chunk);
  }
  const trimmed = rawBody.trim();
  return trimmed ? JSON.parse(trimmed) : {};
}

/**
 * Result structure returned by mapAIError.
 */
export interface MappedAIError {
  statusCode: number;
  body: { error: string };
  headers?: Record<string, string>;
}

/**
 * Translates underlying Google Gemini / Generative AI errors into safe, clean HTTP responses.
 * Never exposes raw Google error messages, stack traces, or credentials to client callers.
 *
 * @param error - The caught error from the AI generation service.
 * @returns Status code, user-friendly error message, and optional response headers.
 */
export function mapAIError(error: unknown): MappedAIError {
  const msg = error instanceof Error ? error.message : String(error);
  const lowerMsg = msg.toLowerCase();

  // Resource exhausted / rate limit from Google API
  if (
    msg.includes('429') ||
    lowerMsg.includes('resource exhausted') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('rate limit')
  ) {
    return {
      statusCode: 429,
      body: { error: 'AI usage limit reached. Please try again later.' },
      headers: { 'Retry-After': '60' },
    };
  }

  // Parse failure / invalid schema output from model
  if (
    error instanceof AIParseError ||
    msg.includes('AI response could not be processed') ||
    msg.includes('AI returned invalid JSON')
  ) {
    return {
      statusCode: 502,
      body: { error: 'AI response could not be processed' },
    };
  }

  // Model unavailable or deprecated
  if (
    msg.includes('404') ||
    lowerMsg.includes('not found') ||
    lowerMsg.includes('is not available') ||
    lowerMsg.includes('no longer available') ||
    lowerMsg.includes('not supported')
  ) {
    return {
      statusCode: 404,
      body: { error: 'AI model unavailable' },
    };
  }

  // Invalid or unauthorized API key
  if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
    return {
      statusCode: 401,
      body: { error: 'Invalid or unauthorized Gemini API key' },
    };
  }

  // Unconfigured environment
  if (msg.includes('GEMINI_API_KEY is not configured')) {
    return {
      statusCode: 503,
      body: { error: 'AI service is not configured' },
    };
  }

  // High demand / upstream transient unavailability
  if (
    msg.includes('503') ||
    lowerMsg.includes('high demand') ||
    lowerMsg.includes('temporarily unavailable')
  ) {
    return {
      statusCode: 503,
      body: { error: 'AI service is experiencing high demand. Please try again shortly.' },
    };
  }

  // Fallback generic 500
  return {
    statusCode: 500,
    body: { error: 'Failed to generate ideas. Please try again.' },
  };
}

/**
 * Sliding-window rate limiter holding timestamps in memory.
 *
 * NOTE: In serverless execution environments (e.g. Vercel Serverless Functions),
 * in-memory limits are enforced per active execution instance and reset when instances
 * cold-start or scale down.
 */
const ipLimiterMap = new Map<string, number[]>();
const globalTimestamps: number[] = [];

const RATE_LIMIT_WINDOW_MS = 60_000;
const IP_RATE_LIMIT_MAX = parseInt(process.env['RATE_LIMIT_MAX'] ?? '10', 10);
const GLOBAL_RATE_LIMIT_MAX = parseInt(process.env['RATE_LIMIT_GLOBAL_MAX'] ?? '30', 10);

/**
 * Checks whether an incoming request violates per-IP or global instance rate limits.
 *
 * @param ip - Client IP address string.
 * @returns Rate limit status and failure reason if blocked.
 */
export function checkRateLimits(ip: string): { isLimited: boolean; reason?: 'ip' | 'global' } {
  const now = Date.now();

  // 1. Global rate limit check
  const recentGlobal = globalTimestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recentGlobal.length >= GLOBAL_RATE_LIMIT_MAX) {
    return { isLimited: true, reason: 'global' };
  }

  // 2. Per-IP rate limit check
  const ipTimestamps = ipLimiterMap.get(ip) ?? [];
  const recentIp = ipTimestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recentIp.length >= IP_RATE_LIMIT_MAX) {
    return { isLimited: true, reason: 'ip' };
  }

  // Update windows
  recentGlobal.push(now);
  globalTimestamps.length = 0;
  globalTimestamps.push(...recentGlobal);

  recentIp.push(now);
  ipLimiterMap.set(ip, recentIp);

  return { isLimited: false };
}

/**
 * Clears rate limiter cache (primarily for unit test isolation).
 */
export function resetRateLimits(): void {
  ipLimiterMap.clear();
  globalTimestamps.length = 0;
}
