import { Card, CardContent } from '@/components/ui/card';

/**
 * Loading state skeleton for the event dashboard route.
 */
export default function EventLoading() {
  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-4 w-96 rounded bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-8 w-1/2 rounded bg-muted" />
                <div className="h-2 w-full rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
