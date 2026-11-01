/**
 * Triggers the browser's print dialog for exporting the plan.
 * The print-friendly CSS in globals.css handles the layout.
 */
export function exportPlan(): void {
  window.print();
}

/**
 * Formats a date string for display in export/print views.
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string
 */
export function formatExportDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoDate));
}
