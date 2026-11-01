import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { PrintView } from '@/components/dashboard/PrintView';
import { useEventStore } from '@/store/eventStore';
import type { CelebrationEvent } from '@/types';

describe('Dashboard Components', () => {
  const mockEvent: CelebrationEvent = {
    id: 'test-event-1',
    type: 'wedding',
    name: 'Sophia & William Celebration',
    date: new Date('2026-10-15T00:00:00.000Z').toISOString(),
    guestCount: 150,
    totalBudget: 30000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    useEventStore.setState({
      currentEvent: mockEvent,
      events: [mockEvent],
      budgetCategories: [
        { category: 'venue', plannedAmount: 9000, actualAmount: 9500 },
        { category: 'catering', plannedAmount: 7500, actualAmount: 5000 },
      ],
      timelineTasks: [
        {
          id: 't-1',
          eventId: mockEvent.id,
          phase: '1-month',
          title: 'Finalize RSVP',
          dueDate: new Date().toISOString(),
          completed: true,
          order: 0,
        },
      ],
      vendors: [
        {
          id: 'v-1',
          eventId: mockEvent.id,
          category: 'Venue',
          name: 'The Ballroom',
          status: 'booked',
          quotedPrice: 9500,
        },
      ],
      isLoading: false,
    });
  });

  describe('OverviewTab', () => {
    it('renders event summary, key metrics, and budget alerts', () => {
      render(<OverviewTab />);
      expect(screen.getByText('Sophia & William Celebration')).toBeInTheDocument();
      expect(screen.getByText('Wedding')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Vendors')).toBeInTheDocument();
      expect(screen.getByText('Budget Alerts')).toBeInTheDocument();
    });
  });

  describe('ExportButton', () => {
    it('triggers export when clicked', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(vi.fn());
      render(<ExportButton />);
      const btn = screen.getByRole('button', { name: /export or print/i });
      fireEvent.click(btn);
      expect(printSpy).toHaveBeenCalledTimes(1);
      printSpy.mockRestore();
    });
  });

  describe('PrintView', () => {
    it('renders printable report content', () => {
      const { container } = render(<PrintView />);
      expect(container.querySelector('.print-only')).toBeInTheDocument();
      expect(screen.getByText('Budget Allocation')).toBeInTheDocument();
      expect(screen.getByText('Timeline & Tasks')).toBeInTheDocument();
      expect(screen.getByText('The Ballroom')).toBeInTheDocument();
    });
  });

  describe('DashboardTabs', () => {
    it('renders all 5 tab triggers and initial overview content', () => {
      render(<DashboardTabs />);
      // Title appears in both main header and print view
      expect(screen.getAllByText('Sophia & William Celebration').length).toBeGreaterThanOrEqual(1);

      // Verify all 5 tab triggers are accessible
      expect(screen.getByRole('tab', { name: /overview tab/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /budget tab/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /timeline tab/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /vendors tab/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ai ideas tab/i })).toBeInTheDocument();

      // Initial overview content should be rendered
      expect(screen.getByText('Wedding')).toBeInTheDocument();
      expect(screen.getByText('Budget Alerts')).toBeInTheDocument();
    });
  });
});
