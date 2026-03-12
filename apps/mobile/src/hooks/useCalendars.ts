import { useQuery } from '@tanstack/react-query';
import { calendarsApi } from '../api/calendars.api';
import { useCalendarsStore } from '../store/calendars.store';
import { queryKeys } from './query-keys';
import { Alert } from 'react-native';
import axios from 'axios';

export function useCalendars() {
  return useQuery({
    queryKey: queryKeys.calendars.list(),
    queryFn: async () => {
      try {
        const items = await calendarsApi.list();
        useCalendarsStore.getState().setCalendars(items);
        return items;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          Alert.alert('충돌 발생');
        }
        throw error;
      }
    },
  });
}
