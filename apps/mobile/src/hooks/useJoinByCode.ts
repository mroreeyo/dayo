import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitesApi } from '../api/invites.api';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

export function useJoinByCode() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => invitesApi.joinByCode(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.calendars.all });
    },
    onError: handleMutationError,
  });
}
