import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { BudgetTab } from '@/components/budget/BudgetTab';
import { TimelineTab } from '@/components/timeline/TimelineTab';
import { VendorsTab } from '@/components/vendors/VendorsTab';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { IdeasTab } from '@/components/ideas/IdeasTab';
import { EventTypeSelector } from '@/components/onboarding/EventTypeSelector';
import { EventDetailsForm } from '@/components/onboarding/EventDetailsForm';
import { useEventStore } from '@/store/eventStore';
import type { CelebrationEvent } from '@/types';

describe('Accessibility (axe-core WCAG 2.1 AA audits)', () => {
  const mockEvent: CelebrationEvent = {
    id: 'test-event-1',
    type: 'wedding',
    name: 'Celebration A11y Event',
    date: new Date().toISOString(),
    guestCount: 100,
    totalBudget: 25000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    useEventStore.setState({
      currentEvent: mockEvent,
      budgetCategories: [
        { category: 'venue', plannedAmount: 7500, actualAmount: 3000 },
        { category: 'catering', plannedAmount: 6250, actualAmount: 0 },
      ],
      timelineTasks: [
        {
          id: 'task-1',
          eventId: mockEvent.id,
          phase: '1-month',
          title: 'Confirm caterer',
          dueDate: new Date().toISOString(),
          completed: false,
          order: 0,
        },
      ],
      vendors: [
        {
          id: 'v-1',
          eventId: mockEvent.id,
          category: 'Venue',
          status: 'booked',
          name: 'The Grand Hall',
        },
      ],
      events: [mockEvent],
      isLoading: false,
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  describe('Light Mode (7 screens)', () => {
    it('EventTypeSelector has no axe violations', async () => {
      const { container } = render(<EventTypeSelector onSelect={vi.fn()} />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('EventDetailsForm has no axe violations', async () => {
      const { container } = render(
        <EventDetailsForm eventType="wedding" onSubmit={vi.fn()} onBack={vi.fn()} />,
      );
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('OverviewTab has no axe violations', async () => {
      const { container } = render(<OverviewTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('BudgetTab has no axe violations', async () => {
      const { container } = render(<BudgetTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('TimelineTab has no axe violations', async () => {
      const { container } = render(<TimelineTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('VendorsTab has no axe violations', async () => {
      const { container } = render(<VendorsTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('IdeasTab has no axe violations', async () => {
      const { container } = render(<IdeasTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('Dark Mode (7 screens)', () => {
    beforeEach(() => {
      document.documentElement.classList.add('dark');
    });

    it('EventTypeSelector has no axe violations in dark mode', async () => {
      const { container } = render(<EventTypeSelector onSelect={vi.fn()} />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('EventDetailsForm has no axe violations in dark mode', async () => {
      const { container } = render(
        <EventDetailsForm eventType="wedding" onSubmit={vi.fn()} onBack={vi.fn()} />,
      );
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('OverviewTab has no axe violations in dark mode', async () => {
      const { container } = render(<OverviewTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('BudgetTab has no axe violations in dark mode', async () => {
      const { container } = render(<BudgetTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('TimelineTab has no axe violations in dark mode', async () => {
      const { container } = render(<TimelineTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('VendorsTab has no axe violations in dark mode', async () => {
      const { container } = render(<VendorsTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });

    it('IdeasTab has no axe violations in dark mode', async () => {
      const { container } = render(<IdeasTab />);
      const results = await axe.run(container);
      expect(results.violations).toEqual([]);
    });
  });
});
