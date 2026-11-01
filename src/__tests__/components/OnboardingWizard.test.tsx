import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

const pushMock = vi.fn();

vi.mock('@/lib/router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('OnboardingWizard Component', () => {
  it('guides the user from selecting event type to entering details and submits', async () => {
    render(<OnboardingWizard />);

    // Step 1: Event type selection
    expect(screen.getByText('What are we celebrating?')).toBeInTheDocument();
    const weddingOption = screen.getByLabelText('Plan a Wedding');
    fireEvent.click(weddingOption);

    // Step 2: Details form
    expect(screen.getByText('Plan Your Wedding')).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Event Name');
    const dateInput = screen.getByLabelText('Event Date');
    const guestsInput = screen.getByLabelText('Expected Guests');
    const budgetInput = screen.getByLabelText('Total Budget (USD)');

    fireEvent.change(nameInput, { target: { value: 'Emma & Liam Wedding' } });
    fireEvent.change(dateInput, { target: { value: '2026-11-20' } });
    fireEvent.change(guestsInput, { target: { value: '120' } });
    fireEvent.change(budgetInput, { target: { value: '25000' } });

    const submitBtn = screen.getByRole('button', { name: 'Create Event Plan' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/event/'));
    });
  });

  it('validates required fields in step 2 and shows error messages', () => {
    render(<OnboardingWizard />);

    fireEvent.click(screen.getByLabelText('Plan a Birthday'));
    const submitBtn = screen.getByRole('button', { name: 'Create Event Plan' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Event name is required')).toBeInTheDocument();
  });
});
