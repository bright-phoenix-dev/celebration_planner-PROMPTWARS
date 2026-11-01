'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateEventSchema } from '@/schemas/event';
import { EVENT_TYPE_LABELS } from '@/schemas';
import type { EventType, CreateEventInput } from '@/types';

interface EventDetailsFormProps {
  eventType: EventType;
  onSubmit: (data: CreateEventInput) => void;
  onBack: () => void;
}

/**
 * Step 2 of onboarding: enter event details (name, date, guests, budget).
 */
export function EventDetailsForm({ eventType, onSubmit, onBack }: EventDetailsFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      type: eventType,
      name: name.trim(),
      date: date ? new Date(date).toISOString() : '',
      guestCount: parseInt(guestCount, 10) || 0,
      totalBudget: parseFloat(totalBudget) || 0,
    };

    const result = CreateEventSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Plan Your {EVENT_TYPE_LABELS[eventType]}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="e.g. Sarah & John's Wedding"
              maxLength={100}
              aria-describedby={errors['name'] ? 'name-error' : undefined}
              aria-invalid={!!errors['name']}
            />
            {errors['name'] && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {errors['name']}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-date">Event Date</Label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
              }}
              aria-describedby={errors['date'] ? 'date-error' : undefined}
              aria-invalid={!!errors['date']}
            />
            {errors['date'] && (
              <p id="date-error" className="text-sm text-destructive" role="alert">
                {errors['date']}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-count">Expected Guests</Label>
            <Input
              id="guest-count"
              type="number"
              min={1}
              max={10000}
              value={guestCount}
              onChange={(e) => {
                setGuestCount(e.target.value);
              }}
              placeholder="e.g. 150"
              aria-describedby={errors['guestCount'] ? 'guests-error' : undefined}
              aria-invalid={!!errors['guestCount']}
            />
            {errors['guestCount'] && (
              <p id="guests-error" className="text-sm text-destructive" role="alert">
                {errors['guestCount']}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-budget">Total Budget (USD)</Label>
            <Input
              id="total-budget"
              type="number"
              min={0}
              step={100}
              value={totalBudget}
              onChange={(e) => {
                setTotalBudget(e.target.value);
              }}
              placeholder="e.g. 25000"
              aria-describedby={errors['totalBudget'] ? 'budget-error' : undefined}
              aria-invalid={!!errors['totalBudget']}
            />
            {errors['totalBudget'] && (
              <p id="budget-error" className="text-sm text-destructive" role="alert">
                {errors['totalBudget']}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="flex-1">
              Create Event Plan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
