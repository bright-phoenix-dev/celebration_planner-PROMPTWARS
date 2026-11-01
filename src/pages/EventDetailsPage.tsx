import { useEffect } from 'react';
import { Link } from '@/lib/router';
import { useEvent } from '@/hooks/useEvent';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

/**
 * Route parameters for EventDetailsPage.
 */
export interface EventDetailsPageProps {
  params: {
    /** Unique UUID identifier of the celebration. */
    id: string;
  };
}

/**
 * Event planning dashboard page for a specific celebration.
 * Loads event state from IndexedDB based on UUID in the route parameter.
 *
 * @param props - Component props containing the event UUID route parameter.
 * @returns Dashboard interface or not-found / loading placeholder.
 */
export default function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { currentEvent, isLoading, loadEvent } = useEvent();

  useEffect(() => {
    if (params.id) {
      void loadEvent(params.id);
    }
  }, [params.id, loadEvent]);

  if (isLoading) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center space-y-4 px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading celebration details...</p>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <h2 className="text-xl font-semibold">Celebration Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This event could not be found or may have been deleted.
            </p>
            <Link href="/">
              <Button variant="outline" className="mt-2">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="no-print mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          All Celebrations
        </Link>
      </div>
      <DashboardTabs />
    </div>
  );
}
