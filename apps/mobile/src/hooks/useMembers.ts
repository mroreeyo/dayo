import { useQuery } from '@tanstack/react-query';
import { membersApi } from '../api/members.api';
import { queryKeys } from './query-keys';
import { Alert } from 'react-native';
import axios from 'axios';

export function useMembers(calendarId: string) {
  return useQuery({
    queryKey: queryKeys.members.list(calendarId),
    queryFn: async () => {
      try {
        return await membersApi.list(calendarId);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          Alert.alert('충돌 발생');
        }
        throw error;
      }
    },
    enabled: !!calendarId,
  });
}
