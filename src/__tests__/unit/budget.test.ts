import { describe, it, expect } from 'vitest';
import { allocateBudget, getBudgetStatus } from '@/lib/budget';
import type { BudgetCategory } from '@/types';

describe('Budget Calculator Logic', () => {
  describe('allocateBudget', () => {
    it('allocates budget for wedding based on standard weights', () => {
      const budget = 10000;
      const categories = allocateBudget(budget, 'wedding', 100);

      const venue = categories.find((c) => c.category === 'venue');
      const catering = categories.find((c) => c.category === 'catering');

      expect(venue?.plannedAmount).toBe(3000); // 30%
      expect(catering?.plannedAmount).toBe(2500); // 25%
    });

    it('allocates budget differently for birthday and community events', () => {
      const budget = 10000;
      const birthday = allocateBudget(budget, 'birthday', 50);
      const community = allocateBudget(budget, 'community', 150);

      const bCatering = birthday.find((c) => c.category === 'catering');
      const cVenue = community.find((c) => c.category === 'venue');

      expect(bCatering?.plannedAmount).toBe(3000); // 30%
      expect(cVenue?.plannedAmount).toBe(3500); // 35%
    });

    it('handles zero total budget gracefully', () => {
      const categories = allocateBudget(0, 'wedding', 50);
      expect(categories.length).toBe(7);
      categories.forEach((c) => {
        expect(c.plannedAmount).toBe(0);
        expect(c.actualAmount).toBe(0);
      });
    });

    it('throws error on negative total budget', () => {
      expect(() => allocateBudget(-100, 'wedding', 50)).toThrow('Total budget cannot be negative');
    });

    it('throws error on guest count less than 1', () => {
      expect(() => allocateBudget(5000, 'wedding', 0)).toThrow('Guest count must be at least 1');
    });

    it('scales up venue and catering for large guest counts (>200)', () => {
      const standard = allocateBudget(10000, 'wedding', 100);
      const scaled = allocateBudget(10000, 'wedding', 300);

      const standardVenue = standard.find((c) => c.category === 'venue')?.plannedAmount ?? 0;
      const scaledVenue = scaled.find((c) => c.category === 'venue')?.plannedAmount ?? 0;

      const standardCatering = standard.find((c) => c.category === 'catering')?.plannedAmount ?? 0;
      const scaledCatering = scaled.find((c) => c.category === 'catering')?.plannedAmount ?? 0;

      expect(scaledVenue).toBeGreaterThan(standardVenue);
      expect(scaledCatering).toBeGreaterThan(standardCatering);
    });
  });

  describe('getBudgetStatus', () => {
    it('calculates totals, remaining, and detects within budget state', () => {
      const categories: BudgetCategory[] = [
        { category: 'venue', plannedAmount: 3000, actualAmount: 2500 },
        { category: 'catering', plannedAmount: 2000, actualAmount: 1800 },
        { category: 'decor', plannedAmount: 1000, actualAmount: 500 },
      ];

      const status = getBudgetStatus(categories, 6000);

      expect(status.totalBudget).toBe(6000);
      expect(status.totalPlanned).toBe(6000);
      expect(status.totalSpent).toBe(4800);
      expect(status.remaining).toBe(1200);
      expect(status.isOverBudget).toBe(false);
    });

    it('warns when an individual category is over budget', () => {
      const categories: BudgetCategory[] = [
        { category: 'venue', plannedAmount: 1000, actualAmount: 1150 }, // 15% over -> warning
      ];

      const status = getBudgetStatus(categories, 5000);
      expect(status.warnings.length).toBeGreaterThan(0);
      const warn = status.warnings.find((w) => w.category === 'venue');
      expect(warn).toBeDefined();
      expect(warn?.severity).toBe('warning');
    });

    it('warns with error severity when category is more than 20% over budget', () => {
      const categories: BudgetCategory[] = [
        { category: 'photography', plannedAmount: 1000, actualAmount: 1300 }, // 30% over
      ];

      const status = getBudgetStatus(categories, 5000);
      const warn = status.warnings.find((w) => w.category === 'photography');
      expect(warn?.severity).toBe('error');
    });

    it('warns when total spending exceeds total budget', () => {
      const categories: BudgetCategory[] = [
        { category: 'venue', plannedAmount: 3000, actualAmount: 4000 },
        { category: 'catering', plannedAmount: 2000, actualAmount: 2500 },
      ];

      const status = getBudgetStatus(categories, 5000);
      expect(status.isOverBudget).toBe(true);
      expect(status.remaining).toBe(-1500);
      expect(status.warnings.some((w) => w.severity === 'error')).toBe(true);
    });
  });
});
