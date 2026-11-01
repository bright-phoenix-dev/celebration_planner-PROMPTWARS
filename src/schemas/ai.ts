import { z } from 'zod';
import { EventTypeSchema } from './event.js';

/**
 * Schema for AI idea generation preferences submitted by the user.
 */
export const AIPreferencesSchema = z.object({
  eventType: EventTypeSchema,
  theme: z.string().max(200, 'Theme must be 200 characters or fewer').optional(),
  cultureTradition: z
    .string()
    .max(300, 'Culture/tradition must be 300 characters or fewer')
    .optional(),
  dietaryNeeds: z.string().max(300, 'Dietary needs must be 300 characters or fewer').optional(),
  venueType: z.string().max(200, 'Venue type must be 200 characters or fewer').optional(),
  vibe: z.string().max(200, 'Vibe must be 200 characters or fewer').optional(),
  budget: z.number().min(0, 'Budget cannot be negative').optional(),
  guestCount: z.number().int().min(1).optional(),
});

/**
 * Schema for a single theme idea returned by the AI.
 */
export const AIThemeIdeaSchema = z.object({
  name: z.string().max(200),
  description: z.string().max(500),
});

/**
 * Schema for a single menu item idea returned by the AI.
 */
export const AIMenuItemSchema = z.object({
  item: z.string().max(200),
  note: z.string().max(300).optional(),
});

/**
 * Schema for a single invitation idea returned by the AI.
 */
export const AIInvitationIdeaSchema = z.object({
  style: z.string().max(200),
  description: z.string().max(500),
});

/**
 * Schema for the complete AI ideas response.
 * All arrays are capped for token efficiency and UI consistency.
 */
export const AIIdeasResponseSchema = z.object({
  themes: z.array(AIThemeIdeaSchema).max(5),
  decor: z.array(z.string().max(300)).max(8),
  menu: z.array(AIMenuItemSchema).max(10),
  activities: z.array(z.string().max(300)).max(8),
  invitations: z.array(AIInvitationIdeaSchema).max(5),
});

/**
 * Schema for the API request body sent to /api/ai/ideas.
 */
export const AIRequestSchema = z.object({
  preferences: AIPreferencesSchema,
});
