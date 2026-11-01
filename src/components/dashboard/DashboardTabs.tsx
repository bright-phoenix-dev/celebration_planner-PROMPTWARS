'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './OverviewTab';
import { BudgetTab } from '@/components/budget/BudgetTab';
import { TimelineTab } from '@/components/timeline/TimelineTab';
import { VendorsTab } from '@/components/vendors/VendorsTab';
import { IdeasTab } from '@/components/ideas/IdeasTab';
import { ExportButton } from './ExportButton';
import { PrintView } from './PrintView';
import { useEventStore } from '@/store/eventStore';
import { LayoutDashboard, DollarSign, CalendarCheck, Users, Sparkles } from 'lucide-react';

/**
 * Main dashboard view housing the five feature tabs and export triggers.
 */
export function DashboardTabs() {
  const currentEvent = useEventStore((s) => s.currentEvent);

  if (!currentEvent) {
    return null;
  }

  return (
    <>
      <div className="no-print space-y-6">
        <div className="flex flex-col gap-4 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{currentEvent.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Plan and coordinate every detail of your celebration.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton />
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid h-auto w-full max-w-2xl grid-cols-5 p-1">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
              aria-label="Overview tab"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="budget"
              className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
              aria-label="Budget tab"
            >
              <DollarSign className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Budget</span>
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
              aria-label="Timeline tab"
            >
              <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger
              value="vendors"
              className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
              aria-label="Vendors tab"
            >
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Vendors</span>
            </TabsTrigger>
            <TabsTrigger
              value="ideas"
              className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
              aria-label="AI Ideas tab"
            >
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">AI Ideas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 focus-visible:outline-none">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="budget" className="mt-6 focus-visible:outline-none">
            <BudgetTab />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6 focus-visible:outline-none">
            <TimelineTab />
          </TabsContent>

          <TabsContent value="vendors" className="mt-6 focus-visible:outline-none">
            <VendorsTab />
          </TabsContent>

          <TabsContent value="ideas" className="mt-6 focus-visible:outline-none">
            <IdeasTab />
          </TabsContent>
        </Tabs>
      </div>

      <PrintView />
    </>
  );
}
