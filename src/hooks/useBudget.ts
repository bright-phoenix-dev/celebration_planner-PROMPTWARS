'use client';

import { useMemo } from 'react';
import { useEventStore } from '@/store/eventStore';
import { getBudgetStatus } from '@/lib/budget';
import type { BudgetCategory, BudgetStatus } from '@/types';

/**
 * Hook for budget management.
 * Provides budget categories, status with warnings, and update action.
 */
export function useBudget() {
  const { budgetCategories, currentEvent, updateBudgetCategory } = useEventStore();

  const budgetStatus: BudgetStatus = useMemo(() => {
    if (!currentEvent) {
      return {
        totalBudget: 0,
        totalPlanned: 0,
        totalSpent: 0,
        remaining: 0,
        isOverBudget: false,
        warnings: [],
      };
    }
    return getBudgetStatus(budgetCategories, currentEvent.totalBudget);
  }, [budgetCategories, currentEvent]);

  return {
    budgetCategories,
    budgetStatus,
    updateBudgetCategory: (category: BudgetCategory) => void updateBudgetCategory(category),
  };
}
