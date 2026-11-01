import { z } from 'zod';

/**
 * Timeline phases representing planning milestones before the event.
 */
export const TimelinePhaseSchema = z.enum([
  '12-months',
  '6-months',
  '3-months',
  '1-month',
  '1-week',
  'day-of',
]);

/**
 * Human-readable labels for timeline phases.
 */
export const TIMELINE_PHASE_LABELS: Record<z.infer<typeof TimelinePhaseSchema>, string> = {
  '12-months': '12 Months Before',
  '6-months': '6 Months Before',
  '3-months': '3 Months Before',
  '1-month': '1 Month Before',
  '1-week': '1 Week Before',
  'day-of': 'Day Of',
};

/**
 * Schema for a single timeline task within a phase.
 */
export const TimelineTaskSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  phase: TimelinePhaseSchema,
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
  dueDate: z.string().datetime(),
  completed: z.boolean(),
  order: z.number().int().min(0),
});
