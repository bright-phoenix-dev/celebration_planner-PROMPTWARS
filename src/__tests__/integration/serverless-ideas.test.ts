import type { IncomingMessage, ServerResponse } from 'http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../../api/ideas';
import * as aiService from '@/services/ai';
import { resetRateLimits } from '@/lib/serverless';
import { EventEmitter } from 'events';

class MockIncomingMessage extends EventEmitter {
  method = 'POST';
  headers: Record<string, string> = {};
  body: unknown = null;

  constructor(body: unknown = null, headers: Record<string, string> = {}) {
    super();
    this.body = body;
    this.headers = headers;
  }
}

class MockServerResponse {
  statusCode = 200;
  headers: Record<string, string> = {};
  output = '';

  setHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  end(data?: string) {
    if (data) this.output += data;
  }
}

describe('Serverless Handler (/api/ideas)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    resetRateLimits();
    process.env = { ...originalEnv };
  });

  it('sets security headers on all responses', async () => {
    const req = new MockIncomingMessage();
    req.method = 'GET';
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(res.headers['X-Frame-Options']).toBe('DENY');
    expect(res.headers['Cache-Control']).toContain('no-store');
  });

  it('rejects non-POST methods with 405', async () => {
    const req = new MockIncomingMessage();
    req.method = 'GET';
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(405);
    expect(res.output).toContain('Method not allowed');
  });

  it('returns 503 when GEMINI_API_KEY is not set', async () => {
    delete process.env['GEMINI_API_KEY'];
    const req = new MockIncomingMessage({
      preferences: {
        eventType: 'wedding',
        vibe: 'Romantic',
      },
    });
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(503);
    expect(res.output).toContain('AI service is not configured');
  });

  it('returns 400 when payload fails validation', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    const req = new MockIncomingMessage({
      preferences: {
        eventType: 'unsupported-event-type',
      },
    });
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(400);
    expect(res.output).toContain('Invalid request data');
  });

  it('returns 404 with AI model unavailable when model is not found or deprecated', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new Error(
        'models/gemini-2.0-flash is not found for API version v1beta, or is no longer available',
      ),
    );

    const req = new MockIncomingMessage({
      preferences: {
        eventType: 'wedding',
        theme: 'Rustic',
      },
    });
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(404);
    const parsed = JSON.parse(res.output) as { error: string };
    expect(parsed.error).toBe('AI model unavailable');
  });

  it('redacts GEMINI_API_KEY from server console logs when an error occurs', async () => {
    const sensitiveKey = 'AIzaSySecretApiKey1234567890abcdef123';
    process.env['GEMINI_API_KEY'] = sensitiveKey;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new Error(`Failed to call Google with key=${sensitiveKey}`),
    );

    const req = new MockIncomingMessage({
      preferences: {
        eventType: 'birthday',
      },
    });
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(consoleSpy).toHaveBeenCalled();
    const loggedError = consoleSpy.mock.calls[0]?.[1] as string;
    expect(loggedError).toBeDefined();
    expect(loggedError).not.toContain(sensitiveKey);
    expect(loggedError).toContain('[REDACTED]');
  });

  it('returns 401 when Gemini returns unauthorized or invalid key', async () => {
    process.env['GEMINI_API_KEY'] = 'invalid-key';
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new Error('API key not valid. Please pass a valid API key (401)'),
    );

    const req = new MockIncomingMessage({
      preferences: {
        eventType: 'community',
      },
    });
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(401);
    expect(res.output).toContain('Invalid or unauthorized Gemini API key');
  });

  it('returns 502 when AI response cannot be parsed or validated', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new aiService.AIParseError('AI response could not be processed'),
    );

    const req = new MockIncomingMessage({
      preferences: {
        eventType: 'birthday',
      },
    });
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.output)).toEqual({ error: 'AI response could not be processed' });
  });

  it('returns 429 with Retry-After header when Google API returns 429 quota exhaustion', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new Error('Resource has been exhausted (e.g. check quota) (429)'),
    );

    const req = new MockIncomingMessage({
      preferences: {
        eventType: 'wedding',
      },
    });
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBe('60');
    expect(JSON.parse(res.output)).toEqual({
      error: 'AI usage limit reached. Please try again later.',
    });
  });

  it('returns 200 with validated ideas on successful call', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    const mockIdeas = {
      themes: [{ name: 'Test Theme', description: 'Test Desc' }],
      decor: ['Balloons'],
      menu: [{ item: 'Cake' }],
      activities: ['Games'],
      invitations: [{ style: 'Digital', description: 'Email invite' }],
    };
    vi.spyOn(aiService, 'generateIdeas').mockResolvedValueOnce(mockIdeas);

    const req = new MockIncomingMessage({
      preferences: {
        eventType: 'birthday',
      },
    });
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.output)).toEqual(mockIdeas);
  });

  it('handles req.body passed as a JSON string', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    const mockIdeas = {
      themes: [{ name: 'String Theme', description: 'String Desc' }],
      decor: ['Flowers'],
      menu: [{ item: 'Salad' }],
      activities: ['Music'],
      invitations: [{ style: 'Print', description: 'Paper card' }],
    };
    vi.spyOn(aiService, 'generateIdeas').mockResolvedValueOnce(mockIdeas);

    const req = new MockIncomingMessage(
      JSON.stringify({
        preferences: {
          eventType: 'wedding',
        },
      }),
    );
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.output)).toEqual(mockIdeas);
  });

  it('handles req.body passed as a Buffer', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    const mockIdeas = {
      themes: [{ name: 'Buffer Theme', description: 'Buffer Desc' }],
      decor: ['Lights'],
      menu: [{ item: 'Soup' }],
      activities: ['Dancing'],
      invitations: [{ style: 'Card', description: 'Handmade' }],
    };
    vi.spyOn(aiService, 'generateIdeas').mockResolvedValueOnce(mockIdeas);

    const req = new MockIncomingMessage(
      Buffer.from(
        JSON.stringify({
          preferences: {
            eventType: 'community',
          },
        }),
      ),
    );
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.output)).toEqual(mockIdeas);
  });

  it('handles empty body gracefully returning 400 validation error', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    const req = new MockIncomingMessage('');
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(400);
    expect(res.output).toContain('Invalid request data');
  });

  it('handles req.body passed as an invalid JSON string with 400', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    const req = new MockIncomingMessage('{ invalid-json');
    const res = new MockServerResponse();

    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(400);
    expect(res.output).toContain('Invalid JSON payload');
  });

  it('returns 429 when client IP rate limit is exceeded', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    const mockIdeas = {
      themes: [],
      decor: [],
      menu: [],
      activities: [],
      invitations: [],
    };
    vi.spyOn(aiService, 'generateIdeas').mockResolvedValue(mockIdeas);
    const ip = '10.0.0.99';

    for (let i = 0; i < 11; i++) {
      const req = new MockIncomingMessage(
        {
          preferences: { eventType: 'wedding' },
        },
        { 'x-forwarded-for': ip },
      );
      const res = new MockServerResponse();
      await handler(
        req as unknown as IncomingMessage & { body?: unknown },
        res as unknown as ServerResponse,
      );

      if (i === 10) {
        expect(res.statusCode).toBe(429);
        expect(res.headers['Retry-After']).toBe('60');
        expect(res.output).toContain('AI usage limit reached');
      }
    }
  });

  it('returns 429 when global rate limit is exceeded across multiple IPs', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    const mockIdeas = {
      themes: [],
      decor: [],
      menu: [],
      activities: [],
      invitations: [],
    };
    vi.spyOn(aiService, 'generateIdeas').mockResolvedValue(mockIdeas);

    // Send 30 requests from 30 distinct IPs
    for (let i = 0; i < 30; i++) {
      const req = new MockIncomingMessage(
        { preferences: { eventType: 'wedding' } },
        { 'x-forwarded-for': `172.16.0.${i}` },
      );
      const res = new MockServerResponse();
      await handler(
        req as unknown as IncomingMessage & { body?: unknown },
        res as unknown as ServerResponse,
      );
    }

    // 31st request from a new IP hits global instance cap
    const req = new MockIncomingMessage(
      { preferences: { eventType: 'wedding' } },
      { 'x-forwarded-for': '172.16.0.254' },
    );
    const res = new MockServerResponse();
    await handler(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
    );

    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBe('60');
    expect(res.output).toContain('AI usage limit reached');
  });
});
