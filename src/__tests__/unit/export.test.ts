import { describe, it, expect, vi } from 'vitest';
import { exportPlan, formatExportDate } from '@/lib/export';

describe('Export Utility (src/lib/export.ts)', () => {
  it('triggers window.print()', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(vi.fn());
    exportPlan();
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it('formats export date correctly', () => {
    const formatted = formatExportDate('2026-12-25T00:00:00.000Z');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('December');
  });
});
