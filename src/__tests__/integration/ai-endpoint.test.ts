import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/ideas/route';
import * as aiService from '@/services/ai';

describe('AI Ideas API Endpoint Integration (/api/ai/ideas)', () => {
  const validPreferences = {
    eventType: 'wedding',
    theme: 'Vintage Rustic',
    vibe: 'Cozy & intimate',
    budget: 20000,
    guestCount: 80,
  };

  const createRequest = (body: unknown, ip = '127.0.0.1') => {
    return new NextRequest('http://localhost:3000/api/ai/ideas', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 and structured ideas when given valid preferences', async () => {
    const mockIdeas = {
      themes: [{ name: 'Rustic Charm', description: 'Wood & candlelight' }],
      decor: ['Mason jar lights', 'Wildflowers'],
      menu: [{ item: 'Roast Chicken with Herbs', note: 'Organic' }],
      activities: ['Acoustic live guitarist'],
      invitations: [{ style: 'Handmade deckle edge', description: 'Calligraphy style' }],
    };

    vi.spyOn(aiService, 'generateIdeas').mockResolvedValueOnce(mockIdeas);

    const req = createRequest({ preferences: validPreferences });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      themes: { name: string }[];
      decor: string[];
    };
    expect(data.themes[0]?.name).toBe('Rustic Charm');
    expect(data.decor.length).toBe(2);
  });

  it('returns 400 when request body fails Zod schema validation', async () => {
    const invalidReq = createRequest({
      preferences: {
        eventType: 'invalid-event-type', // not wedding/birthday/community
      },
    });

    const res = await POST(invalidReq);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe('Invalid request data');
  });

  it('returns 404 with AI model unavailable when model returns 404 or not found', async () => {
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new Error('models/gemini-2.0-flash is not found or is no longer available (404)'),
    );

    const req = createRequest({ preferences: validPreferences });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe('AI model unavailable');
  });

  it('returns 502 when AI response cannot be parsed or validated', async () => {
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new aiService.AIParseError('AI response could not be processed'),
    );

    const req = createRequest({ preferences: validPreferences });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe('AI response could not be processed');
  });

  it('handles LLM error or malformed response gracefully without leaking secrets', async () => {
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new Error('AI response did not match expected format'),
    );

    const req = createRequest({ preferences: validPreferences });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const data = (await res.json()) as { error?: string; stack?: string };
    expect(data.error).toBe('Failed to generate ideas. Please try again.');
    // Must not leak stack trace
    expect(data.stack).toBeUndefined();
  });

  it('returns 503 when GEMINI_API_KEY is missing', async () => {
    vi.spyOn(aiService, 'generateIdeas').mockRejectedValueOnce(
      new Error('GEMINI_API_KEY is not configured'),
    );

    const req = createRequest({ preferences: validPreferences });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe('AI service is not configured');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const ip = '192.168.1.105';
    vi.spyOn(aiService, 'generateIdeas').mockResolvedValue({
      themes: [],
      decor: [],
      menu: [],
      activities: [],
      invitations: [],
    });

    // Send 11 requests from same IP (default RATE_LIMIT_MAX is 10)
    let lastRes;
    for (let i = 0; i < 12; i++) {
      const req = createRequest({ preferences: validPreferences }, ip);
      lastRes = await POST(req);
    }

    expect(lastRes?.status).toBe(429);
    const data = (await lastRes?.json()) as { error?: string } | undefined;
    expect(data?.error).toContain('Too many requests');
  });
});
