'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/router';
import { EventTypeSelector } from './EventTypeSelector';
import { EventDetailsForm } from './EventDetailsForm';
import { useEvent } from '@/hooks/useEvent';
import type { EventType, CreateEventInput } from '@/types';

/**
 * Multi-step onboarding wizard for creating a new event.
 * Step 1: Choose event type → Step 2: Enter details → Redirect to dashboard.
 */
export function OnboardingWizard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const { createEvent } = useEvent();
  const router = useRouter();

  const handleTypeSelect = (type: EventType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleSubmit = async (input: CreateEventInput) => {
    const id = await createEvent(input);
    router.push(`/event/${id}`);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedType(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Progress indicator */}
      <nav aria-label="Onboarding progress" className="mb-8">
        <ol className="flex items-center justify-center gap-4 text-sm">
          <li
            className={`flex items-center gap-2 ${step >= 1 ? 'font-medium text-primary' : 'text-muted-foreground'}`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              aria-current={step === 1 ? 'step' : undefined}
            >
              1
            </span>
            Event Type
          </li>
          <li aria-hidden="true" className="h-px w-8 bg-border" />
          <li
            className={`flex items-center gap-2 ${step >= 2 ? 'font-medium text-primary' : 'text-muted-foreground'}`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              aria-current={step === 2 ? 'step' : undefined}
            >
              2
            </span>
            Details
          </li>
        </ol>
      </nav>

      {step === 1 && <EventTypeSelector onSelect={handleTypeSelect} />}
      {step === 2 && selectedType && (
        <EventDetailsForm
          eventType={selectedType}
          onSubmit={(data) => void handleSubmit(data)}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
