import type { IncomingMessage, ServerResponse } from 'http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../../api/ideas';
import * as aiService from '@/services/ai';
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
    process.env = { ...originalEnv };
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

  it('returns 429 when rate limit is exceeded', async () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
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
        expect(res.output).toContain('Too many requests');
      }
    }
  });
});
