import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetTab } from '@/components/budget/BudgetTab';
import { useEventStore } from '@/store/eventStore';
import type { CelebrationEvent } from '@/types';

describe('BudgetTab Component', () => {
  const mockEvent: CelebrationEvent = {
    id: 'test-event-1',
    type: 'wedding',
    name: 'Sample Celebration',
    date: new Date().toISOString(),
    guestCount: 100,
    totalBudget: 20000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    useEventStore.setState({
      currentEvent: mockEvent,
      budgetCategories: [
        { category: 'venue', plannedAmount: 6000, actualAmount: 0 },
        { category: 'catering', plannedAmount: 5000, actualAmount: 0 },
      ],
      timelineTasks: [],
      vendors: [],
      events: [mockEvent],
      isLoading: false,
    });
  });

  it('renders budget overview cards and categories', () => {
    render(<BudgetTab />);
    expect(screen.getByText('Budget Overview')).toBeInTheDocument();
    // $20,000 appears in Total Budget card and in Remaining card
    expect(screen.getAllByText('$20,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
  });

  it('allows clicking edit to update actual amount for a category', () => {
    render(<BudgetTab />);

    // Click on the edit button for Venue actual amount
    const editBtn = screen.getByLabelText('Edit actual amount for Venue');
    fireEvent.click(editBtn);

    // Input should be visible
    const input = screen.getByLabelText('Actual amount for Venue');
    expect(input).toBeInTheDocument();

    // Change value
    fireEvent.change(input, { target: { value: '6500' } });

    // Save
    const saveBtn = screen.getByLabelText('Save');
    fireEvent.click(saveBtn);

    // Should display new actual amount and warning badge because 6500 > 6000
    expect(screen.getAllByText('$6,500').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Over')).toBeInTheDocument();
  });

  it('allows canceling edit mode', () => {
    render(<BudgetTab />);
    const editBtn = screen.getByLabelText('Edit actual amount for Catering');
    fireEvent.click(editBtn);

    const cancelBtn = screen.getByLabelText('Cancel');
    fireEvent.click(cancelBtn);

    // Cancelled edit, should show static button again
    expect(screen.getByLabelText('Edit actual amount for Catering')).toBeInTheDocument();
  });
});
