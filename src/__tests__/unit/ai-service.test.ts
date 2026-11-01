import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateIdeas, extractJsonString, AIParseError } from '@/services/ai';
import { DEFAULT_GEMINI_MODEL, getGeminiModel } from '@/lib/constants';
import type { AIPreferences } from '@/types';

const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

vi.mock('@google/generative-ai', () => ({
  SchemaType: {
    STRING: 'string',
    NUMBER: 'number',
    INTEGER: 'integer',
    BOOLEAN: 'boolean',
    ARRAY: 'array',
    OBJECT: 'object',
  },
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('AI Service (src/services/ai.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' };
    delete process.env['GEMINI_MODEL'];
    delete process.env['GEMINI_THINKING_BUDGET'];
  });

  const validPrefs: AIPreferences = {
    eventType: 'wedding',
    theme: 'Bohemian Garden',
    cultureTradition: 'Outdoor ceremony',
    dietaryNeeds: 'Vegan options',
    venueType: 'Botanical Garden',
    vibe: 'Romantic & relaxed',
    budget: 35000,
    guestCount: 120,
  };

  const sampleIdeas = {
    themes: [{ name: 'Boho Garden', description: 'Wildflower florals' }],
    decor: ['Hanging macrame', 'Fairy light canopies'],
    menu: [{ item: 'Wild mushroom risotto', note: 'Vegan' }],
    activities: ['Acoustic guitar duo'],
    invitations: [{ style: 'Pressed flower card', description: 'Botanical paper' }],
  };

  it('throws error when GEMINI_API_KEY is not configured', async () => {
    delete process.env['GEMINI_API_KEY'];
    await expect(generateIdeas({ eventType: 'wedding' })).rejects.toThrow(
      'GEMINI_API_KEY is not configured',
    );
  });

  it('calls Gemini model with default gemini-3.1-flash-lite, responseSchema, and returns validated ideas', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(sampleIdeas),
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await generateIdeas(validPrefs);
    expect(result.themes[0]?.name).toBe('Boho Garden');
    expect(result.decor.length).toBe(2);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Verify model requested is DEFAULT_GEMINI_MODEL ('gemini-3.1-flash-lite')
    const modelCallArgs = mockGetGenerativeModel.mock.calls[0]?.[0] as {
      model: string;
      generationConfig: { responseMimeType: string; maxOutputTokens: number };
    };
    expect(modelCallArgs.model).toBe(DEFAULT_GEMINI_MODEL);
    expect(modelCallArgs.generationConfig.responseMimeType).toBe('application/json');
    expect(modelCallArgs.generationConfig.maxOutputTokens).toBe(8192);
    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-3.1-flash-lite');

    // Calling again with the same preferences uses the LRU cache
    const cachedResult = await generateIdeas(validPrefs);
    expect(cachedResult).toEqual(result);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('regression test: uses configured GEMINI_MODEL when provided in environment', async () => {
    process.env['GEMINI_MODEL'] = 'gemini-custom-enterprise';

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(sampleIdeas),
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const prefs: AIPreferences = {
      eventType: 'birthday',
      theme: 'Configured Model Test',
    };

    await generateIdeas(prefs);

    expect(getGeminiModel()).toBe('gemini-custom-enterprise');
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-custom-enterprise',
      }),
    );
  });

  it('regression test: successfully parses and validates valid JSON', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(sampleIdeas),
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await generateIdeas({ eventType: 'community', theme: 'Valid JSON Test' });
    expect(result.themes[0]?.name).toBe('Boho Garden');
    expect(result.menu[0]?.item).toBe('Wild mushroom risotto');
  });

  it('regression test: successfully parses fenced JSON with markdown code blocks', async () => {
    const fencedOutput = `\`\`\`json\n${JSON.stringify(sampleIdeas, null, 2)}\n\`\`\``;

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => fencedOutput,
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await generateIdeas({ eventType: 'wedding', theme: 'Fenced JSON Test' });
    expect(result.themes[0]?.name).toBe('Boho Garden');
    expect(result.decor).toContain('Hanging macrame');
  });

  it('regression test: successfully parses JSON with text before the JSON', async () => {
    const preambleOutput = `Certainly! Here are some creative ideas for your event:\n\n${JSON.stringify(sampleIdeas)}\n\nHope this helps!`;

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => preambleOutput,
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await generateIdeas({ eventType: 'birthday', theme: 'Preamble JSON Test' });
    expect(result.themes[0]?.name).toBe('Boho Garden');
    expect(result.activities[0]).toBe('Acoustic guitar duo');
  });

  it('regression test: handles truncated JSON, logs server failure info, retries once, and throws AIParseError', async () => {
    const truncatedOutput = '{"themes": [{"name": "Incomplete Theme", "desc';
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Both attempt 1 and attempt 2 return truncated JSON
    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () => truncatedOutput,
          candidates: [{ finishReason: 'MAX_TOKENS' }],
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () => truncatedOutput,
          candidates: [{ finishReason: 'MAX_TOKENS' }],
        },
      });

    await expect(
      generateIdeas({ eventType: 'community', theme: 'Truncated JSON Test' }),
    ).rejects.toThrow(AIParseError);

    // Verified that it retried (2 calls made)
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);

    // Verified server-side error logging
    expect(consoleSpy).toHaveBeenCalled();
    const loggedMessage = consoleSpy.mock.calls[0]?.[0] as string;
    expect(loggedMessage).toContain('[AI Generation Failure]');
    expect(loggedMessage).toContain('Response length:');
    expect(loggedMessage).toContain('finishReason: MAX_TOKENS');
    expect(loggedMessage).toContain('First 300 chars:');
    // Must never leak secrets in the log
    expect(loggedMessage).not.toContain('test-api-key');
  });

  it('regression test: retries on first parse failure and succeeds if second attempt returns valid JSON', async () => {
    // Attempt 1: malformed
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Malformed text that cannot be parsed',
        candidates: [{ finishReason: 'STOP' }],
      },
    });
    // Attempt 2: valid
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(sampleIdeas),
        candidates: [{ finishReason: 'STOP' }],
      },
    });

    const result = await generateIdeas({ eventType: 'wedding', theme: 'Retry Test' });
    expect(result.themes[0]?.name).toBe('Boho Garden');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('extractJsonString utility helper strips fences and isolates outermost braces', () => {
    expect(extractJsonString('{"a": 1}')).toBe('{"a": 1}');
    expect(extractJsonString('```json\n{"b": 2}\n```')).toBe('{"b": 2}');
    expect(extractJsonString('Preamble text\n{"c": 3}\nPostamble text')).toBe('{"c": 3}');
    expect(extractJsonString('```\n{"d": 4}\n```')).toBe('{"d": 4}');
  });
});
