import { v4 as uuidv4 } from 'uuid';
import type { EventType, Vendor } from '@/types';
import { DEFAULT_VENDOR_CATEGORIES } from './constants';

/**
 * Generates a default vendor checklist for the given event type.
 * All vendors start with 'to-contact' status.
 *
 * @param eventType - The type of event
 * @param eventId - UUID of the event
 * @returns Array of vendor entries with default categories and 'to-contact' status
 *
 * @example
 * ```ts
 * const vendors = getDefaultVendors('wedding', 'event-123');
 * // Returns vendors for: Venue, Caterer, Florist, Photographer, ...
 * ```
 */
export function getDefaultVendors(eventType: EventType, eventId: string): Vendor[] {
  const categories = DEFAULT_VENDOR_CATEGORIES[eventType];

  return categories.map((category) => ({
    id: uuidv4(),
    eventId,
    category,
    status: 'to-contact' as const,
  }));
}

/**
 * Computes a summary of vendor checklist progress.
 *
 * @param vendors - Array of vendors for an event
 * @returns Object with counts per status and overall progress percentage
 */
export function getVendorProgress(vendors: Vendor[]): VendorProgressSummary {
  const statusCounts = {
    'to-contact': 0,
    contacted: 0,
    quoted: 0,
    booked: 0,
    paid: 0,
  };

  for (const vendor of vendors) {
    statusCounts[vendor.status]++;
  }

  const totalVendors = vendors.length;
  const completedVendors = statusCounts.booked + statusCounts.paid;
  const progressPercent =
    totalVendors > 0 ? Math.round((completedVendors / totalVendors) * 100) : 0;

  return {
    statusCounts,
    totalVendors,
    completedVendors,
    progressPercent,
  };
}

/**
 * Summary of vendor checklist progress.
 */
export interface VendorProgressSummary {
  /** Count of vendors in each status. */
  statusCounts: Record<string, number>;
  /** Total number of vendors in the checklist. */
  totalVendors: number;
  /** Number of vendors that are booked or paid. */
  completedVendors: number;
  /** Percentage of vendors booked or paid (0–100). */
  progressPercent: number;
}
