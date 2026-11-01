import { test, expect } from '@playwright/test';

test.describe('Real Serverless API Route (/api/ai/ideas) in Production Preview', () => {
  test('rejects GET requests with 405 Method Not Allowed', async ({ request }) => {
    const res = await request.get('/api/ai/ideas');
    expect(res.status()).toBe(405);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe('Method not allowed');
  });

  test('returns 400 when body fails Zod schema validation', async ({ request }) => {
    const res = await request.post('/api/ai/ideas', {
      data: { preferences: { eventType: 'invalid-type' } },
    });
    expect(res.status()).toBe(400);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe('Invalid request data');
  });

  test('returns 503 when GEMINI_API_KEY is not configured', async ({ request }) => {
    const res = await request.post('/api/ai/ideas', {
      data: { preferences: { eventType: 'wedding', vibe: 'Romantic' } },
    });
    // In our test preview environment where GEMINI_API_KEY is unset, it must return 503
    expect(res.status()).toBe(503);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe('AI service is not configured');
  });

  test('enforces rate limiting (429) after excessive requests', async ({ request }) => {
    let lastStatus = 200;
    for (let i = 0; i < 12; i++) {
      const res = await request.post('/api/ai/ideas', {
        data: { preferences: { eventType: 'birthday' } },
      });
      lastStatus = res.status();
      if (lastStatus === 429) {
        const data = (await res.json()) as { error?: string };
        expect(data.error).toContain('Too many requests');
        break;
      }
    }
    expect(lastStatus).toBe(429);
  });
});
