import { z } from 'zod';

/**
 * Budget category names that apply across all event types.
 */
export const BudgetCategoryNameSchema = z.enum([
  'venue',
  'catering',
  'decor',
  'entertainment',
  'attire',
  'photography',
  'misc',
]);

/**
 * Human-readable labels for budget categories.
 */
export const BUDGET_CATEGORY_LABELS: Record<z.infer<typeof BudgetCategoryNameSchema>, string> = {
  venue: 'Venue',
  catering: 'Catering',
  decor: 'Decorations',
  entertainment: 'Entertainment',
  attire: 'Attire',
  photography: 'Photography',
  misc: 'Miscellaneous',
};

/**
 * Schema for a single budget category with planned and actual amounts.
 */
export const BudgetCategorySchema = z.object({
  category: BudgetCategoryNameSchema,
  plannedAmount: z.number().min(0, 'Planned amount cannot be negative'),
  actualAmount: z.number().min(0, 'Actual amount cannot be negative'),
  notes: z.string().max(500, 'Notes must be 500 characters or fewer').optional(),
});

/**
 * Schema for the complete budget allocation for an event.
 */
export const BudgetAllocationSchema = z.object({
  eventId: z.string().uuid(),
  totalBudget: z.number().min(0),
  categories: z.array(BudgetCategorySchema).min(1),
});
