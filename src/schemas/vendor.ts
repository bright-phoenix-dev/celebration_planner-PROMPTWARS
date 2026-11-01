import { z } from 'zod';

/**
 * Vendor engagement status progression.
 */
export const VendorStatusSchema = z.enum(['to-contact', 'contacted', 'quoted', 'booked', 'paid']);

/**
 * Human-readable labels for vendor statuses.
 */
export const VENDOR_STATUS_LABELS: Record<z.infer<typeof VendorStatusSchema>, string> = {
  'to-contact': 'To Contact',
  contacted: 'Contacted',
  quoted: 'Quoted',
  booked: 'Booked',
  paid: 'Paid',
};

/**
 * Schema for a single vendor entry in the checklist.
 */
export const VendorSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be 100 characters or fewer'),
  name: z.string().max(200, 'Name must be 200 characters or fewer').optional(),
  status: VendorStatusSchema,
  quotedPrice: z.number().min(0, 'Price cannot be negative').optional(),
  notes: z.string().max(1000, 'Notes must be 1,000 characters or fewer').optional(),
  contactName: z.string().max(200, 'Contact name must be 200 characters or fewer').optional(),
  contactEmail: z
    .string()
    .email('Must be a valid email')
    .max(254, 'Email must be 254 characters or fewer')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string().max(20, 'Phone must be 20 characters or fewer').optional(),
});
