import { useMutation } from '@tanstack/react-query';
import { invitesApi } from '../api/invites.api';
import { handleMutationError } from './use-mutation-error-handler';

export function useCreateInvite() {
  return useMutation({
    mutationFn: (calendarId: string) => invitesApi.create(calendarId),
    onError: handleMutationError,
  });
}
