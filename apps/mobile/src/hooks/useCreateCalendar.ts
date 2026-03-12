import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarsApi } from '../api/calendars.api';
import { CreateCalendarDto } from '../api/types';
import { useCalendarsStore } from '../store/calendars.store';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

export function useCreateCalendar() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCalendarDto) => calendarsApi.create(data),
    onSuccess: (created) => {
      useCalendarsStore.getState().upsertCalendar(created);
      void qc.invalidateQueries({ queryKey: queryKeys.calendars.all });
    },
    onError: handleMutationError,
  });
}
