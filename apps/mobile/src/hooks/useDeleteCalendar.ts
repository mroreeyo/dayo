import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarsApi } from '../api/calendars.api';
import { useCalendarsStore } from '../store/calendars.store';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

export function useDeleteCalendar() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => calendarsApi.delete(id),
    onSuccess: (_data, id) => {
      useCalendarsStore.getState().removeCalendar(id);
      void qc.invalidateQueries({ queryKey: queryKeys.calendars.all });
    },
    onError: handleMutationError,
  });
}
