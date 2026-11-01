import { useEffect, useState } from 'react';
import { Link } from '@/lib/router';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useEvent } from '@/hooks/useEvent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EVENT_TYPE_LABELS } from '@/schemas';
import { formatDate, formatCurrency } from '@/lib/constants';
import { PlusCircle, Calendar, Trash2, ArrowRight } from 'lucide-react';

/**
 * Main landing page allowing onboarding for new celebrations
 * or resuming previously saved plans from IndexedDB.
 */
export default function HomePage() {
  const { events, loadAllEvents, deleteEvent } = useEvent();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    void loadAllEvents();
  }, [loadAllEvents]);

  // If there are no saved events, show wizard directly
  if (events.length === 0 || showWizard) {
    return (
      <div className="container mx-auto py-8">
        {events.length > 0 && (
          <div className="mx-auto mb-4 max-w-3xl px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowWizard(false);
              }}
            >
              &larr; Back to Saved Celebrations
            </Button>
          </div>
        )}
        <OnboardingWizard />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Celebrations</h1>
          <p className="mt-1 text-muted-foreground">
            Continue planning your events or create a new celebration.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowWizard(true);
          }}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Plan New Celebration
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card
            key={event.id}
            className="group transition-all hover:border-primary/50 hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
              </div>
              <CardTitle className="line-clamp-1 text-lg group-hover:text-primary">
                {event.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div>
                  <span>
                    Guests: <strong>{event.guestCount}</strong>
                  </span>
                  <span className="mx-2">&bull;</span>
                  <span>
                    Budget: <strong>{formatCurrency(event.totalBudget)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${event.name}"?`)) {
                      void deleteEvent(event.id);
                    }
                  }}
                  aria-label={`Delete event ${event.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Link href={`/event/${event.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    Open Plan
                    <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
