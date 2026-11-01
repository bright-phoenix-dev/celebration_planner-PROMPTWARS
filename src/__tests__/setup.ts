import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import type { CelebrationEvent, BudgetCategory, TimelineTask, Vendor } from '@/types';

// In-memory mock storage for Vitest jsdom tests
const memoryEvents = new Map<string, CelebrationEvent>();
const memoryBudgets = new Map<string, BudgetCategory[]>();
const memoryTimeline = new Map<string, TimelineTask[]>();
const memoryVendors = new Map<string, Vendor[]>();

vi.mock('@/store/persistence', () => ({
  db: {},
  saveEvent: vi.fn((event: CelebrationEvent) => {
    memoryEvents.set(event.id, event);
    return Promise.resolve();
  }),
  loadEvent: vi.fn((id: string) => {
    return Promise.resolve(memoryEvents.get(id));
  }),
  loadAllEvents: vi.fn(() => {
    return Promise.resolve(Array.from(memoryEvents.values()));
  }),
  deleteEvent: vi.fn((id: string) => {
    memoryEvents.delete(id);
    memoryBudgets.delete(id);
    memoryTimeline.delete(id);
    memoryVendors.delete(id);
    return Promise.resolve();
  }),
  saveBudgetCategories: vi.fn((eventId: string, categories: BudgetCategory[]) => {
    memoryBudgets.set(eventId, categories);
    return Promise.resolve();
  }),
  loadBudgetCategories: vi.fn((eventId: string) => {
    return Promise.resolve(memoryBudgets.get(eventId) ?? []);
  }),
  saveTimelineTasks: vi.fn((tasks: TimelineTask[]) => {
    if (tasks.length > 0 && tasks[0]) {
      memoryTimeline.set(tasks[0].eventId, tasks);
    }
    return Promise.resolve();
  }),
  loadTimelineTasks: vi.fn((eventId: string) => {
    return Promise.resolve(memoryTimeline.get(eventId) ?? []);
  }),
  saveVendors: vi.fn((vendors: Vendor[]) => {
    if (vendors.length > 0 && vendors[0]) {
      memoryVendors.set(vendors[0].eventId, vendors);
    }
    return Promise.resolve();
  }),
  loadVendors: vi.fn((eventId: string) => {
    return Promise.resolve(memoryVendors.get(eventId) ?? []);
  }),
}));
