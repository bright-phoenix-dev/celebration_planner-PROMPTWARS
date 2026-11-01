import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import { AIIdeasResponseSchema } from '../schemas/ai';
import { getGeminiModel } from '../lib/constants';
import type { AIPreferences, AIIdeasResponse } from '../types';

/**
 * Custom error thrown when the AI output cannot be parsed or validated.
 */
export class AIParseError extends Error {
  constructor(message = 'AI response could not be processed') {
    super(message);
    this.name = 'AIParseError';
  }
}

/**
 * Strips markdown code fences (```json ... ```) and extracts content within the outermost { ... }.
 */
export function extractJsonString(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*\r?\n?/i, '');
  cleaned = cleaned.replace(/\r?\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  // Extract text within outermost curly braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

/**
 * Response schema conforming to Google Generative AI SchemaType.
 */
export const aiIdeasGeminiResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    themes: {
      type: SchemaType.ARRAY,
      description: 'Up to 5 celebration theme ideas',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: 'Theme title' },
          description: { type: SchemaType.STRING, description: 'Theme description' },
        },
        required: ['name', 'description'],
      },
    },
    decor: {
      type: SchemaType.ARRAY,
      description: 'Up to 8 decor concept ideas',
      items: {
        type: SchemaType.STRING,
      },
    },
    menu: {
      type: SchemaType.ARRAY,
      description: 'Up to 10 catering and menu ideas',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: { type: SchemaType.STRING, description: 'Food or drink item name' },
          note: {
            type: SchemaType.STRING,
            description: 'Optional dietary note or presentation tip',
          },
        },
        required: ['item'],
      },
    },
    activities: {
      type: SchemaType.ARRAY,
      description: 'Up to 8 interactive activity and entertainment ideas',
      items: {
        type: SchemaType.STRING,
      },
    },
    invitations: {
      type: SchemaType.ARRAY,
      description: 'Up to 5 invitation wording and design style concepts',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          style: { type: SchemaType.STRING, description: 'Invitation format or design style' },
          description: {
            type: SchemaType.STRING,
            description: 'Sample wording or layout description',
          },
        },
        required: ['style', 'description'],
      },
    },
  },
  required: ['themes', 'decor', 'menu', 'activities', 'invitations'],
};

/**
 * Logs AI failure details server-side without leaking the API key or full user prompt.
 */
export function logAIFailure(params: { rawText?: string; finishReason?: string; error: unknown }) {
  const text = params.rawText ?? '';
  const length = text.length;
  const finishReason = params.finishReason ?? 'UNKNOWN';
  const preview = text.slice(0, 300);
  const errMsg = params.error instanceof Error ? params.error.message : String(params.error);

  console.error(
    `[AI Generation Failure] Error: ${errMsg} | Response length: ${length} | finishReason: ${finishReason} | First 300 chars: ${JSON.stringify(preview)}`,
  );
}

/**
 * Builds the system prompt for the AI idea generator.
 * Kept separate from user content to defend against prompt injection.
 */
function buildSystemPrompt(): string {
  return `You are a professional celebration and event planning assistant. Your job is to generate creative, practical, and personalized ideas for events.

RULES:
- Only respond with valid JSON matching the exact schema requested.
- Do not include any text before or after the JSON.
- Keep suggestions practical and budget-appropriate.
- Respect cultural traditions and dietary requirements when specified.
- Suggestions should be diverse and creative.
- Never include harmful, offensive, or inappropriate content.
- Do not include any executable code, scripts, or HTML in your responses.`;
}

/**
 * Builds the user prompt with preferences injected as data.
 */
function buildUserPrompt(preferences: AIPreferences): string {
  const parts: string[] = [
    'Generate celebration ideas for the following event:',
    `Event Type: ${preferences.eventType}`,
  ];

  if (preferences.theme) parts.push(`Theme Preference: ${preferences.theme}`);
  if (preferences.cultureTradition)
    parts.push(`Cultural/Traditional Elements: ${preferences.cultureTradition}`);
  if (preferences.dietaryNeeds) parts.push(`Dietary Needs: ${preferences.dietaryNeeds}`);
  if (preferences.venueType) parts.push(`Venue Type: ${preferences.venueType}`);
  if (preferences.vibe) parts.push(`Desired Vibe: ${preferences.vibe}`);
  if (preferences.budget !== undefined) parts.push(`Budget: $${String(preferences.budget)}`);
  if (preferences.guestCount !== undefined)
    parts.push(`Guest Count: ${String(preferences.guestCount)}`);

  parts.push('');
  parts.push('Respond with a JSON object with these exact keys:');
  parts.push('- "themes": array of up to 5 objects with "name" and "description" keys');
  parts.push('- "decor": array of up to 8 decoration idea strings');
  parts.push('- "menu": array of up to 10 objects with "item" key and optional "note" key');
  parts.push('- "activities": array of up to 8 activity/entertainment strings');
  parts.push('- "invitations": array of up to 5 objects with "style" and "description" keys');
  parts.push('');
  parts.push('Return ONLY the JSON object, no other text.');

  return parts.join('\n');
}

/** In-memory LRU cache for AI responses. */
const responseCache = new Map<string, AIIdeasResponse>();
const MAX_CACHE_SIZE = 50;

/**
 * Generates celebration ideas using the Google Gemini API.
 * Validates the response against the expected schema before returning.
 * Automatically retries once on parse failure.
 *
 * @param preferences - User's event preferences
 * @returns Validated AI-generated ideas
 * @throws AIParseError if parsing/validation fails after retry
 * @throws Error if the API key is missing or the network request fails
 */
export async function generateIdeas(preferences: AIPreferences): Promise<AIIdeasResponse> {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Check cache
  const cacheKey = JSON.stringify(preferences, Object.keys(preferences).sort());
  const cached = responseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const thinkingBudget =
    process.env['GEMINI_THINKING_BUDGET'] !== undefined
      ? parseInt(process.env['GEMINI_THINKING_BUDGET'], 10)
      : 0;

  const model = genAI.getGenerativeModel({
    model: getGeminiModel(),
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: aiIdeasGeminiResponseSchema,
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(thinkingBudget >= 0 ? { thinkingConfig: { thinkingBudget } } : {}),
    },
  });

  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await model.generateContent({
        systemInstruction: buildSystemPrompt(),
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(preferences) }] }],
      });

      const candidate = result.response.candidates?.[0];
      const finishReason = candidate?.finishReason;
      const rawText = result.response.text();

      // Clean fences or text outside outermost braces
      const cleaned = extractJsonString(rawText);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        logAIFailure({ rawText, finishReason, error: parseErr });
        throw new AIParseError('AI response could not be processed');
      }

      const validated = AIIdeasResponseSchema.safeParse(parsed);
      if (!validated.success) {
        logAIFailure({ rawText, finishReason, error: validated.error });
        throw new AIParseError('AI response could not be processed');
      }

      // Cache the result (LRU eviction)
      if (responseCache.size >= MAX_CACHE_SIZE) {
        const firstKey = responseCache.keys().next();
        if (!firstKey.done) {
          responseCache.delete(firstKey.value);
        }
      }
      responseCache.set(cacheKey, validated.data);

      return validated.data;
    } catch (err) {
      lastError = err;
      if (err instanceof AIParseError && attempt < maxAttempts) {
        // Retry once on parse failure
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
