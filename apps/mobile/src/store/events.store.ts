import { create } from 'zustand';
import { EventDto } from '../api/types';

interface EventsState {
  eventsByCalendarId: Record<string, Record<string, EventDto>>;

  upsertEvents: (calendarId: string, events: EventDto[]) => void;
  removeEvents: (calendarId: string, ids: string[]) => void;
  getEventsForCalendar: (calendarId: string) => EventDto[];
}

export const useEventsStore = create<EventsState>()((set, get) => ({
  eventsByCalendarId: {},

  upsertEvents: (calendarId, events) =>
    set((state) => {
      const bucket = { ...state.eventsByCalendarId[calendarId] };
      for (const evt of events) {
        bucket[evt.id] = evt;
      }
      return {
        eventsByCalendarId: {
          ...state.eventsByCalendarId,
          [calendarId]: bucket,
        },
      };
    }),

  removeEvents: (calendarId, ids) =>
    set((state) => {
      const bucket = { ...state.eventsByCalendarId[calendarId] };
      for (const id of ids) {
        delete bucket[id];
      }
      return {
        eventsByCalendarId: {
          ...state.eventsByCalendarId,
          [calendarId]: bucket,
        },
      };
    }),

  getEventsForCalendar: (calendarId) =>
    Object.values(get().eventsByCalendarId[calendarId] ?? {}),
}));
