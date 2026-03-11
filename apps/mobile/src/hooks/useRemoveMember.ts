import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/members.api';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

interface RemoveMemberVars {
  calendarId: string;
  userId: string;
}

export function useRemoveMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ calendarId, userId }: RemoveMemberVars) =>
      membersApi.remove(calendarId, userId),
    onSuccess: (_data, { calendarId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.members.list(calendarId) });
    },
    onError: handleMutationError,
  });
}
