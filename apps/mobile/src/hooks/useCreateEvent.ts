import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';
import { CreateEventDto } from '../api/types';
import { useEventsStore } from '../store/events.store';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

export function useCreateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventDto) => eventsApi.create(data),
    onSuccess: (created) => {
      useEventsStore.getState().upsertEvents(created.calendarId, [created]);
      void qc.invalidateQueries({ queryKey: queryKeys.events.byCalendar(created.calendarId) });
    },
    onError: handleMutationError,
  });
}
