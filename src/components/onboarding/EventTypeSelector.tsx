'use client';

import { Heart, Cake, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { EventType } from '@/types';

interface EventTypeSelectorProps {
  onSelect: (type: EventType) => void;
}

const EVENT_OPTIONS: { type: EventType; label: string; description: string; icon: typeof Heart }[] =
  [
    {
      type: 'wedding',
      label: 'Wedding',
      description: 'Plan your dream wedding ceremony and reception',
      icon: Heart,
    },
    {
      type: 'birthday',
      label: 'Birthday',
      description: 'Organize an unforgettable birthday celebration',
      icon: Cake,
    },
    {
      type: 'community',
      label: 'Community Event',
      description: 'Coordinate a community gathering, festival, or fundraiser',
      icon: Users,
    },
  ];

/**
 * Step 1 of onboarding: select event type.
 */
export function EventTypeSelector({ onSelect }: EventTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What are we celebrating?</h2>
        <p className="mt-2 text-muted-foreground">
          Choose your event type to get started with a tailored plan.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {EVENT_OPTIONS.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            onClick={() => {
              onSelect(type);
            }}
            className="text-left"
            aria-label={`Plan a ${label}`}
          >
            <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <Icon className="h-10 w-10 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{label}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
