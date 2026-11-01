import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineTab } from '@/components/timeline/TimelineTab';
import { useEventStore } from '@/store/eventStore';
import type { CelebrationEvent, TimelineTask } from '@/types';

describe('TimelineTab Component', () => {
  const mockEvent: CelebrationEvent = {
    id: 'test-event-1',
    type: 'birthday',
    name: 'Celebration 40',
    date: new Date(Date.now() + 86400000 * 30).toISOString(),
    guestCount: 50,
    totalBudget: 5000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTasks: TimelineTask[] = [
    {
      id: 'task-1',
      eventId: mockEvent.id,
      phase: '1-month',
      title: 'Send invitations',
      dueDate: new Date().toISOString(),
      completed: false,
      order: 0,
    },
    {
      id: 'task-2',
      eventId: mockEvent.id,
      phase: '1-month',
      title: 'Order cake',
      dueDate: new Date().toISOString(),
      completed: true,
      order: 1,
    },
  ];

  beforeEach(() => {
    useEventStore.setState({
      currentEvent: mockEvent,
      timelineTasks: mockTasks,
      budgetCategories: [],
      vendors: [],
      events: [mockEvent],
      isLoading: false,
    });
  });

  it('renders progress and tasks grouped by phase', () => {
    render(<TimelineTab />);
    expect(screen.getByText('Timeline Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument(); // 1 of 2 completed
    expect(screen.getByText('1 Month Before')).toBeInTheDocument();
    expect(screen.getByText('Send invitations')).toBeInTheDocument();
    expect(screen.getByText('Order cake')).toBeInTheDocument();
  });

  it('toggles task completion when clicked', () => {
    render(<TimelineTab />);

    const incompleteBtn = screen.getByLabelText('Mark complete: Send invitations');
    fireEvent.click(incompleteBtn);

    // Now both should be completed (100%)
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });
});
