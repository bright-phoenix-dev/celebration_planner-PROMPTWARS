'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, DollarSign, Pencil, X, Check } from 'lucide-react';
import { useBudget } from '@/hooks/useBudget';
import { BUDGET_CATEGORY_LABELS } from '@/schemas';
import { formatCurrency } from '@/lib/constants';
import type { BudgetCategory, BudgetCategoryName } from '@/types';

/**
 * Budget tab showing category-wise planned vs actual spending with edit capability.
 */
export function BudgetTab() {
  const { budgetCategories, budgetStatus, updateBudgetCategory } = useBudget();
  const [editingCategory, setEditingCategory] = useState<BudgetCategoryName | null>(null);
  const [editActual, setEditActual] = useState('');

  const startEdit = (cat: BudgetCategory) => {
    setEditingCategory(cat.category);
    setEditActual(String(cat.actualAmount));
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditActual('');
  };

  const saveEdit = (cat: BudgetCategory) => {
    const actual = parseFloat(editActual) || 0;
    updateBudgetCategory({ ...cat, actualAmount: Math.max(0, actual) });
    setEditingCategory(null);
    setEditActual('');
  };

  return (
    <div className="space-y-6">
      {/* Budget summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
            Budget Overview
            {budgetStatus.isOverBudget && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
                Over Budget
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-xl font-bold">{formatCurrency(budgetStatus.totalBudget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Planned</p>
              <p className="text-xl font-bold">{formatCurrency(budgetStatus.totalPlanned)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-xl font-bold">{formatCurrency(budgetStatus.totalSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p
                className={`text-xl font-bold ${budgetStatus.remaining < 0 ? 'text-destructive' : 'text-success'}`}
              >
                {formatCurrency(budgetStatus.remaining)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        {budgetCategories.map((cat) => {
          const isEditing = editingCategory === cat.category;
          const isOverSpent = cat.actualAmount > cat.plannedAmount && cat.plannedAmount > 0;
          const spentPercent =
            cat.plannedAmount > 0 ? Math.min((cat.actualAmount / cat.plannedAmount) * 100, 100) : 0;

          return (
            <Card key={cat.category} className={isOverSpent ? 'border-destructive/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{BUDGET_CATEGORY_LABELS[cat.category]}</h3>
                  {isOverSpent && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
                      Over
                    </Badge>
                  )}
                </div>

                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Planned</span>
                    <span>{formatCurrency(cat.plannedAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Actual</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Label htmlFor={`edit-${cat.category}`} className="sr-only">
                          Actual amount for {BUDGET_CATEGORY_LABELS[cat.category]}
                        </Label>
                        <Input
                          id={`edit-${cat.category}`}
                          type="number"
                          min={0}
                          value={editActual}
                          onChange={(e) => {
                            setEditActual(e.target.value);
                          }}
                          className="h-7 w-28 text-right"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEdit(cat);
                            }
                            if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            saveEdit(cat);
                          }}
                          aria-label="Save"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            cancelEdit();
                          }}
                          aria-label="Cancel"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          startEdit(cat);
                        }}
                        className="flex items-center gap-1 hover:text-primary"
                        aria-label={`Edit actual amount for ${BUDGET_CATEGORY_LABELS[cat.category]}`}
                      >
                        {formatCurrency(cat.actualAmount)}
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                <Progress
                  value={spentPercent}
                  className="mt-2"
                  aria-label={`${BUDGET_CATEGORY_LABELS[cat.category]}: ${String(Math.round(spentPercent))}% spent`}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
