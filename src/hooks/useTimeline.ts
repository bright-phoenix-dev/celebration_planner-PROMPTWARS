'use client';

import { useMemo, useCallback } from 'react';
import { useEventStore } from '@/store/eventStore';
import { getTimelineProgress, groupTasksByPhase } from '@/lib/timeline';
import type { TimelinePhase, TimelineTask } from '@/types';

/**
 * Hook for timeline management.
 * Provides grouped tasks, progress, and toggle action.
 */
export function useTimeline() {
  const { timelineTasks, toggleTimelineTask } = useEventStore();

  const groupedTasks: Map<TimelinePhase, TimelineTask[]> = useMemo(
    () => groupTasksByPhase(timelineTasks),
    [timelineTasks],
  );

  const progress: number = useMemo(() => getTimelineProgress(timelineTasks), [timelineTasks]);

  const handleToggle = useCallback(
    (taskId: string) => {
      void toggleTimelineTask(taskId);
    },
    [toggleTimelineTask],
  );

  return {
    timelineTasks,
    groupedTasks,
    progress,
    toggleTask: handleToggle,
  };
}
