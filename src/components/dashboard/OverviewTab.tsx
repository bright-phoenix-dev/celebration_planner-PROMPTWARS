'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, DollarSign, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useBudget } from '@/hooks/useBudget';
import { useTimeline } from '@/hooks/useTimeline';
import { useVendors } from '@/hooks/useVendors';
import { useEventStore } from '@/store/eventStore';
import { formatCurrency, formatDate } from '@/lib/constants';
import { EVENT_TYPE_LABELS } from '@/schemas';

/**
 * Dashboard overview tab showing key metrics and progress at a glance.
 */
export function OverviewTab() {
  const currentEvent = useEventStore((s) => s.currentEvent);
  const { budgetStatus } = useBudget();
  const { progress: timelineProgress } = useTimeline();
  const { progress: vendorProgress } = useVendors();

  if (!currentEvent) return null;

  return (
    <div className="space-y-6">
      {/* Event summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            {currentEvent.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Event Type</p>
              <p className="font-medium">{EVENT_TYPE_LABELS[currentEvent.type]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(currentEvent.date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guests</p>
              <p className="font-medium">{currentEvent.guestCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Budget card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              Budget
              {budgetStatus.isOverBudget && (
                <Badge variant="destructive" className="ml-auto">
                  <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
                  Over Budget
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(budgetStatus.totalSpent)}</p>
            <p className="text-sm text-muted-foreground">
              of {formatCurrency(budgetStatus.totalBudget)} budget
            </p>
            <Progress
              value={
                budgetStatus.totalBudget > 0
                  ? Math.min((budgetStatus.totalSpent / budgetStatus.totalBudget) * 100, 100)
                  : 0
              }
              className="mt-2"
              aria-label={`Budget used: ${formatCurrency(budgetStatus.totalSpent)} of ${formatCurrency(budgetStatus.totalBudget)}`}
            />
          </CardContent>
        </Card>

        {/* Timeline card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{timelineProgress}%</p>
            <p className="text-sm text-muted-foreground">tasks completed</p>
            <Progress
              value={timelineProgress}
              className="mt-2"
              aria-label={`Timeline progress: ${String(timelineProgress)}% complete`}
            />
          </CardContent>
        </Card>

        {/* Vendors card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" aria-hidden="true" />
              Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {vendorProgress.completedVendors}/{vendorProgress.totalVendors}
            </p>
            <p className="text-sm text-muted-foreground">vendors booked</p>
            <Progress
              value={vendorProgress.progressPercent}
              className="mt-2"
              aria-label={`Vendors progress: ${String(vendorProgress.completedVendors)} of ${String(vendorProgress.totalVendors)} booked`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {budgetStatus.warnings.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-warning">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1" aria-label="Budget warnings">
              {budgetStatus.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${w.severity === 'error' ? 'text-destructive' : 'text-warning'}`}
                    aria-hidden="true"
                  />
                  <span>{w.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
