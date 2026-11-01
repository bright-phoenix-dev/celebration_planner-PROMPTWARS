import { describe, it, expect, beforeEach } from 'vitest';
import type { IncomingMessage } from 'http';
import {
  redactApiKey,
  getSecurityHeaders,
  parseRequestBody,
  mapAIError,
  checkRateLimits,
  resetRateLimits,
} from '@/lib/serverless';
import { AIParseError } from '@/services/ai';
import { Readable } from 'stream';

type MockRequest = IncomingMessage & { body?: unknown };

describe('Serverless Utilities (src/lib/serverless.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetRateLimits();
    process.env = { ...originalEnv };
  });

  describe('redactApiKey', () => {
    it('redacts process.env.GEMINI_API_KEY when present in string', () => {
      process.env['GEMINI_API_KEY'] = 'test-secret-key-12345';
      const msg = 'Connection failed with key test-secret-key-12345 in URL';
      expect(redactApiKey(msg)).toBe('Connection failed with key [REDACTED] in URL');
    });

    it('redacts Google AIza pattern keys even if GEMINI_API_KEY is not set', () => {
      delete process.env['GEMINI_API_KEY'];
      const msg =
        'Error from https://generativelanguage.googleapis.com?key=AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q';
      expect(redactApiKey(msg)).not.toContain('AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q');
      expect(redactApiKey(msg)).toContain('[REDACTED]');
    });

    it('handles Error objects and stack traces', () => {
      process.env['GEMINI_API_KEY'] = 'test-key-999';
      const error = new Error('Database error test-key-999');
      expect(redactApiKey(error)).toContain('[REDACTED]');
      expect(redactApiKey(error)).not.toContain('test-key-999');
    });
  });

  describe('getSecurityHeaders', () => {
    it('returns required HTTP security headers', () => {
      const headers = getSecurityHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['Cache-Control']).toContain('no-store');
      expect(headers['Pragma']).toBe('no-cache');
    });
  });

  describe('parseRequestBody', () => {
    it('returns parsed object when req.body is already a JavaScript object', async () => {
      const req = { body: { preferences: { eventType: 'wedding' } } } as unknown as MockRequest;
      const parsed = await parseRequestBody(req);
      expect(parsed).toEqual({ preferences: { eventType: 'wedding' } });
    });

    it('parses JSON string from req.body', async () => {
      const req = {
        body: JSON.stringify({ preferences: { eventType: 'birthday' } }),
      } as unknown as MockRequest;
      const parsed = await parseRequestBody(req);
      expect(parsed).toEqual({ preferences: { eventType: 'birthday' } });
    });

    it('parses Buffer from req.body', async () => {
      const req = {
        body: Buffer.from(JSON.stringify({ preferences: { eventType: 'community' } })),
      } as unknown as MockRequest;
      const parsed = await parseRequestBody(req);
      expect(parsed).toEqual({ preferences: { eventType: 'community' } });
    });

    it('handles empty or whitespace string in req.body gracefully', async () => {
      const req = { body: '   ' } as unknown as MockRequest;
      const parsed = await parseRequestBody(req);
      expect(parsed).toEqual({});
    });

    it('parses body from readable stream chunks when req.body is absent', async () => {
      const readable = Readable.from([
        Buffer.from('{"preferences":'),
        Buffer.from('{"eventType":"wedding"}}'),
      ]) as unknown as MockRequest;
      const parsed = await parseRequestBody(readable);
      expect(parsed).toEqual({ preferences: { eventType: 'wedding' } });
    });

    it('throws SyntaxError for invalid JSON payload', async () => {
      const req = { body: '{ malformed json' } as unknown as MockRequest;
      await expect(parseRequestBody(req)).rejects.toThrow();
    });
  });

  describe('mapAIError', () => {
    it('maps 429 and rate limit errors to 429 with Retry-After header', () => {
      const err = new Error('Resource has been exhausted (e.g. check quota) (429)');
      const mapped = mapAIError(err);
      expect(mapped.statusCode).toBe(429);
      expect(mapped.body.error).toBe('AI usage limit reached. Please try again later.');
      expect(mapped.headers?.['Retry-After']).toBe('60');
    });

    it('maps AIParseError to 502', () => {
      const err = new AIParseError('AI returned invalid JSON');
      const mapped = mapAIError(err);
      expect(mapped.statusCode).toBe(502);
      expect(mapped.body.error).toBe('AI response could not be processed');
    });

    it('maps 404 / model not found to 404', () => {
      const err = new Error('models/gemini-2.0-flash is not found or is no longer available');
      const mapped = mapAIError(err);
      expect(mapped.statusCode).toBe(404);
      expect(mapped.body.error).toBe('AI model unavailable');
    });

    it('maps 401 / 403 API key error to 401', () => {
      const err = new Error('API key not valid. Please pass a valid API key (401)');
      const mapped = mapAIError(err);
      expect(mapped.statusCode).toBe(401);
      expect(mapped.body.error).toBe('Invalid or unauthorized Gemini API key');
    });

    it('maps 503 high demand to 503 with friendly message', () => {
      const err = new Error('The model is overloaded due to high demand (503)');
      const mapped = mapAIError(err);
      expect(mapped.statusCode).toBe(503);
      expect(mapped.body.error).toContain('high demand');
    });

    it('maps unconfigured key error to 503', () => {
      const err = new Error('GEMINI_API_KEY is not configured');
      const mapped = mapAIError(err);
      expect(mapped.statusCode).toBe(503);
      expect(mapped.body.error).toBe('AI service is not configured');
    });

    it('falls back to generic 500 without leaking error details', () => {
      const err = new Error('Internal network error with sensitive context');
      const mapped = mapAIError(err);
      expect(mapped.statusCode).toBe(500);
      expect(mapped.body.error).toBe('Failed to generate ideas. Please try again.');
    });
  });

  describe('checkRateLimits', () => {
    it('allows requests within threshold and tracks per IP', () => {
      const ip = '192.168.1.1';
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimits(ip);
        expect(result.isLimited).toBe(false);
      }
      // 11th request from same IP exceeds default IP limit of 10
      const blocked = checkRateLimits(ip);
      expect(blocked.isLimited).toBe(true);
      expect(blocked.reason).toBe('ip');
    });

    it('enforces global limit across multiple IPs', () => {
      // Default global limit is 30
      for (let i = 0; i < 30; i++) {
        const result = checkRateLimits(`10.0.0.${i}`);
        expect(result.isLimited).toBe(false);
      }
      // 31st request from a new IP hits global cap
      const blocked = checkRateLimits('10.0.0.99');
      expect(blocked.isLimited).toBe(true);
      expect(blocked.reason).toBe('global');
    });
  });
});
