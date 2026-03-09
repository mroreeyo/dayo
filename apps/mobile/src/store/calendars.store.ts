import { create } from 'zustand';
import { CalendarSummary } from '../api/types';

interface CalendarsState {
  calendarsById: Record<string, CalendarSummary>;
  myCalendarIds: string[];
  currentCalendarId: string | 'all';

  setCalendars: (items: CalendarSummary[]) => void;
  setCurrentCalendar: (id: string | 'all') => void;
  upsertCalendar: (cal: CalendarSummary) => void;
  removeCalendar: (id: string) => void;
}

export const useCalendarsStore = create<CalendarsState>()((set) => ({
  calendarsById: {},
  myCalendarIds: [],
  currentCalendarId: 'all',

  setCalendars: (items) => {
    const calendarsById: Record<string, CalendarSummary> = {};
    const myCalendarIds: string[] = [];
    for (const cal of items) {
      calendarsById[cal.id] = cal;
      myCalendarIds.push(cal.id);
    }
    set({ calendarsById, myCalendarIds });
  },

  setCurrentCalendar: (id) => set({ currentCalendarId: id }),

  upsertCalendar: (cal) =>
    set((state) => {
      const calendarsById = { ...state.calendarsById, [cal.id]: cal };
      const myCalendarIds = state.myCalendarIds.includes(cal.id)
        ? state.myCalendarIds
        : [...state.myCalendarIds, cal.id];
      return { calendarsById, myCalendarIds };
    }),

  removeCalendar: (id) =>
    set((state) => {
      const { [id]: _, ...calendarsById } = state.calendarsById;
      const myCalendarIds = state.myCalendarIds.filter((cid) => cid !== id);
      const currentCalendarId =
        state.currentCalendarId === id ? 'all' : state.currentCalendarId;
      return { calendarsById, myCalendarIds, currentCalendarId };
    }),
}));
