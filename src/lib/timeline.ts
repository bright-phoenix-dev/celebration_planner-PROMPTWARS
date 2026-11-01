import { v4 as uuidv4 } from 'uuid';
import type { EventType, TimelineTask, TimelinePhase } from '@/types';
import { DEFAULT_TIMELINE_TASKS, PHASE_OFFSETS, TIMELINE_PHASES } from './constants';

/**
 * Generates a backward-planned timeline of tasks from the event date.
 *
 * Only includes phases that fall after the current date (or today if the
 * event is in the past). Each task gets a due date based on its phase offset
 * from the event date.
 *
 * @param eventDate - ISO 8601 date string for the event
 * @param eventType - The type of event
 * @param eventId - UUID of the event these tasks belong to
 * @returns Array of timeline tasks sorted by due date (earliest first)
 *
 * @example
 * ```ts
 * const tasks = generateTimeline('2025-06-15T00:00:00.000Z', 'wedding', 'abc-123');
 * // Returns tasks for phases that haven't passed yet
 * ```
 */
export function generateTimeline(
  eventDate: string,
  eventType: EventType,
  eventId: string,
): TimelineTask[] {
  const eventDateObj = new Date(eventDate);
  const now = new Date();
  const tasks: TimelineTask[] = [];
  const phaseTasks = DEFAULT_TIMELINE_TASKS[eventType];

  for (const phase of TIMELINE_PHASES) {
    const dueDate = calculateDueDate(eventDateObj, phase);
    const phaseTaskTitles = phaseTasks[phase];

    // Include the phase if its due date is today or in the future,
    // OR if it's the "day-of" phase (always include it)
    if (dueDate >= now || phase === 'day-of') {
      for (let i = 0; i < phaseTaskTitles.length; i++) {
        const title = phaseTaskTitles[i];
        if (title !== undefined) {
          tasks.push({
            id: uuidv4(),
            eventId,
            phase,
            title,
            dueDate: dueDate.toISOString(),
            completed: false,
            order: i,
          });
        }
      }
    }
  }

  return tasks;
}

/**
 * Calculates the due date for a given phase by subtracting the phase offset
 * from the event date.
 *
 * @param eventDate - The event date
 * @param phase - The timeline phase
 * @returns Due date for the phase
 */
export function calculateDueDate(eventDate: Date, phase: TimelinePhase): Date {
  const offsetDays = PHASE_OFFSETS[phase];
  const dueDate = new Date(eventDate);
  dueDate.setDate(dueDate.getDate() - offsetDays);
  return dueDate;
}

/**
 * Returns only the applicable timeline phases for an event,
 * filtering out phases whose due dates have already passed.
 *
 * @param eventDate - ISO 8601 date string for the event
 * @returns Array of phases that are still relevant
 */
export function getApplicablePhases(eventDate: string): TimelinePhase[] {
  const eventDateObj = new Date(eventDate);
  const now = new Date();

  return TIMELINE_PHASES.filter((phase) => {
    const dueDate = calculateDueDate(eventDateObj, phase);
    return dueDate >= now || phase === 'day-of';
  });
}

/**
 * Computes the completion percentage for a set of timeline tasks.
 *
 * @param tasks - Array of timeline tasks
 * @returns Percentage (0–100) of tasks completed
 */
export function getTimelineProgress(tasks: TimelineTask[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Groups timeline tasks by their phase for display.
 *
 * @param tasks - Array of timeline tasks
 * @returns Map of phase → tasks, ordered by task order within each phase
 */
export function groupTasksByPhase(tasks: TimelineTask[]): Map<TimelinePhase, TimelineTask[]> {
  const grouped = new Map<TimelinePhase, TimelineTask[]>();

  for (const phase of TIMELINE_PHASES) {
    const phaseTasks = tasks.filter((t) => t.phase === phase).sort((a, b) => a.order - b.order);
    if (phaseTasks.length > 0) {
      grouped.set(phase, phaseTasks);
    }
  }

  return grouped;
}
