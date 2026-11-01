'use client';

import { useEventStore } from '@/store/eventStore';
import { useBudget } from '@/hooks/useBudget';
import { useTimeline } from '@/hooks/useTimeline';
import { useVendors } from '@/hooks/useVendors';
import { formatCurrency, formatDate } from '@/lib/constants';
import {
  BUDGET_CATEGORY_LABELS,
  EVENT_TYPE_LABELS,
  TIMELINE_PHASE_LABELS,
  VENDOR_STATUS_LABELS,
} from '@/schemas';

/**
 * Print-only view rendered for PDF and printer exports.
 * Displayed only during `@media print` via `.print-only` CSS class.
 */
export function PrintView() {
  const currentEvent = useEventStore((s) => s.currentEvent);
  const { budgetCategories, budgetStatus } = useBudget();
  const { groupedTasks } = useTimeline();
  const { vendors } = useVendors();

  if (!currentEvent) return null;

  return (
    <div className="print-only p-8 text-black">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">{currentEvent.name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Celebration Plan &bull; {EVENT_TYPE_LABELS[currentEvent.type]} &bull;{' '}
          {formatDate(currentEvent.date)}
        </p>
        <div className="mt-4 flex gap-8 text-sm">
          <div>
            <strong>Guest Count:</strong> {currentEvent.guestCount}
          </div>
          <div>
            <strong>Total Budget:</strong> {formatCurrency(currentEvent.totalBudget)}
          </div>
          <div>
            <strong>Total Spent:</strong> {formatCurrency(budgetStatus.totalSpent)}
          </div>
        </div>
      </header>

      {/* Budget Section */}
      <section className="mb-6">
        <h2 className="mb-3 border-b pb-1 text-xl font-semibold">Budget Allocation</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Category</th>
              <th className="py-2 text-right">Planned</th>
              <th className="py-2 text-right">Actual</th>
              <th className="py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {budgetCategories.map((cat) => {
              const diff = cat.plannedAmount - cat.actualAmount;
              return (
                <tr key={cat.category} className="border-b">
                  <td className="py-2 font-medium">{BUDGET_CATEGORY_LABELS[cat.category]}</td>
                  <td className="py-2 text-right">{formatCurrency(cat.plannedAmount)}</td>
                  <td className="py-2 text-right">{formatCurrency(cat.actualAmount)}</td>
                  <td className="py-2 text-right">
                    {diff < 0
                      ? `Over by ${formatCurrency(Math.abs(diff))}`
                      : `${formatCurrency(diff)} remaining`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Timeline Section */}
      <section className="print-break-before mb-6">
        <h2 className="mb-3 border-b pb-1 text-xl font-semibold">Timeline & Tasks</h2>
        {Array.from(groupedTasks.entries()).map(([phase, tasks]) => (
          <div key={phase} className="mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              {TIMELINE_PHASE_LABELS[phase]}
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {tasks.map((task) => (
                <li key={task.id} className={task.completed ? 'text-gray-500 line-through' : ''}>
                  {task.title} {task.completed ? '(Completed)' : ''}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Vendors Section */}
      <section className="mb-6">
        <h2 className="mb-3 border-b pb-1 text-xl font-semibold">Vendor Checklist</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Category</th>
              <th className="py-2">Vendor Name</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Quoted Price</th>
              <th className="py-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="py-2 font-medium">{v.category}</td>
                <td className="py-2">{v.name ?? '—'}</td>
                <td className="py-2">{VENDOR_STATUS_LABELS[v.status]}</td>
                <td className="py-2 text-right">
                  {v.quotedPrice !== undefined ? formatCurrency(v.quotedPrice) : '—'}
                </td>
                <td className="py-2">
                  {[v.contactName, v.contactPhone, v.contactEmail].filter(Boolean).join(' | ') ||
                    '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
