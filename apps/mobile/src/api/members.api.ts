import { api } from './client';
import {
  ListMembersResponse,
  MemberDto,
  MemberRole,
  UpdateMemberRoleDto,
} from './types';

export const membersApi = {
  list: async (calendarId: string): Promise<MemberDto[]> => {
    const res = await api.get<ListMembersResponse>(
      `/calendars/${calendarId}/members`,
    );
    return res.data.items;
  },

  updateRole: async (
    calendarId: string,
    userId: string,
    role: MemberRole,
  ): Promise<MemberDto> => {
    const body: UpdateMemberRoleDto = { role };
    const res = await api.patch<MemberDto>(
      `/calendars/${calendarId}/members/${userId}`,
      body,
    );
    return res.data;
  },

  remove: async (calendarId: string, userId: string): Promise<void> => {
    await api.delete(`/calendars/${calendarId}/members/${userId}`);
  },
};
