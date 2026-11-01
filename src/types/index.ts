/**
 * Inferred TypeScript types from Zod schemas.
 * These types are the single source of truth for the application.
 */
import type { z } from 'zod';
import type {
  EventTypeSchema,
  CreateEventSchema,
  EventSchema,
  BudgetCategoryNameSchema,
  BudgetCategorySchema,
  BudgetAllocationSchema,
  TimelinePhaseSchema,
  TimelineTaskSchema,
  VendorStatusSchema,
  VendorSchema,
  AIPreferencesSchema,
  AIIdeasResponseSchema,
} from '@/schemas';

/** Supported event types: 'wedding' | 'birthday' | 'community' */
export type EventType = z.infer<typeof EventTypeSchema>;

/** Data required to create a new event. */
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

/** A fully-formed event with ID and timestamps. */
export type CelebrationEvent = z.infer<typeof EventSchema>;

/** Budget category identifier. */
export type BudgetCategoryName = z.infer<typeof BudgetCategoryNameSchema>;

/** A single budget category with planned and actual amounts. */
export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

/** Complete budget allocation for an event. */
export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;

/** Timeline phase identifier. */
export type TimelinePhase = z.infer<typeof TimelinePhaseSchema>;

/** A single task in the event timeline. */
export type TimelineTask = z.infer<typeof TimelineTaskSchema>;

/** Vendor engagement status. */
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

/** A single vendor in the checklist. */
export type Vendor = z.infer<typeof VendorSchema>;

/** User preferences for AI idea generation. */
export type AIPreferences = z.infer<typeof AIPreferencesSchema>;

/** Complete AI-generated ideas response. */
export type AIIdeasResponse = z.infer<typeof AIIdeasResponseSchema>;

/** Budget status summary for display. */
export interface BudgetStatus {
  totalBudget: number;
  totalPlanned: number;
  totalSpent: number;
  remaining: number;
  isOverBudget: boolean;
  warnings: BudgetWarning[];
}

/** A warning about budget issues. */
export interface BudgetWarning {
  category: BudgetCategoryName;
  message: string;
  severity: 'info' | 'warning' | 'error';
}
