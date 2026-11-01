import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  CelebrationEvent,
  CreateEventInput,
  BudgetCategory,
  TimelineTask,
  Vendor,
} from '@/types';
import { allocateBudget } from '@/lib/budget';
import { generateTimeline } from '@/lib/timeline';
import { getDefaultVendors } from '@/lib/vendors';
import {
  saveEvent,
  loadEvent,
  loadAllEvents,
  deleteEvent as deleteEventFromDb,
  saveBudgetCategories,
  loadBudgetCategories,
  saveTimelineTasks,
  loadTimelineTasks,
  saveVendors,
  loadVendors,
} from './persistence';

/**
 * Application state for celebration event planning.
 */
interface EventState {
  /** The current event being planned, or null if none selected. */
  currentEvent: CelebrationEvent | null;
  /** All saved events. */
  events: CelebrationEvent[];
  /** Budget categories for the current event. */
  budgetCategories: BudgetCategory[];
  /** Timeline tasks for the current event. */
  timelineTasks: TimelineTask[];
  /** Vendor checklist for the current event. */
  vendors: Vendor[];
  /** Whether the store is loading data. */
  isLoading: boolean;

  // Actions
  createEvent: (input: CreateEventInput) => Promise<string>;
  loadEventById: (id: string) => Promise<void>;
  loadAllSavedEvents: () => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  updateBudgetCategory: (category: BudgetCategory) => Promise<void>;
  toggleTimelineTask: (taskId: string) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  updateEvent: (updates: Partial<CelebrationEvent>) => Promise<void>;
}

/**
 * Zustand store for managing celebration event state.
 * Persists all data to IndexedDB via the persistence layer.
 */
export const useEventStore = create<EventState>((set, get) => ({
  currentEvent: null,
  events: [],
  budgetCategories: [],
  timelineTasks: [],
  vendors: [],
  isLoading: false,

  createEvent: async (input: CreateEventInput): Promise<string> => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const event: CelebrationEvent = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Generate initial data
    const categories = allocateBudget(input.totalBudget, input.type, input.guestCount);
    const tasks = generateTimeline(input.date, input.type, id);
    const vendorList = getDefaultVendors(input.type, id);

    // Persist everything
    await saveEvent(event);
    await saveBudgetCategories(id, categories);
    await saveTimelineTasks(tasks);
    await saveVendors(vendorList);

    set({
      currentEvent: event,
      budgetCategories: categories,
      timelineTasks: tasks,
      vendors: vendorList,
    });

    return id;
  },

  loadEventById: async (id: string): Promise<void> => {
    set({ isLoading: true });
    try {
      const event = await loadEvent(id);
      if (!event) {
        set({ currentEvent: null, isLoading: false });
        return;
      }

      const [categories, tasks, vendorList] = await Promise.all([
        loadBudgetCategories(id),
        loadTimelineTasks(id),
        loadVendors(id),
      ]);

      set({
        currentEvent: event,
        budgetCategories: categories,
        timelineTasks: tasks,
        vendors: vendorList,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  loadAllSavedEvents: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const events = await loadAllEvents();
      set({ events, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  removeEvent: async (id: string): Promise<void> => {
    await deleteEventFromDb(id);
    const { currentEvent } = get();
    if (currentEvent?.id === id) {
      set({
        currentEvent: null,
        budgetCategories: [],
        timelineTasks: [],
        vendors: [],
      });
    }
    const events = await loadAllEvents();
    set({ events });
  },

  updateBudgetCategory: async (updatedCategory: BudgetCategory): Promise<void> => {
    const { budgetCategories, currentEvent } = get();
    if (!currentEvent) return;

    const updated = budgetCategories.map((c) =>
      c.category === updatedCategory.category ? updatedCategory : c,
    );

    set({ budgetCategories: updated });
    await saveBudgetCategories(currentEvent.id, updated);
  },

  toggleTimelineTask: async (taskId: string): Promise<void> => {
    const { timelineTasks } = get();
    const updated = timelineTasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t,
    );

    set({ timelineTasks: updated });
    await saveTimelineTasks(updated);
  },

  updateVendor: async (updatedVendor: Vendor): Promise<void> => {
    const { vendors } = get();
    const updated = vendors.map((v) => (v.id === updatedVendor.id ? updatedVendor : v));

    set({ vendors: updated });
    await saveVendors(updated);
  },

  updateEvent: async (updates: Partial<CelebrationEvent>): Promise<void> => {
    const { currentEvent } = get();
    if (!currentEvent) return;

    const updatedEvent: CelebrationEvent = {
      ...currentEvent,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    set({ currentEvent: updatedEvent });
    await saveEvent(updatedEvent);
  },
}));
