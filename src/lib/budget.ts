import type {
  EventType,
  BudgetCategory,
  BudgetCategoryName,
  BudgetStatus,
  BudgetWarning,
} from '@/types';
import {
  BUDGET_PERCENTAGES,
  BUDGET_CATEGORIES,
  LARGE_GUEST_THRESHOLD,
  LARGE_GUEST_SCALE_FACTOR,
} from './constants';

/**
 * Allocates a total budget across categories based on event type and guest count.
 *
 * For large guest counts (above threshold), catering and venue receive
 * a proportional boost while other categories are scaled down.
 *
 * @param totalBudget - The total budget amount (must be >= 0)
 * @param eventType - The type of event
 * @param guestCount - Number of expected guests (must be >= 1)
 * @returns Array of budget categories with allocated planned amounts
 *
 * @example
 * ```ts
 * const categories = allocateBudget(50000, 'wedding', 150);
 * // Returns 7 categories with plannedAmount based on wedding percentages
 * ```
 */
export function allocateBudget(
  totalBudget: number,
  eventType: EventType,
  guestCount: number,
): BudgetCategory[] {
  if (totalBudget < 0) {
    throw new Error('Total budget cannot be negative');
  }

  if (guestCount < 1) {
    throw new Error('Guest count must be at least 1');
  }

  const basePercentages = { ...BUDGET_PERCENTAGES[eventType] };
  const adjustedPercentages = applyGuestScaling(basePercentages, guestCount);

  return BUDGET_CATEGORIES.map((category) => ({
    category,
    plannedAmount: Math.round(totalBudget * adjustedPercentages[category]),
    actualAmount: 0,
  }));
}

/**
 * Adjusts budget percentages for large guest counts.
 * Boosts venue and catering proportionally, reducing other categories.
 *
 * @param percentages - Base percentage allocations
 * @param guestCount - Number of expected guests
 * @returns Adjusted percentage allocations that still sum to ~1.0
 */
function applyGuestScaling(
  percentages: Record<BudgetCategoryName, number>,
  guestCount: number,
): Record<BudgetCategoryName, number> {
  if (guestCount <= LARGE_GUEST_THRESHOLD) {
    return percentages;
  }

  const adjusted = { ...percentages };
  const boostCategories: BudgetCategoryName[] = ['venue', 'catering'];
  const totalBoost = LARGE_GUEST_SCALE_FACTOR * boostCategories.length;

  // Add boost to venue and catering
  for (const cat of boostCategories) {
    adjusted[cat] = adjusted[cat] + LARGE_GUEST_SCALE_FACTOR;
  }

  // Reduce other categories proportionally
  const otherCategories = BUDGET_CATEGORIES.filter((c) => !boostCategories.includes(c));
  const totalOtherPercentage = otherCategories.reduce((sum, c) => sum + adjusted[c], 0);

  if (totalOtherPercentage > 0) {
    for (const cat of otherCategories) {
      const currentPct = adjusted[cat];
      const reduction = (currentPct / totalOtherPercentage) * totalBoost;
      adjusted[cat] = Math.max(0, currentPct - reduction);
    }
  }

  return adjusted;
}

/**
 * Computes the overall budget status including totals and warnings.
 *
 * @param categories - Array of budget categories with actual spend
 * @param totalBudget - The total allocated budget
 * @returns Budget status summary with warnings for over-budget categories
 *
 * @example
 * ```ts
 * const status = getBudgetStatus(categories, 50000);
 * if (status.isOverBudget) {
 *   console.log(status.warnings);
 * }
 * ```
 */
export function getBudgetStatus(categories: BudgetCategory[], totalBudget: number): BudgetStatus {
  const totalPlanned = categories.reduce((sum, c) => sum + c.plannedAmount, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.actualAmount, 0);
  const remaining = totalBudget - totalSpent;
  const warnings: BudgetWarning[] = [];

  // Check each category for over-spending
  for (const cat of categories) {
    if (cat.actualAmount > cat.plannedAmount && cat.plannedAmount > 0) {
      const overBy = cat.actualAmount - cat.plannedAmount;
      const overPercent = Math.round((overBy / cat.plannedAmount) * 100);
      warnings.push({
        category: cat.category,
        message: `Over budget by ${overPercent}% (${formatCurrencyCompact(overBy)} over)`,
        severity: overPercent > 20 ? 'error' : 'warning',
      });
    }
  }

  // Check overall budget
  if (totalSpent > totalBudget) {
    warnings.unshift({
      category: 'misc',
      message: `Total spending exceeds budget by ${formatCurrencyCompact(totalSpent - totalBudget)}`,
      severity: 'error',
    });
  } else if (totalSpent > totalBudget * 0.9) {
    warnings.unshift({
      category: 'misc',
      message: `Approaching budget limit (${Math.round((totalSpent / totalBudget) * 100)}% used)`,
      severity: 'warning',
    });
  }

  return {
    totalBudget,
    totalPlanned,
    totalSpent,
    remaining,
    isOverBudget: totalSpent > totalBudget,
    warnings,
  };
}

/**
 * Formats a currency amount in compact form for warning messages.
 */
function formatCurrencyCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
