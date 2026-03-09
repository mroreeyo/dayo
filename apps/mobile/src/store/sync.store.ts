import { create } from 'zustand';

interface SyncState {
  lastRevisionByCalendarId: Record<string, string>;

  setRevision: (calendarId: string, revision: string) => void;
  getRevision: (calendarId: string) => string;
}

export const useSyncStore = create<SyncState>()((set, get) => ({
  lastRevisionByCalendarId: {},

  setRevision: (calendarId, revision) =>
    set((state) => ({
      lastRevisionByCalendarId: {
        ...state.lastRevisionByCalendarId,
        [calendarId]: revision,
      },
    })),

  getRevision: (calendarId) =>
    get().lastRevisionByCalendarId[calendarId] ?? '0',
}));
