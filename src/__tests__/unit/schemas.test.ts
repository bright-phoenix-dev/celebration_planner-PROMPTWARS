import { describe, it, expect } from 'vitest';
import {
  CreateEventSchema,
  BudgetCategorySchema,
  TimelineTaskSchema,
  VendorSchema,
  AIIdeasResponseSchema,
} from '@/schemas';

describe('Zod Validation Schemas', () => {
  describe('CreateEventSchema', () => {
    it('validates a correct event input', () => {
      const valid = {
        type: 'wedding',
        name: 'Alex & Sam Wedding',
        date: new Date(Date.now() + 86400000 * 180).toISOString(),
        guestCount: 150,
        totalBudget: 25000,
      };
      const res = CreateEventSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rejects missing or empty name', () => {
      const res = CreateEventSchema.safeParse({
        type: 'birthday',
        name: '',
        date: new Date().toISOString(),
        guestCount: 50,
        totalBudget: 1000,
      });
      expect(res.success).toBe(false);
    });

    it('rejects guest count less than 1 or exceeding 10000', () => {
      const zeroGuests = CreateEventSchema.safeParse({
        type: 'birthday',
        name: 'Party',
        date: new Date().toISOString(),
        guestCount: 0,
        totalBudget: 1000,
      });
      expect(zeroGuests.success).toBe(false);

      const tooManyGuests = CreateEventSchema.safeParse({
        type: 'birthday',
        name: 'Party',
        date: new Date().toISOString(),
        guestCount: 15000,
        totalBudget: 1000,
      });
      expect(tooManyGuests.success).toBe(false);
    });

    it('rejects negative budget', () => {
      const negativeBudget = CreateEventSchema.safeParse({
        type: 'community',
        name: 'Festival',
        date: new Date().toISOString(),
        guestCount: 100,
        totalBudget: -500,
      });
      expect(negativeBudget.success).toBe(false);
    });
  });

  describe('BudgetCategorySchema', () => {
    it('validates valid budget category', () => {
      const valid = {
        category: 'venue',
        plannedAmount: 5000,
        actualAmount: 4800,
        notes: 'Deposit paid',
      };
      const res = BudgetCategorySchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rejects negative planned or actual amounts', () => {
      const res = BudgetCategorySchema.safeParse({
        category: 'venue',
        plannedAmount: -10,
        actualAmount: 0,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('TimelineTaskSchema', () => {
    it('validates a complete timeline task', () => {
      const valid = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        eventId: '123e4567-e89b-12d3-a456-426614174001',
        phase: '6-months',
        title: 'Book Photographer',
        dueDate: new Date().toISOString(),
        completed: false,
        order: 1,
      };
      expect(TimelineTaskSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects empty title', () => {
      const res = TimelineTaskSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        eventId: '123e4567-e89b-12d3-a456-426614174001',
        phase: '6-months',
        title: '',
        dueDate: new Date().toISOString(),
        completed: false,
        order: 1,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('VendorSchema', () => {
    it('validates vendor with valid status and optional fields', () => {
      const valid = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        eventId: '123e4567-e89b-12d3-a456-426614174001',
        category: 'Catering',
        name: 'Delicious Bites',
        status: 'quoted',
        quotedPrice: 3500,
        contactEmail: 'chef@delicious.com',
      };
      expect(VendorSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects invalid email when provided', () => {
      const res = VendorSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        eventId: '123e4567-e89b-12d3-a456-426614174001',
        category: 'Catering',
        status: 'to-contact',
        contactEmail: 'not-an-email',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('AIIdeasResponseSchema', () => {
    it('validates well-formed AI response structure', () => {
      const valid = {
        themes: [{ name: 'Rustic Elegance', description: 'Wood accents and warm lights' }],
        decor: ['Fairy lights', 'Burlap runners'],
        menu: [{ item: 'Wild Mushroom Risotto', note: 'Vegetarian' }],
        activities: ['Acoustic live duo'],
        invitations: [
          { style: 'Kraft Paper Letterpress', description: 'Eco-friendly minimal design' },
        ],
      };
      expect(AIIdeasResponseSchema.safeParse(valid).success).toBe(true);
    });

    it('enforces maximum array length bounds for token efficiency', () => {
      const tooManyThemes = {
        themes: Array.from({ length: 6 }, (_, i) => ({
          name: `Theme ${String(i)}`,
          description: 'Desc',
        })),
        decor: [],
        menu: [],
        activities: [],
        invitations: [],
      };
      expect(AIIdeasResponseSchema.safeParse(tooManyThemes).success).toBe(false);
    });
  });
});
