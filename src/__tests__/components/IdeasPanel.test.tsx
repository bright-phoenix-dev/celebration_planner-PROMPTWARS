import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdeasTab } from '@/components/ideas/IdeasTab';
import { useEventStore } from '@/store/eventStore';
import type { CelebrationEvent } from '@/types';

describe('IdeasTab Component', () => {
  const mockEvent: CelebrationEvent = {
    id: 'test-event-1',
    type: 'wedding',
    name: 'Celebration 2026',
    date: new Date().toISOString(),
    guestCount: 100,
    totalBudget: 20000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    useEventStore.setState({
      currentEvent: mockEvent,
      events: [mockEvent],
      budgetCategories: [],
      timelineTasks: [],
      vendors: [],
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders preferences form fields', () => {
    render(<IdeasTab />);
    expect(screen.getByText('Get AI-Powered Ideas')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme / Style')).toBeInTheDocument();
    expect(screen.getByLabelText('Desired Vibe')).toBeInTheDocument();
    expect(screen.getByLabelText('Venue Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Culture / Traditions')).toBeInTheDocument();
    expect(screen.getByLabelText('Dietary Needs')).toBeInTheDocument();
  });

  it('fetches and displays AI suggestions successfully', async () => {
    const mockResponse = {
      themes: [{ name: 'Starlight Romance', description: 'Deep blues and twinkling lights' }],
      decor: ['Fairy light canopy', 'Glass hurricane vases'],
      menu: [{ item: 'Herb Crusted Salmon', note: 'Gluten-free' }],
      activities: ['Live jazz quartet during cocktail hour'],
      invitations: [{ style: 'Navy foil-pressed', description: 'Celestial theme font' }],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    render(<IdeasTab />);

    fireEvent.change(screen.getByLabelText('Theme / Style'), {
      target: { value: 'Celestial' },
    });

    const submitBtn = screen.getByRole('button', { name: /generate ideas/i });
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        expect(screen.getByText('Starlight Romance')).toBeInTheDocument();
        expect(screen.getByText('Fairy light canopy')).toBeInTheDocument();
        expect(screen.getByText('Herb Crusted Salmon')).toBeInTheDocument();
        expect(screen.getByText('Live jazz quartet during cocktail hour')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Test clear ideas button
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);
    expect(screen.queryByText('Starlight Romance')).not.toBeInTheDocument();
  });
});
