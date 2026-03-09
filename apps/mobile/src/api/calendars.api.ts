import { api } from './client';
import {
  CalendarSummary,
  CreateCalendarDto,
  ListCalendarsResponse,
  UpdateCalendarDto,
} from './types';

export const calendarsApi = {
  list: async (): Promise<CalendarSummary[]> => {
    const res = await api.get<ListCalendarsResponse>('/calendars');
    return res.data.items;
  },

  create: async (data: CreateCalendarDto): Promise<CalendarSummary> => {
    const res = await api.post<CalendarSummary>('/calendars', data);
    return res.data;
  },

  update: async (
    id: string,
    data: UpdateCalendarDto,
  ): Promise<CalendarSummary> => {
    const res = await api.patch<CalendarSummary>(`/calendars/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/calendars/${id}`);
  },
};
