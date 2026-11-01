import { z } from 'zod';

/**
 * Supported event types for the celebration planner.
 */
export const EventTypeSchema = z.enum(['wedding', 'birthday', 'community']);

/**
 * Human-readable labels for event types.
 */
export const EVENT_TYPE_LABELS: Record<z.infer<typeof EventTypeSchema>, string> = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  community: 'Community Event',
};

/**
 * Schema for creating a new event (before ID/timestamps are assigned).
 */
export const CreateEventSchema = z.object({
  type: EventTypeSchema,
  name: z
    .string()
    .min(1, 'Event name is required')
    .max(100, 'Event name must be 100 characters or fewer'),
  date: z.string().datetime({ message: 'A valid event date is required' }),
  guestCount: z
    .number()
    .int('Guest count must be a whole number')
    .min(1, 'At least 1 guest is required')
    .max(10_000, 'Guest count cannot exceed 10,000'),
  totalBudget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .max(100_000_000, 'Budget cannot exceed 100,000,000'),
});

/**
 * Full event schema including system-generated fields.
 */
export const EventSchema = CreateEventSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
