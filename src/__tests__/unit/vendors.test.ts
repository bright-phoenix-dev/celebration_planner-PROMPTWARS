import { describe, it, expect } from 'vitest';
import { getDefaultVendors, getVendorProgress } from '@/lib/vendors';
import type { Vendor } from '@/types';

describe('Vendor Checklist Logic', () => {
  const eventId = 'test-event-uuid';

  describe('getDefaultVendors', () => {
    it('creates appropriate default checklist for wedding', () => {
      const vendors = getDefaultVendors('wedding', eventId);
      expect(vendors.length).toBeGreaterThanOrEqual(8);
      const categories = vendors.map((v) => v.category);
      expect(categories).toContain('Venue');
      expect(categories).toContain('Photographer');
      expect(categories).toContain('Caterer');
      expect(vendors.every((v) => v.status === 'to-contact')).toBe(true);
    });

    it('creates appropriate default checklist for birthday', () => {
      const vendors = getDefaultVendors('birthday', eventId);
      const categories = vendors.map((v) => v.category);
      expect(categories).toContain('Baker (Cake)');
      expect(categories).toContain('Entertainer');
    });

    it('creates appropriate default checklist for community event', () => {
      const vendors = getDefaultVendors('community', eventId);
      const categories = vendors.map((v) => v.category);
      expect(categories).toContain('Security');
      expect(categories).toContain('Permits Office');
      expect(categories).toContain('AV / Sound');
    });
  });

  describe('getVendorProgress', () => {
    it('computes correct progress with mixed statuses', () => {
      const vendors: Vendor[] = [
        { id: '1', eventId, category: 'Venue', status: 'booked' },
        { id: '2', eventId, category: 'Caterer', status: 'paid' },
        { id: '3', eventId, category: 'Music', status: 'quoted' },
        { id: '4', eventId, category: 'Flowers', status: 'to-contact' },
      ];

      const progress = getVendorProgress(vendors);
      expect(progress.totalVendors).toBe(4);
      expect(progress.completedVendors).toBe(2); // booked + paid
      expect(progress.progressPercent).toBe(50);
      expect(progress.statusCounts['booked']).toBe(1);
      expect(progress.statusCounts['paid']).toBe(1);
    });

    it('returns 0% progress for empty list', () => {
      const progress = getVendorProgress([]);
      expect(progress.totalVendors).toBe(0);
      expect(progress.progressPercent).toBe(0);
    });
  });
});
