'use client';

import { useMemo, useCallback } from 'react';
import { useEventStore } from '@/store/eventStore';
import { getVendorProgress } from '@/lib/vendors';
import type { Vendor } from '@/types';

/**
 * Hook for vendor checklist management.
 * Provides vendors, progress summary, and update action.
 */
export function useVendors() {
  const { vendors, updateVendor } = useEventStore();

  const progress = useMemo(() => getVendorProgress(vendors), [vendors]);

  const handleUpdateVendor = useCallback(
    (vendor: Vendor) => {
      void updateVendor(vendor);
    },
    [updateVendor],
  );

  return {
    vendors,
    progress,
    updateVendor: handleUpdateVendor,
  };
}
