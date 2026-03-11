import { useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../api/members.api';
import { MemberRole } from '../api/types';
import { queryKeys } from './query-keys';
import { handleMutationError } from './use-mutation-error-handler';

interface UpdateMemberRoleVars {
  calendarId: string;
  userId: string;
  role: MemberRole;
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ calendarId, userId, role }: UpdateMemberRoleVars) =>
      membersApi.updateRole(calendarId, userId, role),
    onSuccess: (_data, { calendarId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.members.list(calendarId) });
    },
    onError: handleMutationError,
  });
}
