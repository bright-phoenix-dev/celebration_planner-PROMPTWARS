'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportPlan } from '@/lib/export';

interface ExportButtonProps {
  className?: string;
}

/**
 * Button to trigger the print-friendly export dialog.
 */
export function ExportButton({ className }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        exportPlan();
      }}
      className={className}
      aria-label="Export or print celebration plan"
    >
      <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
      Export / Print
    </Button>
  );
}
