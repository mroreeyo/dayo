import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';
import { useEventsStore } from '../store/events.store';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

interface DeleteEventVars {
  id: string;
  calendarId: string;
}

export function useDeleteEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteEventVars) => eventsApi.delete(id),
    onSuccess: (_data, { id, calendarId }) => {
      useEventsStore.getState().removeEvents(calendarId, [id]);
      void qc.invalidateQueries({ queryKey: queryKeys.events.byCalendar(calendarId) });
    },
    onError: handleMutationError,
  });
}
