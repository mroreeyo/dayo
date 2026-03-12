import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';
import { useEventsStore } from '../store/events.store';
import { queryKeys } from './query-keys';
import { Alert } from 'react-native';
import axios from 'axios';

export function useEvents(
  calendarId: string,
  from: string,
  to: string,
  includeOccurrences?: boolean,
) {
  return useQuery({
    queryKey: queryKeys.events.list(calendarId, from, to),
    queryFn: async () => {
      try {
        const response = await eventsApi.list(calendarId, from, to, includeOccurrences);
        useEventsStore.getState().upsertEvents(calendarId, response.items);
        return response;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          Alert.alert('충돌 발생');
        }
        throw error;
      }
    },
    enabled: !!calendarId && !!from && !!to,
  });
}
