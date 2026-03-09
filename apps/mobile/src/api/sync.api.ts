import { api } from './client';
import { SyncResponse } from './types';

export const syncApi = {
  sync: async (calendarId: string, since: string): Promise<SyncResponse> => {
    const res = await api.get<SyncResponse>('/sync', {
      params: { calendarId, since },
    });
    return res.data;
  },
};
