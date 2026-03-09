import { api } from './client';
import { CreateInviteResponse, JoinByCodeResponse } from './types';

export const invitesApi = {
  create: async (calendarId: string): Promise<CreateInviteResponse> => {
    const res = await api.post<CreateInviteResponse>(
      `/calendars/${calendarId}/invites`,
    );
    return res.data;
  },

  joinByCode: async (code: string): Promise<JoinByCodeResponse> => {
    const res = await api.post<JoinByCodeResponse>(`/invites/${code}/join`);
    return res.data;
  },
};
