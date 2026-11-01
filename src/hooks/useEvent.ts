'use client';

import { useCallback } from 'react';
import { useEventStore } from '@/store/eventStore';
import type { CreateEventInput } from '@/types';

/**
 * Hook for event CRUD operations.
 * Provides create, load, and delete actions with store integration.
 */
export function useEvent() {
  const {
    currentEvent,
    events,
    isLoading,
    createEvent,
    loadEventById,
    loadAllSavedEvents,
    removeEvent,
    updateEvent,
  } = useEventStore();

  const handleCreateEvent = useCallback(
    async (input: CreateEventInput): Promise<string> => {
      return createEvent(input);
    },
    [createEvent],
  );

  const handleLoadEvent = useCallback(
    async (id: string): Promise<void> => {
      await loadEventById(id);
    },
    [loadEventById],
  );

  const handleDeleteEvent = useCallback(
    async (id: string): Promise<void> => {
      await removeEvent(id);
    },
    [removeEvent],
  );

  return {
    currentEvent,
    events,
    isLoading,
    createEvent: handleCreateEvent,
    loadEvent: handleLoadEvent,
    loadAllEvents: loadAllSavedEvents,
    deleteEvent: handleDeleteEvent,
    updateEvent,
  };
}
