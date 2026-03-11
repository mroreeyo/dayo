import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';
import { UpdateEventDto } from '../api/types';
import { useEventsStore } from '../store/events.store';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

interface UpdateEventVars {
  id: string;
  data: UpdateEventDto;
}

export function useUpdateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateEventVars) => eventsApi.update(id, data),
    onSuccess: (updated) => {
      useEventsStore.getState().upsertEvents(updated.calendarId, [updated]);
      void qc.invalidateQueries({ queryKey: queryKeys.events.byCalendar(updated.calendarId) });
    },
    onError: handleMutationError,
  });
}
