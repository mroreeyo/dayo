import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarsApi } from '../api/calendars.api';
import { UpdateCalendarDto } from '../api/types';
import { useCalendarsStore } from '../store/calendars.store';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

interface UpdateCalendarVars {
  id: string;
  data: UpdateCalendarDto;
}

export function useUpdateCalendar() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateCalendarVars) =>
      calendarsApi.update(id, data),
    onSuccess: (updated) => {
      useCalendarsStore.getState().upsertCalendar(updated);
      void qc.invalidateQueries({ queryKey: queryKeys.calendars.all });
    },
    onError: handleMutationError,
  });
}
