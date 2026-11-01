import type { EventType, BudgetCategoryName, TimelinePhase } from '../types';

/**
 * Default budget allocation percentages by event type.
 * Each event type maps to a record of category → percentage (0–1).
 * All percentages for a given event type sum to 1.0.
 */
export const BUDGET_PERCENTAGES: Record<EventType, Record<BudgetCategoryName, number>> = {
  wedding: {
    venue: 0.3,
    catering: 0.25,
    decor: 0.15,
    entertainment: 0.1,
    attire: 0.08,
    photography: 0.07,
    misc: 0.05,
  },
  birthday: {
    venue: 0.25,
    catering: 0.3,
    decor: 0.15,
    entertainment: 0.15,
    attire: 0.03,
    photography: 0.07,
    misc: 0.05,
  },
  community: {
    venue: 0.35,
    catering: 0.3,
    decor: 0.1,
    entertainment: 0.1,
    attire: 0.02,
    photography: 0.08,
    misc: 0.05,
  },
};

/**
 * All budget category names in display order.
 */
export const BUDGET_CATEGORIES: readonly BudgetCategoryName[] = [
  'venue',
  'catering',
  'decor',
  'entertainment',
  'attire',
  'photography',
  'misc',
] as const;

/**
 * Guest count threshold above which catering and venue percentages are scaled up.
 */
export const LARGE_GUEST_THRESHOLD = 200;

/**
 * Scaling factor applied to catering and venue for large guest counts.
 * The extra percentage is redistributed proportionally from other categories.
 */
export const LARGE_GUEST_SCALE_FACTOR = 0.05;

/**
 * Phase offsets in days before the event date.
 * Used by the timeline generator to calculate due dates.
 */
export const PHASE_OFFSETS: Record<TimelinePhase, number> = {
  '12-months': 365,
  '6-months': 180,
  '3-months': 90,
  '1-month': 30,
  '1-week': 7,
  'day-of': 0,
};

/**
 * Ordered list of timeline phases from earliest to latest.
 */
export const TIMELINE_PHASES: readonly TimelinePhase[] = [
  '12-months',
  '6-months',
  '3-months',
  '1-month',
  '1-week',
  'day-of',
] as const;

/**
 * Default tasks for each event type, organized by timeline phase.
 */
export const DEFAULT_TIMELINE_TASKS: Record<EventType, Record<TimelinePhase, readonly string[]>> = {
  wedding: {
    '12-months': [
      'Set wedding budget',
      'Create guest list',
      'Research and book venue',
      'Start looking for wedding planner',
      'Choose wedding date',
    ],
    '6-months': [
      'Book photographer and videographer',
      'Choose and order wedding attire',
      'Book caterer and finalize menu',
      'Select and book entertainment (DJ/band)',
      'Send save-the-dates',
    ],
    '3-months': [
      'Order invitations and send them',
      'Book florist and finalize arrangements',
      'Arrange transportation',
      'Plan honeymoon',
      'Schedule hair and makeup trial',
    ],
    '1-month': [
      'Confirm all vendor details',
      'Get marriage license',
      'Final dress fitting',
      'Create seating chart',
      'Prepare wedding day timeline',
    ],
    '1-week': [
      'Confirm final guest count with caterer',
      'Pack for honeymoon',
      'Rehearsal dinner',
      'Prepare tips and payments for vendors',
      'Delegate day-of responsibilities',
    ],
    'day-of': [
      'Arrive at venue early',
      'Distribute boutonnieres and bouquets',
      'Sound check with DJ/band',
      'Enjoy your wedding!',
    ],
  },
  birthday: {
    '12-months': ['Decide on birthday party scale and style', 'Set party budget'],
    '6-months': ['Choose and book venue', 'Decide on party theme', 'Start building guest list'],
    '3-months': [
      'Book entertainer or plan activities',
      'Order or design invitations',
      'Book caterer or plan menu',
    ],
    '1-month': [
      'Send invitations',
      'Order cake and special desserts',
      'Plan party games and activities',
      'Arrange decorations',
    ],
    '1-week': [
      'Confirm final headcount',
      'Buy party supplies and favors',
      'Prepare playlist or entertainment setup',
      'Confirm all vendor bookings',
    ],
    'day-of': [
      'Set up decorations',
      'Pick up cake',
      'Set up food and drink stations',
      'Enjoy the celebration!',
    ],
  },
  community: {
    '12-months': [
      'Define event purpose and goals',
      'Form planning committee',
      'Set event budget',
      'Research potential venues',
    ],
    '6-months': [
      'Book venue',
      'Apply for necessary permits',
      'Secure sponsors or funding',
      'Book AV and sound equipment',
    ],
    '3-months': [
      'Book caterer',
      'Arrange security if needed',
      'Plan marketing and promotion',
      'Recruit volunteers',
    ],
    '1-month': [
      'Finalize event schedule and speakers',
      'Confirm all vendors',
      'Send press releases or social media blasts',
      'Arrange parking and signage',
    ],
    '1-week': [
      'Final walkthrough of venue',
      'Confirm volunteer assignments',
      'Prepare registration and check-in',
      'Test AV equipment',
    ],
    'day-of': [
      'Set up registration desk',
      'Brief volunteers',
      'Sound check',
      'Welcome attendees and enjoy the event!',
    ],
  },
};

/**
 * Default vendor categories for each event type.
 */
export const DEFAULT_VENDOR_CATEGORIES: Record<EventType, readonly string[]> = {
  wedding: [
    'Venue',
    'Caterer',
    'Florist',
    'Photographer',
    'Videographer',
    'DJ / Band',
    'Officiant',
    'Baker (Cake)',
    'Rentals',
    'Hair & Makeup',
    'Transportation',
  ],
  birthday: ['Venue', 'Caterer', 'Entertainer', 'Baker (Cake)', 'Decorator', 'Photographer'],
  community: [
    'Venue',
    'Caterer',
    'AV / Sound',
    'Decorator',
    'Security',
    'Permits Office',
    'Photographer',
  ],
};

/**
 * Currency formatter for USD display.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Date formatter for display.
 */
export const formatDate = (isoDate: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoDate));
};

/**
 * Default Gemini model used for AI idea generation.
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

/**
 * Returns the configured Gemini model name from environment or fallback default.
 */
export function getGeminiModel(): string {
  if (typeof process !== 'undefined' && process.env['GEMINI_MODEL']) {
    return process.env['GEMINI_MODEL'];
  }
  return DEFAULT_GEMINI_MODEL;
}
