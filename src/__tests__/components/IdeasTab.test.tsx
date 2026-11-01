import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdeasTab } from '@/components/ideas/IdeasTab';
import { useEventStore } from '@/store/eventStore';
import type { CelebrationEvent } from '@/types';

describe('IdeasTab Component — AI Failure Modes & Recovery', () => {
  const mockEvent: CelebrationEvent = {
    id: 'event-ideas-1',
    type: 'wedding',
    name: 'Ideas Test Wedding',
    date: '2027-06-15T00:00:00.000Z',
    guestCount: 100,
    totalBudget: 25000,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    useEventStore.setState({
      currentEvent: mockEvent,
      isLoading: false,
    });
  });

  it('renders friendly error when API key is missing (503)', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: 'AI service is not configured' }),
    });

    render(<IdeasTab />);

    const generateBtn = screen.getByRole('button', { name: /Generate Ideas/i });
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('AI service is not configured')).toBeInTheDocument();
    });
  });

  it('renders friendly error when rate limit is exceeded (429)', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () =>
        Promise.resolve({
          error: 'Too many requests. Please wait a minute before trying again.',
        }),
    });

    render(<IdeasTab />);

    const generateBtn = screen.getByRole('button', { name: /Generate Ideas/i });
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(/Too many requests. Please wait a minute before trying again./i),
      ).toBeInTheDocument();
    });
  });

  it('renders friendly error on network failure / offline and recovers on retry', async () => {
    const user = userEvent.setup();

    // 1. First attempt fails due to network failure
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error: connection refused'));

    render(<IdeasTab />);

    const generateBtn = screen.getByRole('button', { name: /Generate Ideas/i });
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Network error: connection refused/i)).toBeInTheDocument();
    });

    // 2. Recovery: Next attempt succeeds with structured ideas
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          themes: [{ name: 'Enchanted Forest', description: 'Fairytale moss and string lights' }],
          decor: ['Botanical arches'],
          menu: [{ item: 'Wild Mushroom Risotto', note: 'Vegetarian' }],
          activities: ['String quartet'],
          invitations: [{ style: 'Pressed floral', description: 'Handcrafted paper' }],
        }),
    });

    // Click retry
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('Enchanted Forest')).toBeInTheDocument();
      expect(screen.getByText('Wild Mushroom Risotto')).toBeInTheDocument();
    });
  });
});
