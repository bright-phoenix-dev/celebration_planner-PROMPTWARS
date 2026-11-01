import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorsTab } from '@/components/vendors/VendorsTab';
import { useEventStore } from '@/store/eventStore';
import type { CelebrationEvent, Vendor } from '@/types';

describe('VendorsTab Component', () => {
  const mockEvent: CelebrationEvent = {
    id: 'test-event-1',
    type: 'wedding',
    name: 'Celebration Event',
    date: new Date().toISOString(),
    guestCount: 80,
    totalBudget: 15000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockVendors: Vendor[] = [
    {
      id: 'vendor-1',
      eventId: mockEvent.id,
      category: 'Venue',
      name: 'Sunset Hall',
      status: 'to-contact',
      quotedPrice: 3500,
    },
    {
      id: 'vendor-2',
      eventId: mockEvent.id,
      category: 'Caterer',
      status: 'booked',
    },
  ];

  beforeEach(() => {
    useEventStore.setState({
      currentEvent: mockEvent,
      vendors: mockVendors,
      budgetCategories: [],
      timelineTasks: [],
      events: [mockEvent],
      isLoading: false,
    });
  });

  it('renders vendor list and overall progress', () => {
    render(<VendorsTab />);
    expect(screen.getByText('Vendor Checklist')).toBeInTheDocument();
    expect(screen.getByText('1/2 booked')).toBeInTheDocument();
    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByText('— Sunset Hall')).toBeInTheDocument();
  });

  it('allows expanding details and editing vendor details', () => {
    render(<VendorsTab />);

    // Expand details for Venue
    const expandBtn = screen.getByLabelText('Expand details for Venue');
    fireEvent.click(expandBtn);
    expect(screen.getByText('$3,500')).toBeInTheDocument();

    // Edit vendor
    const editBtn = screen.getByLabelText('Edit Venue');
    fireEvent.click(editBtn);

    const nameInput = screen.getByLabelText('Vendor Name');
    fireEvent.change(nameInput, { target: { value: 'Grand Ballroom' } });

    const saveBtn = screen.getByLabelText('Save');
    fireEvent.click(saveBtn);

    expect(screen.getByText('— Grand Ballroom')).toBeInTheDocument();
  });

  it('cancels editing vendor details', () => {
    render(<VendorsTab />);
    const editBtn = screen.getByLabelText('Edit Venue');
    fireEvent.click(editBtn);

    const cancelBtn = screen.getByLabelText('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.getByLabelText('Edit Venue')).toBeInTheDocument();
  });
});
