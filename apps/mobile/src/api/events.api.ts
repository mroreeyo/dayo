import { api } from './client';
import {
  CreateEventDto,
  EventDto,
  ListEventsResponse,
  UpdateEventDto,
} from './types';
import {
  scheduleEventReminder,
  rescheduleEventReminder,
  cancelEventReminder,
} from '../utils/local-notifications';

export const eventsApi = {
  list: async (
    calendarId: string,
    from: string,
    to: string,
    includeOccurrences?: boolean,
  ): Promise<ListEventsResponse> => {
    const res = await api.get<ListEventsResponse>('/events', {
      params: { calendarId, from, to, includeOccurrences },
    });
    return res.data;
  },

  create: async (data: CreateEventDto): Promise<EventDto> => {
    const res = await api.post<EventDto>('/events', data);
    void scheduleEventReminder(res.data);
    return res.data;
  },

  update: async (id: string, data: UpdateEventDto): Promise<EventDto> => {
    const res = await api.patch<EventDto>(`/events/${id}`, data);
    void rescheduleEventReminder(res.data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
    void cancelEventReminder(id);
  },
};
