import Dexie from 'dexie';
import type { CelebrationEvent, BudgetCategory, TimelineTask, Vendor } from '@/types';

/**
 * Extended budget category with event association for IndexedDB storage.
 */
interface StoredBudgetCategory extends BudgetCategory {
  eventId: string;
}

/**
 * IndexedDB database for persisting event planning data.
 * Uses Dexie for a clean Promise-based API over IndexedDB.
 */
class CelebrationDatabase extends Dexie {
  events!: Dexie.Table<CelebrationEvent, string>;
  budgetCategories!: Dexie.Table<StoredBudgetCategory, number>;
  timelineTasks!: Dexie.Table<TimelineTask, string>;
  vendors!: Dexie.Table<Vendor, string>;

  constructor() {
    super('celebration-planner');
    this.version(1).stores({
      events: 'id, type, date',
      budgetCategories: '++id, eventId, category',
      timelineTasks: 'id, eventId, phase',
      vendors: 'id, eventId, category',
    });
  }
}

/** Singleton database instance. */
export const db = new CelebrationDatabase();

/**
 * Saves or updates an event in the database.
 * @param event - The event to save
 */
export async function saveEvent(event: CelebrationEvent): Promise<void> {
  await db.events.put(event);
}

/**
 * Loads an event by ID.
 * @param id - The event UUID
 * @returns The event or undefined if not found
 */
export async function loadEvent(id: string): Promise<CelebrationEvent | undefined> {
  return db.events.get(id);
}

/**
 * Loads all events from the database.
 * @returns Array of all saved events
 */
export async function loadAllEvents(): Promise<CelebrationEvent[]> {
  return db.events.toArray();
}

/**
 * Deletes an event and all its associated data.
 * @param id - The event UUID to delete
 */
export async function deleteEvent(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.events, db.budgetCategories, db.timelineTasks, db.vendors],
    async () => {
      await db.events.delete(id);
      await db.budgetCategories.where('eventId').equals(id).delete();
      await db.timelineTasks.where('eventId').equals(id).delete();
      await db.vendors.where('eventId').equals(id).delete();
    },
  );
}

/**
 * Saves budget categories for an event, replacing any existing ones.
 * @param eventId - The event UUID
 * @param categories - Budget categories to save
 */
export async function saveBudgetCategories(
  eventId: string,
  categories: BudgetCategory[],
): Promise<void> {
  await db.transaction('rw', db.budgetCategories, async () => {
    await db.budgetCategories.where('eventId').equals(eventId).delete();
    const withEventId: StoredBudgetCategory[] = categories.map((c) => ({ ...c, eventId }));
    await db.budgetCategories.bulkAdd(withEventId);
  });
}

/**
 * Loads budget categories for an event.
 * @param eventId - The event UUID
 */
export async function loadBudgetCategories(eventId: string): Promise<BudgetCategory[]> {
  const rows = await db.budgetCategories.where('eventId').equals(eventId).toArray();
  return rows.map((row) => ({
    category: row.category,
    plannedAmount: row.plannedAmount,
    actualAmount: row.actualAmount,
    notes: row.notes,
  }));
}

/**
 * Saves timeline tasks for an event, replacing any existing ones.
 * @param tasks - Timeline tasks to save
 */
export async function saveTimelineTasks(tasks: TimelineTask[]): Promise<void> {
  if (tasks.length === 0) return;
  const eventId = tasks[0]?.eventId;
  if (!eventId) return;
  await db.transaction('rw', db.timelineTasks, async () => {
    await db.timelineTasks.where('eventId').equals(eventId).delete();
    await db.timelineTasks.bulkAdd(tasks);
  });
}

/**
 * Loads timeline tasks for an event.
 * @param eventId - The event UUID
 */
export async function loadTimelineTasks(eventId: string): Promise<TimelineTask[]> {
  return db.timelineTasks.where('eventId').equals(eventId).toArray();
}

/**
 * Saves vendors for an event, replacing any existing ones.
 * @param vendors - Vendor entries to save
 */
export async function saveVendors(vendors: Vendor[]): Promise<void> {
  if (vendors.length === 0) return;
  const eventId = vendors[0]?.eventId;
  if (!eventId) return;
  await db.transaction('rw', db.vendors, async () => {
    await db.vendors.where('eventId').equals(eventId).delete();
    await db.vendors.bulkAdd(vendors);
  });
}

/**
 * Loads vendors for an event.
 * @param eventId - The event UUID
 */
export async function loadVendors(eventId: string): Promise<Vendor[]> {
  return db.vendors.where('eventId').equals(eventId).toArray();
}
