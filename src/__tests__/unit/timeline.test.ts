import { describe, it, expect } from 'vitest';
import {
  generateTimeline,
  calculateDueDate,
  getTimelineProgress,
  groupTasksByPhase,
} from '@/lib/timeline';
import type { TimelineTask } from '@/types';

describe('Timeline Generator Logic', () => {
  const eventId = 'test-event-uuid';

  describe('generateTimeline', () => {
    it('generates tasks across all phases for an event 14 months away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 420); // 14 months in future
      const tasks = generateTimeline(futureDate.toISOString(), 'wedding', eventId);

      expect(tasks.length).toBeGreaterThan(0);
      const phases = new Set(tasks.map((t) => t.phase));
      expect(phases.has('12-months')).toBe(true);
      expect(phases.has('day-of')).toBe(true);
    });

    it('collapses past phases when event is only 2 weeks away', () => {
      const nearDate = new Date();
      nearDate.setDate(nearDate.getDate() + 14); // 2 weeks in future
      const tasks = generateTimeline(nearDate.toISOString(), 'birthday', eventId);

      const phases = new Set(tasks.map((t) => t.phase));
      expect(phases.has('12-months')).toBe(false);
      expect(phases.has('6-months')).toBe(false);
      expect(phases.has('1-week')).toBe(true);
      expect(phases.has('day-of')).toBe(true);
    });

    it('always preserves day-of phase even if event date is today or past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const tasks = generateTimeline(pastDate.toISOString(), 'community', eventId);

      const phases = new Set(tasks.map((t) => t.phase));
      expect(phases.has('day-of')).toBe(true);
    });
  });

  describe('calculateDueDate', () => {
    it('calculates due date by subtracting offset days', () => {
      const targetDate = new Date('2026-12-01T00:00:00.000Z');
      const oneMonthBefore = calculateDueDate(targetDate, '1-month'); // 30 days before
      const expected = new Date('2026-11-01T00:00:00.000Z');

      expect(oneMonthBefore.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });
  });

  describe('getTimelineProgress', () => {
    it('returns 0 for empty task list', () => {
      expect(getTimelineProgress([])).toBe(0);
    });

    it('computes percentage correctly', () => {
      const tasks: TimelineTask[] = [
        {
          id: '1',
          eventId: 'e1',
          phase: '1-month',
          title: 'T1',
          dueDate: new Date().toISOString(),
          completed: true,
          order: 0,
        },
        {
          id: '2',
          eventId: 'e1',
          phase: '1-month',
          title: 'T2',
          dueDate: new Date().toISOString(),
          completed: false,
          order: 1,
        },
      ];

      expect(getTimelineProgress(tasks)).toBe(50);
    });
  });

  describe('groupTasksByPhase', () => {
    it('groups and orders tasks by phase', () => {
      const tasks: TimelineTask[] = [
        {
          id: '1',
          eventId: 'e1',
          phase: 'day-of',
          title: 'Sound check',
          dueDate: new Date().toISOString(),
          completed: false,
          order: 2,
        },
        {
          id: '2',
          eventId: 'e1',
          phase: 'day-of',
          title: 'Arrive early',
          dueDate: new Date().toISOString(),
          completed: false,
          order: 1,
        },
      ];

      const grouped = groupTasksByPhase(tasks);
      const dayOfTasks = grouped.get('day-of');
      expect(dayOfTasks).toBeDefined();
      expect(dayOfTasks?.[0]?.order).toBe(1);
      expect(dayOfTasks?.[1]?.order).toBe(2);
    });
  });
});
